"use client";

import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  Download,
  FileText,
  Globe2,
  LoaderCircle,
  Monitor,
  Newspaper,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react";
import { useLocale } from "./locale-provider";
import { usePwa } from "./pwa-provider";
import Link from "./localized-link";

type Platform = "android" | "ios" | "desktop";

export function DownloadApp({ directUrl }: { directUrl: string | null }) {
  const { locale } = useLocale();
  const english = locale === "en";
  const pwa = usePwa();
  const guide = useRef<HTMLElement>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const platform = selectedPlatform || pwa.device;
  const say = (fa: string, en: string) => (english ? en : fa);
  const steps: Record<Platform, string[]> = {
    android: english
      ? [
          "Open this page in Chrome on Android.",
          "Tap Install web app on this page, or choose Install app / Add to Home screen from the browser menu.",
          "Confirm the browser dialog. The council icon will appear on your home screen.",
        ]
      : [
          "این صفحه را در مرورگر Chrome گوشی اندرویدی باز کنید.",
          "دکمه «نصب نسخه وب» را بزنید؛ یا از منوی مرورگر، Install app یا Add to Home screen را انتخاب کنید.",
          "نصب را تأیید کنید؛ نشان کانون به صفحه اصلی گوشی اضافه می‌شود.",
        ],
    ios: english
      ? [
          "Open this page in Safari on your iPhone or iPad.",
          "Tap Share, then choose Add to Home Screen. On some versions this is inside More.",
          "Enable Open as Web App if offered, then tap Add.",
        ]
      : [
          "این صفحه را در Safari آیفون یا آیپد باز کنید.",
          "دکمه اشتراک‌گذاری (Share) را بزنید و Add to Home Screen را انتخاب کنید. در بعضی نسخه‌ها این گزینه داخل More است.",
          "اگر Open as Web App نمایش داده شد آن را فعال کنید و سپس Add را بزنید.",
        ],
    desktop: english
      ? [
          "Open this page in Chrome or Microsoft Edge.",
          "Tap Install web app here, or use the browser's install icon / Apps menu.",
          "Confirm installation. The website opens in a separate app window.",
        ]
      : [
          "این صفحه را در Chrome یا Microsoft Edge رایانه باز کنید.",
          "دکمه «نصب نسخه وب» را بزنید؛ یا از آیکون نصب کنار نوار آدرس یا بخش Apps مرورگر استفاده کنید.",
          "نصب را تأیید کنید؛ سایت در یک پنجره مستقل باز می‌شود.",
        ],
  };
  function showGuide() {
    guide.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    guide.current?.focus({ preventScroll: true });
  }
  async function install() {
    setFeedback("");
    if (!pwa.canInstall) {
      showGuide();
      return;
    }
    const outcome = await pwa.install();
    if (outcome === "accepted")
      setFeedback(
        say(
          "درخواست نصب تأیید شد؛ مرورگر مراحل نصب را تکمیل می‌کند.",
          "Installation was accepted. Your browser will complete the process.",
        ),
      );
    else if (outcome === "dismissed")
      setFeedback(
        say(
          "نصب لغو شد؛ هر زمان خواستید می‌توانید از منوی مرورگر نصب کنید.",
          "Installation was dismissed. You can install later from your browser menu.",
        ),
      );
    else if (outcome === "failed")
      setFeedback(
        say(
          "نصب خودکار انجام نشد؛ از راهنمای نصب استفاده کنید.",
          "The install prompt did not open. Follow the installation guide.",
        ),
      );
    else showGuide();
  }
  return (
    <div className="page-container app-download-page">
      <div className="download-breadcrumb">
        <Link href="/" prefetch={false}>
          {say("صفحه اصلی", "Home")}
        </Link>
        <ChevronLeft size={13} aria-hidden="true" />
        <span>{say("دانلود اپلیکیشن", "Download app")}</span>
      </div>
      <section className="download-hero">
        <div className="download-hero-copy">
          <span className="download-eyebrow">
            <Globe2 size={15} aria-hidden="true" />
            {say("کانون، همیشه در دسترس", "The council, always within reach")}
          </span>
          <h1>
            {say("کانون مازندران", "Mazandaran Council")}
            <span>{say("همراه شما", "by your side")}</span>
          </h1>
          <p>
            {say(
              "اخبار کانون، جستجوی کارشناسان و دسترسی به اسناد؛ در گوشی شما، با همان تجربه آشنای وب‌سایت.",
              "Council news, expert search and documents, on your phone with the familiar website experience.",
            )}
          </p>
          <a href="#download-options" className="download-hero-action">
            <Download size={19} aria-hidden="true" />
            {say("انتخاب روش دریافت", "Choose how to get it")}
            <ArrowDownToLine size={17} aria-hidden="true" />
          </a>
          <div className="download-hero-points">
            <span>
              <Check size={14} />
              {say("اندروید و آیفون", "Android and iPhone")}
            </span>
            <span>
              <Check size={14} />
              {say("نسخه وب نصب‌شدنی", "Installable web app")}
            </span>
          </div>
        </div>
        <div className="download-visual" aria-hidden="true">
          <span className="download-orbit download-orbit-one" />
          <span className="download-orbit download-orbit-two" />
          <div className="download-float download-float-documents">
            <FileText size={24} />
            <span>{say("قوانین و اسناد", "Documents")}</span>
          </div>
          <div className="download-float download-float-experts">
            <UsersRound size={24} />
            <span>{say("کارشناسان", "Experts")}</span>
          </div>
          <div className="download-phone">
            <div className="download-phone-camera" />
            <div className="download-phone-screen">
              <div className="download-phone-brand">
                <img src="/pwa/icon-192.png" width={64} height={64} alt="" />
                <strong>{say("کانون مازندران", "Mazandaran Council")}</strong>
                <small>
                  {say("کارشناسان رسمی دادگستری", "Official Justice Experts")}
                </small>
              </div>
              <div className="download-phone-news">
                <Newspaper size={24} />
                <span>{say("تازه‌های کانون", "Council updates")}</span>
                <i />
                <i />
                <i />
              </div>
              <div className="download-phone-tools">
                <span>
                  <UsersRound size={22} />
                  {say("کارشناسان", "Experts")}
                </span>
                <span>
                  <BookOpen size={22} />
                  {say("اسناد", "Documents")}
                </span>
              </div>
              <div className="download-phone-home" />
            </div>
          </div>
        </div>
      </section>
      <section
        className="download-options"
        id="download-options"
        aria-label={say("روش‌های دریافت اپلیکیشن", "Get the app")}
      >
        <article className="download-option download-direct">
          <div className="download-option-top">
            <span className="download-option-icon">
              <Smartphone size={28} aria-hidden="true" />
            </span>
            <span className="download-option-label">Android</span>
          </div>
          <h2>{say("دانلود مستقیم", "Direct download")}</h2>
          <p>
            {say(
              "دریافت فایل نصب نسخه اندروید، بدون مراجعه به فروشگاه برنامه.",
              "Get the Android installation file directly, without an app store.",
            )}
          </p>
          {directUrl ? (
            <a className="download-option-button" href={directUrl} download>
              <Download size={18} />
              {say("دانلود فایل نصب", "Download installation file")}
            </a>
          ) : (
            <button className="download-option-button" type="button" disabled>
              <Download size={18} />
              {say(
                "دانلود مستقیم هنوز فعال نیست",
                "Direct download is not available yet",
              )}
            </button>
          )}
          <small>
            {directUrl
              ? say(
                  "پس از دریافت، فایل را روی گوشی اندرویدی باز کنید.",
                  "After downloading, open the file on your Android phone.",
                )
              : say(
                  "پس از انتشار فایل نصب، لینک دریافت در همین بخش فعال می‌شود.",
                  "The download link will appear here when the installation file is published.",
                )}
          </small>
        </article>
        <article className="download-option download-web" id="pwa">
          <div className="download-option-top">
            <span className="download-option-icon">
              <Globe2 size={28} aria-hidden="true" />
            </span>
            <span className="download-option-label">
              Android · iOS · Desktop
            </span>
          </div>
          <h2>{say("نسخه وب اپلیکیشن", "Web app")}</h2>
          <p>
            {say(
              "وب‌سایت کانون را به صفحه اصلی دستگاه اضافه کنید و در یک پنجره مستقل باز کنید.",
              "Add the council website to your home screen and open it in a standalone window.",
            )}
          </p>
          {pwa.installed ? (
            <Link
              className="download-option-button"
              href="/?source=pwa"
              prefetch={false}
            >
              <Check size={18} />
              {say("باز کردن نسخه وب", "Open web app")}
            </Link>
          ) : (
            <button
              className="download-option-button"
              type="button"
              onClick={() => void install()}
              disabled={pwa.installing}
            >
              {pwa.installing ? (
                <LoaderCircle size={18} className="download-spin" />
              ) : pwa.canInstall ? (
                <Download size={18} />
              ) : (
                <Globe2 size={18} />
              )}
              {pwa.canInstall
                ? say("نصب نسخه وب", "Install web app")
                : say("راهنمای نصب نسخه وب", "Web app installation guide")}
            </button>
          )}
          <Link
            className="download-open-web"
            href="/?source=pwa"
            prefetch={false}
          >
            {say("استفاده از نسخه وب", "Continue on the web")}
            <ArrowUpRight size={15} />
          </Link>
          <small>
            {pwa.installed
              ? say(
                  "نسخه وب نصب شده و آماده استفاده است.",
                  "The web app is installed and ready to use.",
                )
              : say(
                  "برای استفاده از اطلاعات تازه و خدمات، اتصال اینترنت لازم است.",
                  "Internet access is needed for current information and services.",
                )}
          </small>
          {feedback && (
            <p className="download-feedback" role="status">
              {feedback}
            </p>
          )}
          {pwa.state === "error" && (
            <p className="download-feedback" role="status">
              {say(
                "آماده‌سازی نسخه وب انجام نشد؛ اتصال را بررسی کنید و صفحه را دوباره باز کنید.",
                "The web app could not be prepared. Check your connection and reload.",
              )}
            </p>
          )}
        </article>
      </section>
      <section
        ref={guide}
        className="download-install-guide"
        id="installation-guide"
        tabIndex={-1}
        aria-labelledby="install-guide-heading"
      >
        <div className="download-guide-heading">
          <span className="download-eyebrow">
            {say("نصب در چند قدم", "Install in a few steps")}
          </span>
          <h2 id="install-guide-heading">
            {say(
              "نسخه وب را به دستگاهتان اضافه کنید",
              "Add the web app to your device",
            )}
          </h2>
          <p>
            {say(
              "دستگاه خود را انتخاب کنید تا روش نصب مناسب را ببینید.",
              "Choose your device to see the relevant instructions.",
            )}
          </p>
        </div>
        <div
          className="download-platform-tabs"
          role="tablist"
          aria-label={say("نوع دستگاه", "Device type")}
        >
          {(["android", "ios", "desktop"] as const).map((item, index) => (
            <button
              key={item}
              type="button"
              role="tab"
              id={"install-tab-" + item}
              aria-selected={platform === item}
              aria-controls="install-device-panel"
              tabIndex={platform === item ? 0 : -1}
              onClick={() => setSelectedPlatform(item)}
              onKeyDown={(event) => {
                const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                if (!keys.includes(event.key)) return;
                event.preventDefault();
                const delta =
                  (event.key === "ArrowRight" ? 1 : -1) * (english ? 1 : -1);
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (index + delta + 3) % 3;
                const target = (["android", "ios", "desktop"] as const)[next];
                setSelectedPlatform(target);
                document.getElementById("install-tab-" + target)?.focus();
              }}
            >
              {item === "desktop" ? (
                <Monitor size={18} />
              ) : (
                <Smartphone size={18} />
              )}
              {item === "android"
                ? say("اندروید", "Android")
                : item === "ios"
                  ? say("آیفون و آیپد", "iPhone and iPad")
                  : say("رایانه", "Desktop")}
            </button>
          ))}
        </div>
        <div
          className="download-device-panel"
          id="install-device-panel"
          role="tabpanel"
          aria-labelledby={"install-tab-" + platform}
          tabIndex={0}
        >
          <ol>
            {steps[platform].map((step, index) => (
              <li key={step}>
                <span>
                  {new Intl.NumberFormat(english ? "en" : "fa").format(
                    index + 1,
                  )}
                </span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <p className="download-guide-note">
            <ShieldCheck size={18} aria-hidden="true" />
            {say(
              "اگر گزینه نصب را نمی‌بینید، صفحه را در مرورگر اصلی دستگاه باز کنید؛ مرورگر داخلی پیام‌رسان‌ها ممکن است نصب را پشتیبانی نکند.",
              "If the install option is missing, open this page in your device's main browser. In-app browsers may not support installation.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
