"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Users,
  X,
  LogOut,
  ExternalLink,
} from "lucide-react";
import type { Platform, Problem, Dashboard } from "@/lib/types";
import { PostProblem } from "./problem-editor";
import {
  type Act,
  type Notify,
  PageHeading,
  Empty,
  Loading,
  FormError,
  Dialog,
  InlineForm,
  messageOf,
} from "./ui";
export function Workspace({
  data,
  dash,
  error,
  act,
  notify,
  onSelect,
  onRefresh,
  onSignOut,
}: {
  data: Platform;
  dash: Dashboard | null;
  error: string;
  act: Act;
  notify: Notify;
  onSelect: (p: Problem) => void;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState<Problem | null>(null);
  const [issue, setIssue] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [submissions, setSubmissions] = useState<
    {
      id: string;
      title: string;
      description: string;
      github: string;
      demo: string;
      user: { name: string };
      scores: { value: number }[];
    }[]
  >([]);
  const run = async (
    action: string,
    body: Record<string, unknown>,
    message: string,
  ) => {
    try {
      await act(action, body);
      notify(message);
    } catch (e) {
      setIssue(messageOf(e));
    }
  };
  if (error)
    return (
      <Empty
        title="Your workspace needs a moment."
        copy={error}
        action={
          <button className="button primary" onClick={onRefresh}>
            Try again
          </button>
        }
      />
    );
  if (!dash) return <Loading />;
  const company = data.user?.role === "COMPANY" || data.user?.role === "ADMIN";
  const openReview = async (p: Problem) => {
    setReviewId(p.id);
    setIssue("");
    const res = await fetch(
      `/api/platform?view=submissions&id=${encodeURIComponent(p.id)}`,
    );
    const result = await res.json();
    if (!res.ok) {
      setIssue(result.error);
      return;
    }
    setSubmissions(result.submissions);
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title={
          <>
            Good work starts here,
            <br />
            <em>{data.user?.name.split(" ")[0]}.</em>
          </>
        }
        copy={
          company
            ? "Your briefs, your applicants, and the work taking shape."
            : "A place for your next steps, current projects, and small wins."
        }
      />
      <div className="workspace-stats">
        {[
          [
            company ? "Published problems" : "Applications",
            company
              ? dash.posted.filter((p) => p.status === "PUBLISHED").length
              : dash.applications.length,
          ],
          ["Saved opportunities", dash.saved.length],
          ["Your teams", dash.teams.length],
          [
            "Active projects",
            dash.contracts.filter((c) => c.status !== "COMPLETED").length,
          ],
        ].map(([label, n]) => (
          <div key={label}>
            <span className="mono">{label}</span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>
      <div className="tabs">
        {[
          "Overview",
          ...(company
            ? ["My problems", "Applications", "Competitions"]
            : ["Applications", "Competitions"]),
          "Saved",
          "Teams",
          "Projects",
        ].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <FormError error={issue} />
      {tab === "Overview" && (
        <div className="workspace-overview">
          <section>
            <h3>
              {company
                ? "Move your next idea forward."
                : "Your next useful step."}
            </h3>
            <p>
              {company
                ? "A clear brief is the beginning of a better outcome."
                : "Tell us what you know, then find a problem that needs it."}
            </p>
            <Link
              href={company ? "/post-problem" : "/portfolio"}
              className="button primary"
            >
              {company ? "Create a problem" : "Update your profile"}{" "}
              <ArrowUpRight size={16} />
            </Link>
            <div className="overview-links">
              <button onClick={() => setTab("Applications")}>
                Applications{" "}
                <span>
                  {dash.applications.length ||
                    dash.posted.reduce(
                      (n, p) => n + (p.applications?.length || 0),
                      0,
                    )}{" "}
                  <ArrowRight size={16} />
                </span>
              </button>
              <button onClick={() => setTab("Competitions")}>
                Competitions{" "}
                <span>
                  {company
                    ? dash.posted.filter((p) => p.hackathon).length
                    : dash.registrations.length}
                  <ArrowRight size={16} />
                </span>
              </button>
              <button onClick={() => setTab("Teams")}>
                Your teams{" "}
                <span>
                  {dash.teams.length}
                  <ArrowRight size={16} />
                </span>
              </button>
            </div>
          </section>
          <aside>
            <span className="eyebrow">A NOTE ON REAL PROOF</span>
            <h2>
              Let the work
              <br />
              <em>speak for you.</em>
            </h2>
            <p>
              Every proposal, project and contribution is a chance to make
              something you can point to.
            </p>
            <Link href="/portfolio" className="text-link">
              Open your portfolio <ArrowUpRight size={16} />
            </Link>
            {data.user?.role === "ADMIN" && (
              <Link href="/admin" className="text-link">
                Administration <ArrowUpRight size={16} />
              </Link>
            )}
          </aside>
        </div>
      )}
      {tab === "My problems" && (
        <>
          {dash.posted.length ? (
            dash.posted.map((p) => (
              <article className="management-row" key={p.id}>
                <div>
                  <span className="tag">{p.status}</span>
                  <h3>{p.title}</h3>
                  <p>
                    {p.applications?.length || 0} applications · {p.reward}
                  </p>
                </div>
                <button
                  className="button outline"
                  onClick={() => setEditing(p)}
                >
                  Edit brief <ArrowUpRight size={16} />
                </button>
              </article>
            ))
          ) : (
            <Empty
              title="Start with a real question."
              copy="Your draft and published problems will appear here."
              action={
                <Link href="/post-problem" className="button primary">
                  Post your first problem
                </Link>
              }
            />
          )}
        </>
      )}
      {tab === "Applications" && (
        <>
          {company
            ? dash.posted.flatMap((p) =>
                (p.applications || []).map((a) => (
                  <article className="application-row" key={a.id}>
                    <span className="eyebrow">{p.title}</span>
                    <h3>{a.user?.name}</h3>
                    <p className="pre-wrap">{a.proposal}</p>
                    {a.estimate && <p>Estimate: {a.estimate}</p>}
                    <div className="inline-actions">
                      <span className="tag">{a.status}</span>
                      {["SHORTLISTED", "ACCEPTED", "DECLINED"].map((status) => (
                        <button
                          className="button outline small"
                          key={status}
                          disabled={
                            a.status === status || a.status === "ACCEPTED"
                          }
                          onClick={() =>
                            run(
                              "application-status",
                              { id: a.id, status },
                              `Application ${status.toLowerCase()}.`,
                            )
                          }
                        >
                          {status === "SHORTLISTED"
                            ? "Shortlist"
                            : status === "ACCEPTED"
                              ? "Accept proposal"
                              : "Decline"}
                        </button>
                      ))}
                    </div>
                  </article>
                )),
              )
            : dash.applications.map((a) => (
                <article key={a.id} className="management-row">
                  <div>
                    <span className="tag">{a.status}</span>
                    <h3>{a.problem.title}</h3>
                    <p>{a.estimate || "No estimate supplied"}</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => onSelect(a.problem)}
                  >
                    View brief <ArrowUpRight size={16} />
                  </button>
                </article>
              ))}
          {!(company
            ? dash.posted.some((p) => p.applications?.length)
            : dash.applications.length) && (
            <Empty
              title="The next conversation starts with a proposal."
              copy={
                company
                  ? "Applications to your published problems will appear here."
                  : "Find a challenge and tell the organizer how you would approach it."
              }
            />
          )}
        </>
      )}
      {tab === "Saved" && (
        <>
          {dash.saved.map(({ problem: p }) => (
            <article key={p.id} className="management-row">
              <div>
                <span className="tag">{p.engagement.name}</span>
                <h3>{p.title}</h3>
                <p>{p.reward}</p>
              </div>
              <div className="inline-actions">
                <button className="text-link" onClick={() => onSelect(p)}>
                  View <ArrowUpRight size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${p.title} from saved`}
                  onClick={() =>
                    run("save", { id: p.id }, "Removed from saved.")
                  }
                >
                  <X size={18} />
                </button>
              </div>
            </article>
          ))}
          {!dash.saved.length && (
            <Empty
              title="Keep a good possibility close."
              copy="Save opportunities from the brief to come back to them later."
            />
          )}
        </>
      )}
      {tab === "Competitions" && (
        <>
          {company
            ? dash.posted
                .filter((p) => p.hackathon)
                .map((p) => (
                  <article key={p.id} className="management-row">
                    <div>
                      <span className="tag">HACKATHON</span>
                      <h3>{p.title}</h3>
                      <p>Submissions are private to you and their authors.</p>
                    </div>
                    <button
                      className="button outline"
                      onClick={() => openReview(p)}
                    >
                      Review submissions <ArrowUpRight size={16} />
                    </button>
                  </article>
                ))
            : dash.registrations.map((r) => (
                <article
                  key={r.hackathon.problem.id}
                  className="management-row"
                >
                  <div>
                    <span className="tag">REGISTERED</span>
                    <h3>{r.hackathon.problem.title}</h3>
                    <p>
                      {dash.submissions.some(
                        (s) =>
                          s.hackathonId === r.hackathon.problem.hackathon?.id,
                      )
                        ? "Project submitted"
                        : "Your project is waiting to be submitted."}
                    </p>
                  </div>
                  <button
                    className="button outline"
                    onClick={() =>
                      onSelect(
                        data.problems.find(
                          (p) => p.id === r.hackathon.problem.id,
                        ) || r.hackathon.problem,
                      )
                    }
                  >
                    Open competition <ArrowUpRight size={16} />
                  </button>
                </article>
              ))}
          {!(company
            ? dash.posted.some((p) => p.hackathon)
            : dash.registrations.length) && (
            <Empty
              title="Give an idea a deadline."
              copy="Your competitions and registrations will appear here."
              action={
                <Link className="button outline" href="/hackathons">
                  Explore the arena <ArrowRight size={16} />
                </Link>
              }
            />
          )}
        </>
      )}
      {tab === "Teams" && (
        <>
          {dash.invitations.map((i) => (
            <article className="management-row" key={i.id}>
              <div>
                <span className="tag">INVITATION</span>
                <h3>{i.team.name}</h3>
              </div>
              <button
                className="button primary small"
                onClick={() =>
                  run("accept-invite", { id: i.id }, "You joined the team.")
                }
              >
                Accept invitation
              </button>
            </article>
          ))}
          {dash.teams.map((t) => (
            <article className="team-manage" key={t.id}>
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              {t.members?.map((m) => (
                <div className="member-row" key={m.userId}>
                  <span>
                    {m.user.name}{" "}
                    <span className="mono">
                      {m.role} · {m.status}
                    </span>
                  </span>
                  {t.members?.some(
                    (n) => n.userId === data.user?.id && n.role === "OWNER",
                  ) &&
                    m.status === "REQUESTED" && (
                      <div className="inline-actions">
                        <button
                          className="button outline small"
                          onClick={() =>
                            run(
                              "team-member",
                              { id: t.id, userId: m.userId, status: "ACTIVE" },
                              "Member approved.",
                            )
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="text-link"
                          onClick={() =>
                            run(
                              "team-member",
                              {
                                id: t.id,
                                userId: m.userId,
                                status: "DECLINED",
                              },
                              "Request declined.",
                            )
                          }
                        >
                          Decline
                        </button>
                      </div>
                    )}
                </div>
              ))}
              {t.members?.some(
                (m) => m.userId === data.user?.id && m.role === "OWNER",
              ) && (
                <InlineForm
                  fields={[
                    {
                      name: "email",
                      label: "Invite an existing account by email",
                      type: "email",
                    },
                  ]}
                  submit="Send invitation"
                  onSubmit={(v) =>
                    run(
                      "invite",
                      { id: t.id, ...v },
                      "Invitation added to their workspace.",
                    )
                  }
                />
              )}
            </article>
          ))}
          {!dash.teams.length && (
            <Empty
              title="Good work has good company."
              copy="Find a team or start one around a problem you care about."
              action={
                <Link className="button outline" href="/collaborate">
                  Find your people <Users size={16} />
                </Link>
              }
            />
          )}
        </>
      )}
      {tab === "Projects" && (
        <>
          {dash.contracts.map((c) => (
            <article className="contract-panel" key={c.id}>
              <span className="eyebrow">ENGAGEMENT · {c.status}</span>
              <h3>{c.problem.title}</h3>
              {c.status === "PROPOSED" &&
                c.application.userId === data.user?.id && (
                  <button
                    className="button primary small"
                    onClick={() =>
                      run(
                        "contract-state",
                        { id: c.id, status: "ACTIVE" },
                        "Participation confirmed. This is a project record; payment processing is unavailable.",
                      )
                    }
                  >
                    Confirm participation <Check size={15} />
                  </button>
                )}
              {c.status === "ACTIVE" && c.problem.ownerId === data.user?.id && (
                <button
                  className="button outline small"
                  onClick={() =>
                    run(
                      "contract-state",
                      { id: c.id, status: "COMPLETED" },
                      "Project completed. No payment was processed.",
                    )
                  }
                >
                  Complete project
                </button>
              )}
              <p className="form-hint">
                Payment processing is unavailable. Milestone amounts record an
                agreement; they do not indicate funds held or paid.
              </p>
              {c.milestones.map((m) => (
                <div className="milestone" key={m.id}>
                  <div>
                    <h4>{m.title}</h4>
                    <span className="tag">{m.status}</span>
                    <span className="mono">
                      {" "}
                      ₹{(m.amount / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {m.deliverables.map((d) => (
                    <p key={d.id}>
                      <a
                        className="text-link"
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View deliverable <ExternalLink size={14} />
                      </a>{" "}
                      — {d.notes}
                    </p>
                  ))}
                  {c.problem.ownerId === data.user?.id ? (
                    <button
                      className="button outline small"
                      disabled={
                        !m.deliverables.length || m.status === "COMPLETED"
                      }
                      onClick={() =>
                        run(
                          "complete-milestone",
                          { id: m.id },
                          "Milestone marked complete. No payment was processed.",
                        )
                      }
                    >
                      Approve completion
                    </button>
                  ) : (
                    <InlineForm
                      fields={[
                        { name: "url", label: "Deliverable URL", type: "url" },
                        { name: "notes", label: "Delivery notes" },
                      ]}
                      submit="Submit deliverable"
                      onSubmit={(v) =>
                        run(
                          "deliver",
                          { id: m.id, ...v },
                          "Deliverable submitted.",
                        )
                      }
                    />
                  )}
                </div>
              ))}
              {c.problem.ownerId === data.user?.id && (
                <InlineForm
                  fields={[
                    { name: "title", label: "Milestone title" },
                    { name: "amount", label: "Amount (INR)", type: "number" },
                  ]}
                  submit="Add milestone"
                  onSubmit={(v) =>
                    run(
                      "milestone",
                      {
                        id: c.id,
                        title: v.title,
                        amount: Math.round(Number(v.amount) * 100),
                      },
                      "Milestone added.",
                    )
                  }
                />
              )}
            </article>
          ))}
          {!dash.contracts.length && (
            <Empty
              title="Make room for meaningful work."
              copy="Accepted proposals become project records here. Payments require a future provider integration."
            />
          )}
        </>
      )}
      <div className="workspace-bottom">
        <Link href="/portfolio" className="text-link">
          Profile settings <ArrowUpRight size={15} />
        </Link>
        <button
          className="text-link"
          onClick={async () => {
            await onSignOut();
          }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
      <AnimatePresence>
        {editing && (
          <Dialog
            title="Edit your problem"
            onClose={() => setEditing(null)}
            wide
          >
            <PostProblem
              data={data}
              act={act}
              notify={notify}
              onAuth={() => {}}
              onDone={() => {
                setEditing(null);
                void onRefresh();
              }}
              editing={editing}
            />
          </Dialog>
        )}
        {reviewId && (
          <Dialog title="Organizer review" onClose={() => setReviewId("")} wide>
            <h2>
              Work in progress.
              <br />
              <em>Ideas in the making.</em>
            </h2>
            {submissions.length ? (
              submissions.map((s) => (
                <article className="submission-review" key={s.id}>
                  <span className="eyebrow">{s.user.name}</span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="inline-actions">
                    {s.github && (
                      <a
                        href={s.github}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                      >
                        Repository <ExternalLink size={14} />
                      </a>
                    )}
                    {s.demo && (
                      <a
                        href={s.demo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                      >
                        Demo <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <InlineForm
                    fields={(
                      dash.posted.find((p) => p.id === reviewId)?.hackathon
                        ?.criteria || []
                    ).map((c) => ({
                      name: c.id,
                      label: `${c.name} (0–${c.maxScore})`,
                      type: "number",
                    }))}
                    submit="Save scores"
                    onSubmit={async (v) => {
                      await run(
                        "score",
                        {
                          id: s.id,
                          scores: Object.entries(v).map(
                            ([criterionId, value]) => ({
                              criterionId,
                              value: Number(value),
                            }),
                          ),
                        },
                        "Scores saved.",
                      );
                    }}
                  />
                </article>
              ))
            ) : (
              <p className="muted">No submissions yet.</p>
            )}
            {submissions.length > 0 && (
              <button
                className="button primary"
                onClick={() =>
                  run(
                    "publish-results",
                    { id: reviewId },
                    "Results published with organizer-confirmed achievements.",
                  )
                }
              >
                Publish scored results <ArrowUpRight size={16} />
              </button>
            )}
            <FormError error={issue} />
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
