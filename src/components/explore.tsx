"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Plus,
  Clock,
  Bookmark,
  Check,
  Flag,
  ArrowRight,
} from "lucide-react";
import type { Platform, Problem } from "@/lib/types";
import {
  type Act,
  type Notify,
  PageHeading,
  Loading,
  Empty,
  Field,
  Submit,
  FormError,
  messageOf,
} from "./ui";
export function Explore({
  data,
  loading,
  arena,
  freelance = false,
  registeredIds = [],
  onSelect,
}: {
  data: Platform;
  loading: boolean;
  arena: boolean;
  freelance?: boolean;
  registeredIds?: string[];
  onSelect: (p: Problem) => void;
}) {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [type, setType] = useState(params.get("type") || "All opportunities");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("Newest");
  const [filters, setFilters] = useState(false);
  let list = data.problems.filter(
    (p) =>
      (!arena || p.engagement.name === "Hackathon") &&
      (!freelance || p.engagement.name === "Freelance") &&
      (type === "All opportunities" || p.engagement.name === type) &&
      (!category || p.categoryId === category) &&
      (!difficulty || p.difficulty === difficulty) &&
      `${p.title} ${p.brief} ${p.skills.map((s) => s.skill.name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  list = [...list].sort((a, b) =>
    sort === "Deadline"
      ? +new Date(a.deadline) - +new Date(b.deadline)
      : sort === "Best match"
        ? (b.match?.score || 0) - (a.match?.score || 0)
        : 0,
  );
  return (
    <div
      className={`discovery-page ${arena ? "arena-page" : freelance ? "freelance-page" : "exchange-page"}`}
    >
      {arena ? (
        <header className="arena-heading">
          <div>
            <span className="eyebrow">THE ARENA / BUILD UNDER A DEADLINE</span>
            <h1>
              A little pressure.
              <br />
              <em>A different possibility.</em>
            </h1>
            <p>
              A real challenge. A shared starting line. Something worth making.
            </p>
            <Link href="/dashboard" className="arena-workspace-link">
              Your registrations & submissions <ArrowUpRight size={16} />
            </Link>
          </div>
          <aside>
            <span className="arena-zero">
              {String(
                data.problems.filter((p) => p.engagement.name === "Hackathon")
                  .length,
              ).padStart(2, "0")}
            </span>
            <span className="mono">COMPETITIONS IN THE ARENA</span>
            <span className="arena-note">
              THE BRIEF IS THE START.
              <br />
              WHAT YOU BUILD IS THE STORY.
            </span>
          </aside>
        </header>
      ) : freelance ? (
        <header className="freelance-heading">
          <span className="eyebrow">INDEPENDENT WORK / SHARED AMBITION</span>
          <div>
            <h1>
              Good work.
              <br />
              <em>On your terms.</em>
            </h1>
            <p>
              Clear scopes. Transparent budgets.
              <br />
              Find your next client through what you can do.
            </p>
          </div>
          <div className="freelance-note">
            <span className="mono">PROJECTS, NOT PITCH DECKS.</span>
            <Link href="/dashboard" className="text-link">
              Your proposals & projects <ArrowUpRight size={16} />
            </Link>
          </div>
        </header>
      ) : (
        <PageHeading
          eyebrow="THE PROBLEM EXCHANGE"
          title={
            <>
              Find a problem
              <br />
              <em>worth solving.</em>
            </>
          }
          copy="A useful question. A fresh perspective. Discover where you can make a difference."
        />
      )}
      {freelance && (
        <div className="marketplace-trust-note">
          Budgets are disclosed by organizers. ReSolv tracks proposals and
          deliverables; payment processing is not enabled.
        </div>
      )}
      <div className="search-bar">
        <Search size={20} />
        <input
          aria-label="Search opportunities"
          placeholder="Search problems, skills, or a spark of an idea…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className={`filter-toggle ${filters ? "active" : ""}`}
          onClick={() => setFilters(!filters)}
          aria-expanded={filters}
        >
          <SlidersHorizontal size={17} /> Filters
        </button>
      </div>
      <AnimatePresence>
        {filters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="filters"
          >
            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All disciplines</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">Any experience level</option>
                {["Beginner", "Intermediate", "Advanced"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {["Newest", "Deadline", "Best match"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <button
              className="text-link"
              onClick={() => {
                setCategory("");
                setDifficulty("");
                setQuery("");
                setType("All opportunities");
              }}
            >
              Reset filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {!arena && !freelance && (
        <div className="tabs" role="tablist" aria-label="Opportunity type">
          {["All opportunities", ...data.engagements.map((e) => e.name)].map(
            (t) => (
              <button
                role="tab"
                aria-selected={type === t}
                className={type === t ? "selected" : ""}
                onClick={() => setType(t)}
                key={t}
              >
                {t}
                {type === t && <motion.span layoutId="filter-tab" />}
              </button>
            ),
          )}
        </div>
      )}
      <div className="list-heading">
        <span className="mono">
          {list.length} {arena ? "COMPETITIONS" : "OPPORTUNITIES"}
        </span>
        <span className="muted">A good place to start something.</span>
      </div>
      {loading ? (
        <Loading />
      ) : !list.length ? (
        <Empty
          title="A little space for the next big idea."
          copy="No opportunities match these filters. Try a broader search, or publish your own problem."
          action={
            <Link href="/post-problem" className="button outline">
              Post a problem <Plus size={16} />
            </Link>
          }
        />
      ) : (
        <motion.div layout className="problem-list">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <motion.button
                layout
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.035, 0.2) }}
                whileHover={{ y: -2 }}
                className="problem-card"
                onClick={() => onSelect(p)}
              >
                <div className="problem-card-top">
                  <span className={`company-letter tone-${i % 3}`}>
                    {(p.organization?.name || "Independent")[0]}
                  </span>
                  <span className="mono">
                    {p.organization?.name || "Independent organizer"}{" "}
                    {p.isExample && "· EXAMPLE"}
                    {registeredIds.includes(p.id) && (
                      <span className="registration-label">REGISTERED</span>
                    )}
                  </span>
                  <ArrowUpRight className="push-right" size={20} />
                </div>
                <div className="problem-card-main">
                  <div>
                    <span className="tag">{p.engagement.name}</span>
                    <h3>{p.title}</h3>
                    <p>
                      {p.brief.slice(0, 160)}
                      {p.brief.length > 160 ? "…" : ""}
                    </p>
                    <div className="skill-line">
                      {p.skills.map((s) => (
                        <span key={s.skill.id}>{s.skill.name}</span>
                      ))}
                    </div>
                  </div>
                  <aside>
                    <strong>{p.reward}</strong>
                    <span>
                      <Clock size={13} />{" "}
                      {new Date(p.deadline).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </span>
                    <span>{p.difficulty}</span>
                    {data.user && p.match && (
                      <span className="match-label">
                        {p.match.score}% fit score
                      </span>
                    )}
                  </aside>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
export function ProblemDetail({
  problem: p,
  data,
  act,
  notify,
}: {
  problem: Problem;
  data: Platform;
  act: Act;
  notify: Notify;
}) {
  const [view, setView] = useState("brief");
  const [saved, setSaved] = useState(data.savedIds.includes(p.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [results, setResults] = useState<
    | {
        id: string;
        rank: number;
        submission: { title: string; user: { name: string } };
      }[]
    | null
  >(null);
  const run = async (
    action: string,
    body: Record<string, unknown>,
    message: string,
  ) => {
    setBusy(true);
    setError("");
    try {
      await act(action, body);
      setDone(message);
      notify(message);
      return true;
    } catch (e) {
      setError(messageOf(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="detail-heading">
        <div className="eyebrow">
          {p.organization?.name || "INDEPENDENT ORGANIZER"}
          {p.isExample ? " · EXAMPLE OPPORTUNITY" : ""}
        </div>
        <h2>{p.title}</h2>
        <div className="detail-tags">
          <span className="tag">{p.engagement.name}</span>
          <span>{p.category.name}</span>
          <span>{p.difficulty}</span>
        </div>
      </div>
      <div className="detail-facts">
        <div>
          <span className="mono">REWARD / BUDGET</span>
          <strong>{p.reward}</strong>
        </div>
        <div>
          <span className="mono">APPLICATION DEADLINE</span>
          <strong>
            {new Date(p.deadline).toLocaleDateString("en", {
              dateStyle: "long",
              timeZone: "Asia/Kolkata",
            })}
          </strong>
        </div>
      </div>
      <div className="tabs">
        {["brief", "apply", ...(p.hackathon ? ["submit", "results"] : [])].map(
          (v) => (
            <button
              className={view === v ? "selected" : ""}
              key={v}
              onClick={() => {
                setView(v);
                setError("");
                setDone("");
              }}
            >
              {v === "brief"
                ? "The brief"
                : v === "apply"
                  ? p.hackathon
                    ? "Register"
                    : "Apply / propose"
                  : v === "results"
                    ? "Results"
                    : "Submit project"}
            </button>
          ),
        )}
        <button
          className="save-action"
          onClick={async () => {
            await run(
              "save",
              { id: p.id },
              saved ? "Removed from saved" : "Saved to your workspace",
            );
            setSaved(!saved);
          }}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {view === "brief" ? (
        <div className="brief-content">
          <h3>The challenge</h3>
          <p>{p.brief}</p>
          <h3>What you’ll deliver</h3>
          <p>{p.deliverables}</p>
          <h3>What good looks like</h3>
          <p>{p.evaluation}</p>
          <h3>Skills that help</h3>
          <div className="skill-line">
            {p.skills.map((s) => (
              <span key={s.skill.id}>{s.skill.name}</span>
            ))}
          </div>
          {data.user && p.match && (
            <div className="match-explanation">
              <strong>{p.match.score}% fit score</strong>
              <p>{p.match.explanation}</p>
              {p.match.missing.length > 0 && (
                <p>
                  Skills to build or find in a teammate:{" "}
                  {p.match.missing.join(", ")}.
                </p>
              )}
            </div>
          )}
          {p.hackathon && (
            <>
              <h3>Competition rules & eligibility</h3>
              <p>{p.hackathon.rules}</p>
              <p>{p.hackathon.eligibility}</p>
              <p>
                Rubric:{" "}
                {p.hackathon.criteria
                  .map((c) => `${c.name} (0–${c.maxScore})`)
                  .join(" · ")}
              </p>
            </>
          )}
          <div className="ip-notice">
            <h4>Your work, your rights.</h4>
            <p>{p.ipTerms}</p>
            <p>
              Commercial use requested:{" "}
              <strong>
                {p.commercialUse
                  ? "Yes — a separate agreement is required."
                  : "No."}
              </strong>{" "}
              Prizes and budgets are organizer disclosures. Payments are not
              processed by ReSolv.
            </p>
          </div>
          <button className="text-link" onClick={() => setView("apply")}>
            Interested? Take the next step <ArrowRight size={16} />
          </button>
          <details className="report-form">
            <summary>
              <Flag size={14} /> Report this listing
            </summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(
                  "report",
                  { id: p.id, reason: f.get("reason") },
                  "Report submitted for review.",
                );
              }}
            >
              <Field
                label="What should we look into?"
                name="reason"
                required
                minLength={10}
              />
              <Submit busy={busy}>Submit report</Submit>
            </form>
          </details>
        </div>
      ) : view === "apply" ? (
        <div className="action-form">
          <h3>
            {p.hackathon
              ? "Ready to enter?"
              : "Tell them how you’d approach it."}
          </h3>
          {p.hackathon ? (
            <>
              <p>
                Review the brief, eligibility and intellectual property terms
                before registering. You can submit your project before the
                deadline.
              </p>
              <button
                disabled={busy || Boolean(done)}
                className="button primary"
                onClick={() =>
                  run(
                    "register",
                    { id: p.id },
                    "You’re registered. Your next step is to build and submit.",
                  )
                }
              >
                Register for this challenge <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(
                  "apply",
                  {
                    id: p.id,
                    proposal: f.get("proposal"),
                    estimate: f.get("estimate"),
                  },
                  "Proposal submitted. Track it in your workspace.",
                );
              }}
            >
              <label>
                Your approach
                <textarea
                  name="proposal"
                  minLength={40}
                  maxLength={6000}
                  required
                  rows={7}
                  placeholder="Explain your approach, relevant experience, and what you’d need to get started."
                />
              </label>
              <Field
                label="Budget and timeline estimate (optional)"
                name="estimate"
                placeholder="For example: ₹30,000 · 3 weeks"
              />
              <Submit busy={busy} disabled={Boolean(done)}>
                Send proposal <ArrowUpRight size={16} />
              </Submit>
            </form>
          )}
        </div>
      ) : view === "results" ? (
        <div className="action-form">
          <h3>Let the work speak.</h3>
          <p>
            Published results show organizer-confirmed placements. Private
            submission links stay private.
          </p>
          <button
            className="button outline"
            onClick={async () => {
              setError("");
              const r = await fetch(
                `/api/platform?view=results&id=${encodeURIComponent(p.id)}`,
              );
              const d = await r.json();
              if (!r.ok) setError(d.error);
              else setResults(d.results);
            }}
          >
            View published results
          </button>
          {results?.map((r) => (
            <article className="management-row" key={r.id}>
              <div>
                <span className="tag">#{r.rank}</span>
                <h3>{r.submission.title}</h3>
                <p>{r.submission.user.name}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <form
          className="action-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run(
              "submit",
              {
                id: p.id,
                title: f.get("title"),
                description: f.get("description"),
                github: f.get("github"),
                demo: f.get("demo"),
                teamId: f.get("teamId") || undefined,
              },
              "Project submitted. You can update it until the deadline.",
            );
          }}
        >
          <p>
            You must register first. Submissions are private to you and the
            organizer.
          </p>
          {data.myTeams.length > 0 && (
            <label>
              Submit on behalf of a team
              <select name="teamId">
                <option value="">Just me</option>
                {data.myTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Field label="Project title" name="title" required minLength={5} />
          <label>
            What did you build?
            <textarea name="description" required minLength={40} rows={5} />
          </label>
          <Field label="GitHub repository" name="github" type="url" />
          <Field label="Demo link" name="demo" type="url" />
          <Submit busy={busy}>
            Submit project <ArrowUpRight size={16} />
          </Submit>
        </form>
      )}
      <FormError error={error} />
      {done && (
        <p className="success-message" role="status">
          <Check size={17} />
          {done}
        </p>
      )}
    </>
  );
}
