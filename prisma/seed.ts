import "dotenv/config";
import { db } from "../src/lib/db";
async function main() {
  const categories = [
    "Software Development",
    "Artificial Intelligence",
    "Data Science",
    "UI/UX Design",
    "Cybersecurity",
    "Business Strategy",
    "Product Development",
    "Research",
    "Engineering",
    "Creative Work",
  ];
  for (const name of categories)
    await db.category.upsert({ where: { name }, create: { name }, update: {} });
  for (const name of ["Hackathon", "Freelance", "Collaboration"])
    await db.engagementModel.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  console.log(
    "Reference categories and engagement models are ready. No fictional users or opportunities were created.",
  );
}
main().finally(() => db.$disconnect());
