import { pbkdf2Async } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { getRandomBytesAsync } from "expo-crypto";
export interface PasswordDigest {
  salt: string;
  hash: string;
  iterations: number;
}
export async function hashPassword(password: string): Promise<PasswordDigest> {
  const salt = bytesToHex(await getRandomBytesAsync(16));
  const iterations = 600000;
  const hash = bytesToHex(
    await pbkdf2Async(sha256, password, hexToBytes(salt), {
      c: iterations,
      dkLen: 32,
    }),
  );
  return { salt, hash, iterations };
}
export async function verifyPassword(
  password: string,
  digest: PasswordDigest,
): Promise<boolean> {
  if (
    !digest ||
    !/^[a-f0-9]{32}$/.test(digest.salt) ||
    !/^[a-f0-9]{64}$/.test(digest.hash) ||
    !Number.isInteger(digest.iterations) ||
    digest.iterations < 100000 ||
    digest.iterations > 1000000
  )
    return false;
  const candidate = await pbkdf2Async(
    sha256,
    password,
    hexToBytes(digest.salt),
    { c: digest.iterations, dkLen: 32 },
  );
  const expected = hexToBytes(digest.hash);
  let difference = 0;
  for (let i = 0; i < candidate.length; i++)
    difference |= candidate[i] ^ expected[i];
  return difference === 0;
}
