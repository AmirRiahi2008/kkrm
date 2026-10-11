"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Download, RefreshCw, WifiOff } from "lucide-react";
import { useLocale } from "./locale-provider";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type Device = "android" | "ios" | "desktop";
type PwaContextValue = {
  installed: boolean;
  installing: boolean;
  canInstall: boolean;
  online: boolean;
  device: Device;
  state: "checking" | "ready" | "unsupported" | "error";
  install: () => Promise<"accepted" | "dismissed" | "unavailable" | "failed">;
};
const PwaContext = createContext<PwaContextValue | null>(null);

function subscribeConnectivity(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function subscribeDisplay(callback: () => void) {
  const display = window.matchMedia("(display-mode: standalone)");
  display.addEventListener("change", callback);
  return () => display.removeEventListener("change", callback);
}

function subscribeStatic() {
  return () => {};
}

function browserDevice(): Device {
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios
    ? "ios"
    : /Android/i.test(navigator.userAgent)
      ? "android"
      : "desktop";
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [eventInstalled, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [registrationState, setState] =
    useState<PwaContextValue["state"]>("checking");
  const online = useSyncExternalStore(
    subscribeConnectivity,
    () => navigator.onLine,
    () => true,
  );
  const device = useSyncExternalStore(
    subscribeStatic,
    browserDevice,
    () => "android" as Device,
  );
  const standalone = useSyncExternalStore(
    subscribeDisplay,
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    () => false,
  );
  const supported = useSyncExternalStore(
    subscribeStatic,
    () =>
      process.env.NODE_ENV === "production" &&
      window.isSecureContext &&
      "serviceWorker" in navigator,
    () => true,
  );
  const installed = eventInstalled || standalone;
  const state = supported ? registrationState : "unsupported";
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const reloadForUpdate = useRef(false);
  const installLock = useRef(false);
  const privatePage = /^\/(?:en\/)?(?:admin|auth)(?:\/|$)/.test(pathname);

  useEffect(() => {
    let active = true;
    let installingWorker: ServiceWorker | null = null;
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const didInstall = () => {
      setInstalled(true);
      setPrompt(null);
      setInstalling(false);
    };
    const controllerChanged = () => {
      if (reloadForUpdate.current) window.location.reload();
    };
    const workerChanged = () => {
      if (!active) return;
      if (
        installingWorker?.state === "redundant" &&
        !registration.current?.active
      )
        setState("error");
      if (
        installingWorker?.state === "installed" &&
        navigator.serviceWorker.controller
      )
        setUpdateReady(true);
    };
    const updateFound = () => {
      installingWorker?.removeEventListener("statechange", workerChanged);
      installingWorker = registration.current?.installing || null;
      installingWorker?.addEventListener("statechange", workerChanged);
    };
    async function register() {
      try {
        const value = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (!active) return;
        registration.current = value;
        setUpdateReady(
          Boolean(value.waiting && navigator.serviceWorker.controller),
        );
        value.addEventListener("updatefound", updateFound);
        if (value.installing) updateFound();
        await navigator.serviceWorker.ready;
        if (active) setState("ready");
      } catch {
        if (active) setState("error");
      }
    }
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", didInstall);
    if (
      process.env.NODE_ENV === "production" &&
      window.isSecureContext &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        controllerChanged,
      );
      void register();
    }
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", didInstall);
      if ("serviceWorker" in navigator)
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          controllerChanged,
        );
      registration.current?.removeEventListener("updatefound", updateFound);
      installingWorker?.removeEventListener("statechange", workerChanged);
    };
  }, []);

  async function install(): ReturnType<PwaContextValue["install"]> {
    if (!prompt || installed || installLock.current || state !== "ready")
      return "unavailable";
    installLock.current = true;
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      setPrompt(null);
      return outcome;
    } catch {
      setPrompt(null);
      return "failed";
    } finally {
      installLock.current = false;
      setInstalling(false);
    }
  }

  return (
    <PwaContext.Provider
      value={{
        installed,
        installing,
        online,
        device,
        state,
        canInstall: !!prompt && !installed && state === "ready",
        install,
      }}
    >
      {children}
      {!privatePage && (!online || updateReady) && (
        <aside className="pwa-status-banner" role="status" aria-live="polite">
          {!online ? (
            <WifiOff size={19} aria-hidden="true" />
          ) : (
            <Download size={19} aria-hidden="true" />
          )}
          <span>
            {!online
              ? locale === "en"
                ? "You are offline. Reconnect to load current information."
                : "اتصال اینترنت قطع است؛ برای دریافت اطلاعات تازه دوباره متصل شوید."
              : locale === "en"
                ? "An updated version is ready. Refresh when you have finished your work."
                : "نسخه جدید آماده است؛ پس از پایان کارتان به‌روزرسانی کنید."}
          </span>
          {online && updateReady && (
            <button
              type="button"
              disabled={updating}
              onClick={() => {
                if (!registration.current?.waiting) return;
                setUpdating(true);
                reloadForUpdate.current = true;
                registration.current.waiting.postMessage({
                  type: "SKIP_WAITING",
                });
              }}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {locale === "en" ? "Update" : "به‌روزرسانی"}
            </button>
          )}
        </aside>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const value = useContext(PwaContext);
  if (!value) throw new Error("PwaProvider is required.");
  return value;
}
