export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  profile: Profile | null;
};
export type Profile = {
  bio: string;
  skills: string;
  interests: string;
  experience: string;
  availability: string;
  github: string;
  linkedin: string;
  website: string;
};
export type Taxon = { id: string; name: string };
export type Problem = {
  id: string;
  title: string;
  brief: string;
  deliverables: string;
  evaluation: string;
  ownerId: string;
  categoryId: string;
  engagementId: string;
  category: Taxon;
  engagement: Taxon;
  organization: { id: string; name: string; verification: string } | null;
  difficulty: string;
  reward: string;
  deadline: string;
  status: string;
  commercialUse: boolean;
  ipTerms: string;
  isExample: boolean;
  skills: { skill: Taxon }[];
  hackathon: {
    id: string;
    rules: string;
    eligibility: string;
    criteria: { id: string; name: string; maxScore: number }[];
  } | null;
  match?: {
    score: number;
    explanation: string;
    matched: string[];
    missing: string[];
  };
  applications?: Application[];
};
export type Application = {
  userId: string;
  id: string;
  proposal: string;
  estimate: string;
  status: string;
  problem: Problem;
  user?: { id: string; name: string };
};
export type Team = {
  id: string;
  name: string;
  description: string;
  skills: string;
  _count?: { members: number };
  members?: {
    userId: string;
    role: string;
    status: string;
    user: { id: string; name: string };
  }[];
};
export type Contract = {
  id: string;
  status: string;
  problem: Problem;
  application: Application;
  milestones: {
    id: string;
    title: string;
    amount: number;
    status: string;
    deliverables: { id: string; url: string; notes: string }[];
  }[];
};
export type Platform = {
  user: Person | null;
  problems: Problem[];
  categories: Taxon[];
  engagements: Taxon[];
  teams: Team[];
  aiConfigured: boolean;
  previewMode?: boolean;
  savedIds: string[];
  myTeams: Taxon[];
  organizations: Taxon[];
};
export type Dashboard = {
  user: Person;
  posted: Problem[];
  applications: Application[];
  saved: { problem: Problem }[];
  teams: Team[];
  registrations: { hackathon: { problem: Problem } }[];
  submissions: { id: string; title: string; hackathonId: string }[];
  achievements: {
    id: string;
    title: string;
    provenance: string;
    evidenceUrl: string;
  }[];
  contracts: Contract[];
  invitations: { id: string; team: Team }[];
};
