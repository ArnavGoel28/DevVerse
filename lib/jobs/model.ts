// JB-01: roles matched to evidence-verified skills, with the gap per role (Career agent, D-28).
// Sample listings use fictional companies until real job feeds are connected (docs/10-backend-plan.md).
import type { DeveloperProfile } from "@/lib/types";

export type JobSkill = { id: string; weight: number; required: boolean };
export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  workplace: "remote" | "hybrid" | "onsite";
  type: "internship" | "full-time" | "contract";
  salary: string;
  postedHoursAgo: number;
  skills: JobSkill[];
  about: string;
  sample: true;
};
export type JobMatch = { percent: number; have: string[]; partial: string[]; gaps: string[] };

const confMap = (p: Pick<DeveloperProfile, "skills">) =>
  new Map(p.skills.filter((s) => s.userFeedback !== "wrong" && s.userFeedback !== "hidden").map((s) => [s.id, s.confidence]));

/** Weighted overlap of the job's skills with proven skills (required skills count double). */
export function matchJob(job: Job, profile: Pick<DeveloperProfile, "skills">): JobMatch {
  const conf = confMap(profile);
  let got = 0;
  let total = 0;
  const have: string[] = [];
  const partial: string[] = [];
  const gaps: string[] = [];
  for (const s of job.skills) {
    const w = s.weight * (s.required ? 2 : 1);
    const c = conf.get(s.id) ?? 0;
    total += w;
    got += w * Math.min(1, c / 0.7);
    if (c >= 0.6) have.push(s.id);
    else if (c >= 0.25) partial.push(s.id);
    else if (s.required) gaps.push(s.id);
  }
  return { percent: total ? Math.round((got / total) * 100) : 0, have, partial, gaps };
}

export type JobFilter = { query?: string; workplace?: Job["workplace"]; type?: Job["type"]; minMatch?: number };

export function filterJobs(jobs: Job[], profile: Pick<DeveloperProfile, "skills">, f: JobFilter): { job: Job; match: JobMatch }[] {
  const q = f.query?.trim().toLowerCase();
  return jobs
    .map((job) => ({ job, match: matchJob(job, profile) }))
    .filter(({ job, match }) =>
      (!q || `${job.title} ${job.company} ${job.skills.map((s) => s.id).join(" ")}`.toLowerCase().includes(q)) &&
      (!f.workplace || job.workplace === f.workplace) &&
      (!f.type || job.type === f.type) &&
      match.percent >= (f.minMatch ?? 0),
    )
    .sort((a, b) => b.match.percent - a.match.percent || a.job.postedHoursAgo - b.job.postedHoursAgo);
}

const j = (x: Omit<Job, "sample">): Job => ({ ...x, sample: true });

export const SAMPLE_JOBS: Job[] = [
  j({ id: "j1", title: "Frontend Engineer Intern", company: "Nimbus Labs", location: "Bengaluru", workplace: "hybrid", type: "internship", salary: "₹40k/month", postedHoursAgo: 6,
    skills: [{ id: "react", weight: 3, required: true }, { id: "typescript", weight: 2, required: true }, { id: "css", weight: 1, required: false }, { id: "nextjs", weight: 1, required: false }],
    about: "Build product UI with React and TypeScript, ship small features every week, and pair with senior engineers on design systems." }),
  j({ id: "j2", title: "Backend Developer (Node.js)", company: "Quillstack", location: "Remote, India", workplace: "remote", type: "full-time", salary: "₹10–16 LPA", postedHoursAgo: 20,
    skills: [{ id: "nodejs", weight: 3, required: true }, { id: "postgresql", weight: 2, required: true }, { id: "rest-api", weight: 2, required: true }, { id: "docker", weight: 1, required: false }],
    about: "Own REST APIs end to end: design, tests, deploys. Our stack is Node.js, PostgreSQL and Docker on Cloud Run." }),
  j({ id: "j3", title: "ML Engineer Intern", company: "Pixelgrove AI", location: "Pune", workplace: "onsite", type: "internship", salary: "₹50k/month", postedHoursAgo: 30,
    skills: [{ id: "python", weight: 3, required: true }, { id: "machine-learning", weight: 3, required: true }, { id: "pytorch", weight: 2, required: false }, { id: "pandas", weight: 1, required: false }],
    about: "Train and evaluate computer-vision models, write data pipelines in Python, and help ship models to production." }),
  j({ id: "j4", title: "Full-Stack Engineer", company: "Orbitly", location: "Hyderabad", workplace: "hybrid", type: "full-time", salary: "₹14–22 LPA", postedHoursAgo: 48,
    skills: [{ id: "react", weight: 2, required: true }, { id: "nodejs", weight: 2, required: true }, { id: "typescript", weight: 2, required: true }, { id: "gcp", weight: 1, required: false }, { id: "firebase", weight: 1, required: false }],
    about: "Work across a Next.js front end and Node.js services on Google Cloud. You'll own features from idea to release." }),
  j({ id: "j5", title: "DevOps Engineer", company: "Stackforge", location: "Remote", workplace: "remote", type: "contract", salary: "$35–45/hour", postedHoursAgo: 72,
    skills: [{ id: "docker", weight: 3, required: true }, { id: "kubernetes", weight: 3, required: true }, { id: "ci-cd", weight: 2, required: true }, { id: "terraform", weight: 1, required: false }, { id: "gcp", weight: 1, required: false }],
    about: "Run our build and deploy pipelines, keep clusters healthy, and help developers ship safely." }),
  j({ id: "j6", title: "Mobile Developer (Flutter)", company: "Tealeaf Apps", location: "Chennai", workplace: "onsite", type: "full-time", salary: "₹8–12 LPA", postedHoursAgo: 96,
    skills: [{ id: "flutter", weight: 3, required: true }, { id: "dart", weight: 2, required: true }, { id: "firebase", weight: 1, required: false }],
    about: "Build cross-platform apps used by thousands of small shops, with Firebase for auth and data." }),
  j({ id: "j7", title: "Python Backend Intern", company: "Ledgerlight", location: "Remote, India", workplace: "remote", type: "internship", salary: "₹30k/month", postedHoursAgo: 12,
    skills: [{ id: "python", weight: 3, required: true }, { id: "django", weight: 2, required: false }, { id: "fastapi", weight: 2, required: false }, { id: "sql", weight: 2, required: true }],
    about: "Help build our accounting APIs in Python. Great first role if you've built a couple of backend projects." }),
  j({ id: "j8", title: "Data Analyst", company: "Brightmetric", location: "Gurugram", workplace: "hybrid", type: "full-time", salary: "₹7–10 LPA", postedHoursAgo: 5,
    skills: [{ id: "sql", weight: 3, required: true }, { id: "python", weight: 2, required: true }, { id: "pandas", weight: 2, required: false }, { id: "data-science", weight: 1, required: false }],
    about: "Turn product data into decisions: SQL dashboards, Python notebooks and clear write-ups for the team." }),
];
