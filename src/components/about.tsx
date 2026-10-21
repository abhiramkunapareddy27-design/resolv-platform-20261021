"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function About() {
  return (
    <div className="about-page">
      <div className="about-caption">
        <span className="eyebrow">THE RE SOLV PHILOSOPHY</span>
        <span className="mono">A COMMON GROUND FOR UNCOMMON MINDS.</span>
      </div>
      <h1>
        The gap isn’t talent.
        <br />
        <em>It’s connection.</em>
      </h1>
      <div className="about-editorial">
        <span className="about-symbol">✳</span>
        <div>
          <p className="about-lead">
            Somewhere, a company is stuck on a problem.
            <br />
            Somewhere, you know how to solve it.
          </p>
          <p>
            ReSolv brings those two somewheres together. Companies bring real
            challenges. Students, freelancers, and curious makers bring
            different ways of seeing them.
          </p>
          <p>
            What follows might be a weekend experiment, a paid project, a team,
            or the beginning of a new career. The starting point is always the
            same: meaningful work, and a fair chance to do it.
          </p>
          <p>
            We believe your work should speak for you. Self-reported projects
            and confirmed achievements are clearly distinguished. Creators keep
            their rights unless they choose a separate agreement. Rewards and
            commercial intentions belong in the brief.
          </p>
          <Link href="/explore" className="text-link">
            Find a problem worth solving <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="about-end">
        <span>REAL PROBLEMS.</span>
        <span>REAL TALENT.</span>
        <span>REAL OUTCOMES.</span>
      </div>
    </div>
  );
}
