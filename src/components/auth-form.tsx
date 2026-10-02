"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api-client";
import { ApiError, errorMessage } from "@/lib/errors";

export function AuthForm({
  mode = "login",
  email = "",
  token = "",
}: {
  mode?: "login" | "forgot-password" | "reset-password";
  email?: string;
  token?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setErrors({});
    setSuccess(false);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await api<{ message?: string }>("/api/v1/auth/" + mode, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (mode === "login") {
        router.replace("/admin");
        router.refresh();
      } else {
        setMessage(response.data.message || "درخواست انجام شد.");
        setSuccess(true);
      }
    } catch (error) {
      setMessage(errorMessage(error));
      if (error instanceof ApiError) setErrors(error.errors);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link prefetch={false} href="/">
          <img src="/assets/fig-44.png" alt="کانون کارشناسان مازندران" />
        </Link>
        <h1>
          {mode === "login"
            ? "ورود روابط عمومی"
            : mode === "forgot-password"
              ? "بازیابی رمز عبور"
              : "تعیین رمز جدید"}
        </h1>
        <p>
          {mode === "login"
            ? "مدیریت اخبار و محتوای کانون"
            : "حساب داشبورد روابط عمومی"}
        </p>
        <form onSubmit={submit}>
          <label>
            ایمیل
            <input
              name="email"
              type="email"
              required
              defaultValue={email}
              autoComplete="username"
              dir="ltr"
              maxLength={200}
            />
            {errors.email?.map((e) => (
              <span className="field-error" key={e}>
                {e}
              </span>
            ))}
          </label>
          {mode !== "forgot-password" && (
            <label>
              رمز عبور
              <div className="password-input">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={mode === "reset-password" ? 12 : 1}
                  maxLength={200}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password?.map((e) => (
                <span className="field-error" key={e}>
                  {e}
                </span>
              ))}
            </label>
          )}
          {mode === "reset-password" && (
            <>
              <input type="hidden" name="token" value={token} />
              <label>
                تکرار رمز
                <input
                  name="password_confirmation"
                  type={show ? "text" : "password"}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  dir="ltr"
                />
              </label>
              <p className="field-hint">
                حداقل ۱۲ کاراکتر با حروف بزرگ، کوچک، عدد و نماد
              </p>
            </>
          )}
          {message && (
            <p role="alert" className={success ? "form-success" : "form-error"}>
              {message}
            </p>
          )}
          <button className="primary-button" disabled={busy}>
            {busy
              ? "در حال انجام…"
              : mode === "login"
                ? "ورود به داشبورد"
                : "ثبت درخواست"}
          </button>
        </form>
        {mode === "login" ? (
          <Link prefetch={false} href="/admin/forgot-password">
            رمز عبور را فراموش کرده‌ام
          </Link>
        ) : (
          <Link prefetch={false} href="/admin/login">
            بازگشت به ورود
          </Link>
        )}
        <Link prefetch={false} href="/" className="quiet">
          بازگشت به سایت
        </Link>
      </div>
    </div>
  );
}
