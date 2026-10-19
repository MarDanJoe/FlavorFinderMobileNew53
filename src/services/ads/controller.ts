type ConsentInfo = {
  canRequestAds: boolean;
  privacyOptionsRequirementStatus: string;
};
type State = {
  ready: boolean;
  privacyRequired: boolean;
  busy: boolean;
  message: string;
  revision: number;
};
export type AdsDependencies = {
  gatherConsent: () => Promise<ConsentInfo>;
  showPrivacyOptionsForm: () => Promise<ConsentInfo>;
  configure: () => Promise<unknown>;
  initialize: () => Promise<unknown>;
};
export function createAdsController(deps: AdsDependencies) {
  let state: State = {
    ready: false,
    privacyRequired: false,
    busy: false,
    message: "",
    revision: 0,
  };
  let initialized = false;
  let pending: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<State>) => {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  const apply = async (info: ConsentInfo) => {
    publish({
      privacyRequired: info.privacyOptionsRequirementStatus === "REQUIRED",
    });
    if (!info.canRequestAds) {
      publish({ ready: false });
      return;
    }
    if (!initialized) {
      await deps.configure();
      await deps.initialize();
      initialized = true;
    }
    publish({ ready: true, revision: state.revision + 1 });
  };
  const run = (privacy: boolean) => {
    if (pending) return pending;
    publish({ busy: true, ready: false, message: "" });
    pending = (async () => {
      try {
        await apply(
          await (privacy
            ? deps.showPrivacyOptionsForm()
            : deps.gatherConsent()),
        );
      } catch {
        publish({
          ready: false,
          message: "Ads are unavailable. You can keep using Flavor Finder.",
        });
      } finally {
        pending = null;
        publish({ busy: false });
      }
    })();
    return pending;
  };
  let started = false;
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start: () => {
      if (started) return pending ?? Promise.resolve();
      started = true;
      return run(false);
    },
    privacy: () => (state.privacyRequired ? run(true) : Promise.resolve()),
  };
}
