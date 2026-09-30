interface Keychain {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}
// A generation manifest makes multi-part writes atomic from the reader's view.
export function secureSessionStorage(
  keychain: Keychain,
  generation: () => string,
) {
  let pending: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const task = pending.catch(() => {}).then(work);
    pending = task;
    return task;
  };
  const readManifest = async (
    key: string,
  ): Promise<{ id: string; count: number } | null> => {
    const raw = await keychain.getItemAsync(`${key}.manifest`);
    if (!raw) return null;
    const m = JSON.parse(raw);
    if (
      typeof m.id !== "string" ||
      !/^[A-Za-z0-9-]+$/.test(m.id) ||
      !Number.isInteger(m.count) ||
      m.count < 1 ||
      m.count > 256
    )
      throw new Error("Unreadable session");
    return m;
  };
  const clean = async (key: string, m: { id: string; count: number }) => {
    await Promise.all(
      Array.from({ length: m.count }, (_, i) =>
        keychain.deleteItemAsync(`${key}.${m.id}.${i}`),
      ),
    );
  };
  return {
    getItem: (key: string) =>
      serial(async () => {
        const m = await readManifest(key);
        if (!m) return null;
        const chunks = await Promise.all(
          Array.from({ length: m.count }, (_, i) =>
            keychain.getItemAsync(`${key}.${m.id}.${i}`),
          ),
        );
        if (chunks.some((c) => c === null))
          throw new Error("Incomplete session");
        return chunks.join("");
      }),
    setItem: (key: string, value: string) =>
      serial(async () => {
        if (value.length > 76800) throw new Error("Session is too large");
        const previous = await readManifest(key);
        const characters = Array.from(value);
        const m = {
          id: generation(),
          count: Math.max(1, Math.ceil(characters.length / 300)),
        };
        try {
          for (let i = 0; i < m.count; i++)
            await keychain.setItemAsync(
              `${key}.${m.id}.${i}`,
              characters.slice(i * 300, (i + 1) * 300).join(""),
            );
          await keychain.setItemAsync(`${key}.manifest`, JSON.stringify(m));
        } catch (e) {
          await clean(key, m).catch(() => {});
          throw e;
        }
        if (previous) await clean(key, previous).catch(() => {});
      }),
    removeItem: (key: string) =>
      serial(async () => {
        const m = await readManifest(key);
        await keychain.deleteItemAsync(`${key}.manifest`);
        if (m) await clean(key, m);
      }),
  };
}
