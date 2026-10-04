"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { ApiError, errorMessage } from "@/lib/errors";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setErrors({});
    setMessage("");
    setSuccess(false);
    try {
      const body = Object.fromEntries(new FormData(form));
      const response = await api<{ message: string }>("/api/v1/contact", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setMessage(response.data.message);
      setSuccess(true);
      form.reset();
    } catch (error) {
      setMessage(errorMessage(error));
      if (error instanceof ApiError) setErrors(error.errors);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-grid">
        {[
          ["name", "نام و نام خانوادگی", "text"],
          ["email", "ایمیل", "email"],
          ["phone", "تلفن", "tel"],
          ["subject", "موضوع", "text"],
        ].map(([key, label, type]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              type={type}
              required={key !== "phone"}
              maxLength={key === "subject" ? 250 : key === "phone" ? 20 : 150}
              autoComplete={
                key === "name"
                  ? "name"
                  : key === "email"
                    ? "email"
                    : key === "phone"
                      ? "tel"
                      : "off"
              }
              aria-invalid={Boolean(errors[key])}
            />
            {errors[key]?.map((error) => (
              <span key={error} className="field-error">
                {error}
              </span>
            ))}
          </label>
        ))}
      </div>
      <label>
        متن پیام
        <textarea
          name="message"
          rows={7}
          minLength={10}
          maxLength={5000}
          required
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message?.map((error) => (
          <span key={error} className="field-error">
            {error}
          </span>
        ))}
      </label>
      <label className="honeypot" aria-hidden="true">
        وبسایت
        <input name="website" autoComplete="off" tabIndex={-1} />
      </label>
      {message && (
        <p role="status" className={success ? "form-success" : "form-error"}>
          {message}
        </p>
      )}
      <button className="primary-button" disabled={busy}>
        {busy ? "در حال ارسال…" : "ارسال پیام"}
      </button>
    </form>
  );
}
