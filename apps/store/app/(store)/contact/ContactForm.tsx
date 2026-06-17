"use client";

import { useState, FormEvent } from "react";
import { EMAIL_SALES } from "@apt/config";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setState("success");
        setForm({ name: "", company: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-10 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#84CC16]/10 border border-[#84CC16]/20 mx-auto mb-6">
          <svg className="w-8 h-8 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
          Message Sent Successfully
        </h3>
        <p className="text-[#64748B] dark:text-[#94A3B8] mb-6">
          Thank you for contacting APT Ghana. A member of our team will respond to your enquiry within one business day.
        </p>
        <button
          onClick={() => setState("idle")}
          className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0A0F1E] text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]/40 focus:border-[#84CC16] transition-colors";
  const labelClass = "block text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8 lg:p-10 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            Company / Organisation
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={form.company}
            onChange={handleChange}
            placeholder="Company name"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+233 XX XXX XXXX"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className={labelClass}>
          Subject <span className="text-red-400">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={form.subject}
          onChange={handleChange}
          className={inputClass + " cursor-pointer"}
        >
          <option value="" disabled>Select enquiry type</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Product Quote">Product Quote</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Partnership">Partnership / Distributor</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={handleChange}
          placeholder="Describe your project, the products you need, or how we can help..."
          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0A0F1E] text-[#0F172A] dark:text-[#F1F5F9] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]/40 focus:border-[#84CC16] transition-colors resize-none"
        />
      </div>

      {state === "error" && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          Something went wrong. Please try again or email us directly at{" "}
          <a href={`mailto:${EMAIL_SALES}`} className="underline font-medium">
            {EMAIL_SALES}
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full h-12 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {state === "submitting" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Sending…
          </>
        ) : (
          "Send Message →"
        )}
      </button>
    </form>
  );
}
