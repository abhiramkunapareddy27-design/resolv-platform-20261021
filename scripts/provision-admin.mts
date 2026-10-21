import "dotenv/config";
import { z } from "zod";
import { db } from "../src/lib/db";
const email = z.email().parse(process.argv[2]);
try {
  const user = await db.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log(
    `Administrator access granted to the existing account ${user.email}.`,
  );
} finally {
  await db.$disconnect();
}
