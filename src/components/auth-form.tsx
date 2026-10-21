"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Field, FormError, Submit } from "./ui";
export function AuthForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        try {
          const result = signup
            ? await authClient.signUp.email({
                name: String(f.get("name")),
                email: String(f.get("email")),
                password: String(f.get("password")),
              })
            : await authClient.signIn.email({
                email: String(f.get("email")),
                password: String(f.get("password")),
              });
          if (result.error) throw new Error(result.error.message);
          await onSuccess();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Authentication failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>
        {signup ? "Make room for possibility." : "Good to have you back."}
      </h2>
      <p className="muted">
        {signup
          ? "Create your account. Let your work do the talking."
          : "Sign in to your ReSolv workspace."}
      </p>
      {signup && (
        <Field
          label="Your name"
          name="name"
          required
          minLength={2}
          autoComplete="name"
        />
      )}
      <Field
        label="Email address"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        minLength={12}
        autoComplete={signup ? "new-password" : "current-password"}
      />
      {signup && (
        <p className="form-hint">
          Use at least 12 characters. Email verification and password recovery
          require a configured email provider.
        </p>
      )}
      <FormError error={error} />
      <Submit busy={busy}>
        {signup ? "Create account" : "Sign in"} <ArrowRight size={16} />
      </Submit>
      <button
        type="button"
        className="switch-auth"
        onClick={() => {
          setSignup(!signup);
          setError("");
        }}
      >
        {signup ? "Already here? Sign in" : "New to ReSolv? Create an account"}
      </button>
    </form>
  );
}
