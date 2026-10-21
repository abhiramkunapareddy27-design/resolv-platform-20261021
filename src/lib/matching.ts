export function matchSkills(skills: string[], required: string[]) {
  const owned = new Set(
    skills.map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
  const matched = required.filter((s) => owned.has(s.toLowerCase()));
  return {
    score: required.length
      ? Math.round((matched.length / required.length) * 100)
      : 0,
    matched,
    missing: required.filter((s) => !owned.has(s.toLowerCase())),
    explanation: required.length
      ? `${matched.length} of ${required.length} required skills match your profile. Availability and eligibility must be reviewed in the brief.`
      : "No required skills have been specified.",
  };
}

export type MatchingProfile = {
  skills: string;
  interests: string;
  availability: string;
  experience: string;
  projectCount: number;
  confirmedCount: number;
};
/** Deterministic first version; a future embedding scorer can implement this same boundary. */
export function matchOpportunity(
  profile: MatchingProfile,
  problem: {
    skills: string[];
    title: string;
    category: string;
    difficulty: string;
  },
) {
  const skill = matchSkills(profile.skills.split(","), problem.skills);
  const skillPoints = Math.round(skill.score * 0.6);
  const interestTerms = profile.interests
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const text = `${problem.title} ${problem.category}`.toLowerCase();
  const interestPoints = interestTerms.some((s) => text.includes(s)) ? 10 : 0;
  const available =
    Boolean(profile.availability.trim()) &&
    !/unavailable|not available|closed/i.test(profile.availability);
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const experiencePoints =
    levels.indexOf(profile.experience) >= levels.indexOf(problem.difficulty)
      ? 10
      : 0;
  const evidencePoints = Math.min(
    10,
    profile.projectCount * 2 + profile.confirmedCount * 5,
  );
  const availabilityPoints = available ? 10 : 0;
  return {
    ...skill,
    score:
      skillPoints +
      interestPoints +
      availabilityPoints +
      experiencePoints +
      evidencePoints,
    explanation: `Skills: ${skillPoints}/60 (${skill.matched.length}/${problem.skills.length} matched). Interests: ${interestPoints}/10. Self-reported availability: ${availabilityPoints}/10. Self-reported experience: ${experiencePoints}/10. Portfolio evidence: ${evidencePoints}/10 (${profile.projectCount} self-reported projects; ${profile.confirmedCount} confirmed outcomes). Review eligibility and deadlines in the brief; this score is a discovery aid, not a hiring assessment.`,
  };
}
