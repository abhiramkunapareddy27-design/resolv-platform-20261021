"use client";
import { useEffect, useRef, useState, useId } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X, ArrowRight, LoaderCircle } from "lucide-react";
export type Act = (
  action: string,
  body?: Record<string, unknown>,
) => Promise<unknown>;
export type Notify = (message: string) => void;
export function Dialog({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = ref.current;
    dialog?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const list = Array.from(
          dialog?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ) || [],
        ).filter((el) => el.getClientRects().length > 0);
        if (!list?.length) return;
        const first = list[0],
          last = list[list.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      prior?.focus();
    };
  }, []);
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`dialog ${wide ? "wide" : ""}`}
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
      >
        <div className="dialog-top">
          <span className="eyebrow" id={titleId}>
            {title}
          </span>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
export function messageOf(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Something went wrong. Please try again.";
}
export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label>
      {label}
      <input {...props} />
    </label>
  );
}
export function Submit({
  busy,
  children,
  disabled,
}: {
  busy: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      className="button primary submit"
      type="submit"
      disabled={busy || disabled}
    >
      {busy ? (
        <>
          <LoaderCircle className="spin" size={17} /> Working…
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
export function FormError({ error }: { error: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="alert"
          className="form-error"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
export function Empty({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-mark">✳</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={20} /> Connecting the dots…
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: React.ReactNode;
  copy: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      <p>{copy}</p>
    </div>
  );
}
export function AuthGate({ onAuth }: { onAuth: () => void }) {
  return (
    <Empty
      title="Make this space your own."
      copy="Sign in to manage your opportunities, teams, and body of work."
      action={
        <button className="button primary" onClick={onAuth}>
          Sign in or create an account <ArrowRight size={16} />
        </button>
      }
    />
  );
}
export function InlineForm({
  fields,
  submit,
  onSubmit,
}: {
  fields: { name: string; label: string; type?: string }[];
  submit: string;
  onSubmit: (v: Record<string, string>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const form = e.currentTarget;
        const values = Object.fromEntries(
          new FormData(form).entries(),
        ) as Record<string, string>;
        try {
          await onSubmit(values);
          form.reset();
        } catch (e) {
          setError(messageOf(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      {fields.map((f) => (
        <Field
          key={f.name}
          name={f.name}
          label={f.label}
          type={f.type || "text"}
          required
          min={f.type === "number" ? 0 : undefined}
        />
      ))}
      <Submit busy={busy}>{submit}</Submit>
      <FormError error={error} />
    </form>
  );
}
