"use client";

import { useState, type ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-amber-300/60 focus:bg-white/[.07]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium tracking-wide text-white/60 uppercase">{label}</span>
      {children}
      {hint && <span className="text-xs text-white/35">{hint}</span>}
    </label>
  );
}

export function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Field>
  );
}

export function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <Field label={label}>
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Field>
  );
}

export function Panel({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-white/[.07]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-white/90 hover:bg-white/[.03]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-white/[.06] text-sm" aria-hidden>
          {icon}
        </span>
        <span className="flex-1">{title}</span>
        <span className={`text-white/40 transition ${open ? "rotate-180" : ""}`} aria-hidden>
          ⌄
        </span>
      </button>
      {open && <div className="grid gap-4 px-5 pb-6">{children}</div>}
    </section>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-white/[.06] p-1" role="tablist">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${value === v ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
