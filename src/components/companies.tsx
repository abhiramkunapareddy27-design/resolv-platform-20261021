"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeading } from "./ui";
export function Companies() {
  return (
    <>
      <PageHeading
        eyebrow="FOR COMPANIES & FOUNDERS"
        title={
          <>
            A fresh perspective
            <br />
            <em>changes things.</em>
          </>
        }
        copy="Bring a real challenge to people who see a different way forward."
      />
      <div className="company-editorial">
        <span className="big-asterisk">✳</span>
        <div>
          <h2>
            Hire for what people
            <br />
            <em>can actually do.</em>
          </h2>
          <p>
            A résumé tells one story. A thoughtful solution tells another.
            ReSolv gives companies a way to work with talent through meaningful
            problems.
          </p>
          <Link href="/post-problem" className="button primary">
            Bring us your problem <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="company-offers">
        {[
          [
            "A focused freelance project",
            "Define the outcome, compare proposals, and track milestones. Payment processing is not enabled.",
          ],
          [
            "A challenge worth entering",
            "Give a community a clear brief, transparent rewards, and a fair rubric.",
          ],
          [
            "A team you didn’t know you needed",
            "Find collaborators through demonstrated skills and real contributions.",
          ],
        ].map(([a, b], i) => (
          <article key={a}>
            <span className="mono">0{i + 1}</span>
            <h3>{a}</h3>
            <p>{b}</p>
          </article>
        ))}
      </div>
      <div className="ip-notice">
        <h3>Clear terms make better work.</h3>
        <p>
          Every problem must disclose the reward, evaluation criteria, and
          commercial-use intentions. Creators retain ownership unless they enter
          a separate agreement. Company verification requires administrator
          review.
        </p>
      </div>
    </>
  );
}
