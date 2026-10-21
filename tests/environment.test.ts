import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEnvironment } from "../src/lib/env";

const base = {
  DATABASE_URL: "postgresql://example:example@localhost/resolv",
  BETTER_AUTH_SECRET: "a".repeat(64),
};

test("Render's assigned URL configures authentication without a hardcoded hostname", () => {
  assert.equal(
    validateEnvironment({
      ...base,
      RENDER_EXTERNAL_URL: "https://resolv-preview.onrender.com",
    }).BETTER_AUTH_URL,
    "https://resolv-preview.onrender.com",
  );
});

test("an explicit custom domain takes precedence over Render's default URL", () => {
  assert.equal(
    validateEnvironment({
      ...base,
      BETTER_AUTH_URL: "https://resolv.example.com",
      RENDER_EXTERNAL_URL: "https://resolv-preview.onrender.com",
    }).BETTER_AUTH_URL,
    "https://resolv.example.com",
  );
});

test("a deployment without a valid public URL fails closed", () => {
  assert.throws(() => validateEnvironment(base), /BETTER_AUTH_URL/);
  assert.throws(
    () =>
      validateEnvironment({
        ...base,
        RENDER_EXTERNAL_URL: "invalid",
      }),
    /BETTER_AUTH_URL/,
  );
});
