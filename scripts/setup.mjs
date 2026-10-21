import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";
if (!existsSync(".env"))
  writeFileSync(
    ".env",
    `DATABASE_URL="file:./prisma/dev.db"\nBETTER_AUTH_URL="http://127.0.0.1:3000"\nBETTER_AUTH_SECRET="${randomBytes(32).toString("hex")}"\n`,
    { mode: 0o600 },
  );
dotenv.config({ quiet: true });
const connection = process.env.DATABASE_URL || "file:./prisma/dev.db";
if (connection.startsWith("file:")) {
  const file = resolve(connection.slice(5));
  mkdirSync(dirname(file), { recursive: true });
  if (!existsSync(file)) writeFileSync(file, "");
}
for (const script of ["db:generate", "db:deploy", "db:seed"]) {
  execFileSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", script],
    { stdio: "inherit", env: process.env },
  );
}
console.log("ReSolv is ready. Run npm run dev.");
