"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { ApiError, errorMessage } from "@/lib/errors";

export function SecurityForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setErrors({});
    try {
      await api("/api/v1/auth/password", {
        method: "PUT",
        body: JSON.stringify(
          Object.fromEntries(new FormData(event.currentTarget)),
        ),
      });
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
      if (error instanceof ApiError) setErrors(error.errors);
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <h1>امنیت حساب</h1>
      </div>
      <form className="admin-panel security-form" onSubmit={submit}>
        <p>
          بعد از تغییر رمز، نشست‌های حساب پایان می‌یابند و باید دوباره وارد
          شوید.
        </p>
        {[
          ["current_password", "رمز فعلی"],
          ["password", "رمز جدید"],
          ["password_confirmation", "تکرار رمز جدید"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              type="password"
              required
              minLength={key === "current_password" ? 1 : 12}
              maxLength={200}
              autoComplete={
                key === "current_password" ? "current-password" : "new-password"
              }
              dir="ltr"
            />
            {errors[key]?.map((error) => (
              <span key={error} className="field-error">
                {error}
              </span>
            ))}
          </label>
        ))}
        <p className="field-hint">
          حداقل ۱۲ کاراکتر با حروف بزرگ، کوچک، عدد و نماد
        </p>
        {message && <p className="form-error">{message}</p>}
        <button className="primary-button" disabled={busy}>
          {busy ? "در حال انجام…" : "تغییر رمز عبور"}
        </button>
      </form>
    </>
  );
}
