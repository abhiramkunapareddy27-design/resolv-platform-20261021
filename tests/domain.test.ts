import { test } from "node:test";
import assert from "node:assert/strict";
import { matchSkills } from "../src/lib/matching";
import { problemInput, profileInput, safeUrl } from "../src/lib/validation";
test("matching is deterministic, case insensitive and explains missing skills", () => {
  const score = matchSkills([" Python ", "REACT"], ["Python", "React", "SQL"]);
  assert.equal(score.score, 67);
  assert.deepEqual(score.missing, ["SQL"]);
  assert.equal(
    score.explanation,
    "2 of 3 required skills match your profile. Availability and eligibility must be reviewed in the brief.",
  );
  assert.deepEqual(matchSkills([], []).score, 0);
});
test("URL validation blocks script and data links", () => {
  assert.equal(safeUrl.safeParse("javascript:alert(1)").success, false);
  assert.equal(safeUrl.safeParse("data:text/html,test").success, false);
  assert.equal(safeUrl.safeParse("https://example.com/project").success, true);
  assert.equal(safeUrl.safeParse("").success, true);
});
test("public profile role cannot become administrator", () => {
  const data = {
    name: "Test User",
    role: "ADMIN",
    bio: "",
    skills: "",
    interests: "",
    availability: "",
    github: "",
    linkedin: "",
    website: "",
  };
  assert.equal(profileInput.safeParse(data).success, false);
});
test("incomplete briefs cannot be published", () => {
  assert.equal(
    problemInput.safeParse({ title: "Hi", status: "PUBLISHED" }).success,
    false,
  );
});

test("opportunity matching explains its weighted inputs without inventing evidence", async () => {
  const { matchOpportunity } = await import("../src/lib/matching");
  const full = matchOpportunity(
    {
      skills: "TypeScript, Research",
      interests: "Software",
      availability: "Open",
      experience: "Intermediate",
      projectCount: 0,
      confirmedCount: 0,
    },
    {
      skills: ["TypeScript", "Research"],
      title: "Build a prototype",
      category: "Software Development",
      difficulty: "Intermediate",
    },
  );
  assert.equal(full.score, 90);
  assert.match(
    full.explanation,
    /0 self-reported projects; 0 confirmed outcomes/,
  );
  const unavailable = matchOpportunity(
    {
      skills: "TypeScript, Research",
      interests: "Software",
      availability: "Unavailable",
      experience: "Intermediate",
      projectCount: 0,
      confirmedCount: 0,
    },
    {
      skills: ["TypeScript", "Research"],
      title: "Build a prototype",
      category: "Software Development",
      difficulty: "Intermediate",
    },
  );
  assert.equal(unavailable.score, 80);
});
