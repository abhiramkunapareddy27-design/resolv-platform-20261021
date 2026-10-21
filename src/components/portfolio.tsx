"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check, ArrowUpRight, ExternalLink, Plus } from "lucide-react";
import type { Platform, Dashboard, Profile } from "@/lib/types";
import {
  type Act,
  type Notify,
  PageHeading,
  Field,
  FormError,
  Submit,
  InlineForm,
  Empty,
  messageOf,
} from "./ui";
export function Portfolio({
  data,
  dash,
  act,
  notify,
}: {
  data: Platform;
  dash: Dashboard | null;
  act: Act;
  notify: Notify;
}) {
  const p = data.user?.profile;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<
    {
      id: string;
      title: string;
      description: string;
      url: string;
      provenance: string;
    }[]
  >([]);
  const [tab, setTab] = useState("Profile");
  const load = useCallback(async () => {
    const r = await fetch("/api/platform?view=portfolio");
    if (r.ok) {
      const d = await r.json();
      setProjects(d.projects);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) void load();
    });
    return () => controller.abort();
  }, [load]);
  const fields: (keyof Profile)[] = [
    "bio",
    "skills",
    "interests",
    "availability",
    "github",
    "linkedin",
    "website",
  ];
  return (
    <>
      <PageHeading
        eyebrow="YOUR BODY OF WORK"
        title={
          <>
            Less résumé.
            <br />
            <em>More real work.</em>
          </>
        }
        copy="Your skills, your perspective, and the things you’ve helped bring into the world."
      />
      <div className="profile-public-link">
        <Link href={`/people/${data.user?.id}`} className="text-link">
          View your public portfolio <ArrowUpRight size={15} />
        </Link>
        <span>
          Your biography, skills and shared work are public. Email stays
          private.
        </span>
      </div>
      <div className="tabs">
        {["Profile", "Projects", "Achievements"].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Profile" && (
        <div className="form-layout">
          <form
            className="editor-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await act(
                  "profile",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                notify("Profile updated. Your next chapter is taking shape.");
              } catch (e) {
                setError(messageOf(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field
              label="Your name"
              name="name"
              defaultValue={data.user?.name}
              required
              minLength={2}
            />
            <label>
              I’m here as
              <select
                name="role"
                defaultValue={
                  data.user?.role === "ADMIN" ? "COMPANY" : data.user?.role
                }
              >
                {[
                  ["STUDENT", "Student / creator"],
                  ["FREELANCER", "Freelancer"],
                  ["COMPANY", "Company / founder"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Experience level
              <select
                name="experience"
                defaultValue={p?.experience || "Beginner"}
              >
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            {fields.map((f) =>
              f === "bio" ? (
                <label key={f}>
                  A little about you
                  <textarea
                    name={f}
                    defaultValue={p?.[f]}
                    rows={5}
                    maxLength={2000}
                  />
                </label>
              ) : (
                <Field
                  key={f}
                  name={f}
                  label={
                    {
                      skills: "Skills (comma separated)",
                      interests: "Interests (comma separated)",
                      availability: "Availability",
                      github: "GitHub URL",
                      linkedin: "LinkedIn URL",
                      website: "Personal website",
                      bio: "Biography",
                      experience: "Experience level",
                    }[f]
                  }
                  defaultValue={p?.[f] || ""}
                  type={
                    ["github", "linkedin", "website"].includes(f)
                      ? "url"
                      : "text"
                  }
                />
              ),
            )}
            <FormError error={error} />
            <Submit busy={busy}>
              Save your profile <Check size={16} />
            </Submit>
          </form>
          <aside className="writing-aside">
            <span className="eyebrow">A PROFILE THAT MEANS SOMETHING</span>
            <h3>
              Be specific.
              <br />
              Be yourself.
            </h3>
            <p>
              Skills inform your opportunity matches. Work and achievements
              provide the context a list of skills can’t.
            </p>
            <p>
              Your profile information is self-reported. Verification is
              reserved for confirmed outcomes.
            </p>
            {data.user?.role === "COMPANY" && (
              <>
                <h4>Your organization</h4>
                <InlineForm
                  fields={[
                    { name: "name", label: "Organization name" },
                    { name: "description", label: "What you do" },
                  ]}
                  submit="Create organization"
                  onSubmit={async (v) => {
                    await act("organization", v);
                    notify("Organization created with unverified status.");
                  }}
                />
              </>
            )}
          </aside>
        </div>
      )}
      {tab === "Projects" && (
        <>
          <div className="portfolio-grid">
            {projects.map((p) => (
              <article className="portfolio-project" key={p.id}>
                <span className="tag">SELF-REPORTED</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <a
                  className="text-link"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View project <ExternalLink size={16} />
                </a>
              </article>
            ))}
          </div>
          {!projects.length && (
            <Empty
              title="Your work belongs here."
              copy="Add a project you can share. Self-reported projects are clearly labeled."
            />
          )}
          <details className="add-project">
            <summary>
              <Plus size={17} /> Add a project
            </summary>
            <InlineForm
              fields={[
                { name: "title", label: "Project title (5+ characters)" },
                {
                  name: "description",
                  label: "What did you do? (20+ characters)",
                },
                { name: "url", label: "Project URL", type: "url" },
              ]}
              submit="Add to portfolio"
              onSubmit={async (v) => {
                await act("portfolio", v);
                await load();
                notify("Project added as self-reported work.");
              }}
            />
          </details>
        </>
      )}
      {tab === "Achievements" && (
        <>
          {dash?.achievements.map((a) => (
            <article className="management-row" key={a.id}>
              <div>
                <span className="tag">{a.provenance.replaceAll("_", " ")}</span>
                <h3>{a.title}</h3>
              </div>
              <Link className="text-link" href={a.evidenceUrl}>
                View evidence <ArrowUpRight size={16} />
              </Link>
            </article>
          ))}
          {!dash?.achievements.length && (
            <Empty
              title="Good things take doing."
              copy="Organizer-confirmed competition achievements will appear here after results are published."
            />
          )}
        </>
      )}
    </>
  );
}
