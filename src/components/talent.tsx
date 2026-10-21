"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Search, ArrowUpRight, ExternalLink, ArrowLeft } from "lucide-react";
import { Empty, Loading, FormError } from "./ui";
type Talent = {
  id: string;
  name: string;
  role: string;
  profile: {
    bio: string;
    skills: string;
    interests: string;
    experience: string;
    availability: string;
    github: string;
    linkedin: string;
    website: string;
    portfolio: {
      projects: {
        id: string;
        title: string;
        description: string;
        url: string;
        provenance: string;
      }[];
    } | null;
  };
  achievements: {
    id: string;
    title: string;
    provenance: string;
    evidenceUrl: string;
  }[];
  _count: { submissions: number };
};
export function TalentDiscovery({ personId }: { personId?: string }) {
  const [people, setPeople] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All minds");
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      "/api/talent" + (personId ? "?id=" + encodeURIComponent(personId) : ""),
      { signal: controller.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setPeople(d.people);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [personId]);
  const filtered = people.filter(
    (p) =>
      (role === "All minds" || p.role === role) &&
      `${p.name} ${p.profile.skills} ${p.profile.bio}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (personId) {
    const person = people[0];
    return (
      <div className="public-profile">
        <Link className="text-link" href="/talent">
          <ArrowLeft size={15} /> All talent
        </Link>
        {loading ? (
          <Loading />
        ) : person ? (
          <>
            <div className="public-profile-heading">
              <span className="talent-initial">
                {person.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <span className="eyebrow">
                  {person.role.replaceAll("_", " ")} / A BODY OF WORK
                </span>
                <h1>{person.name}</h1>
                <p>
                  {person.profile.availability} · {person.profile.experience}
                </p>
              </div>
            </div>
            <div className="public-profile-grid">
              <aside>
                <h3>A little context.</h3>
                <p>{person.profile.bio || "A profile taking shape."}</p>
                <h4>Skills</h4>
                <div className="skill-line">
                  {person.profile.skills
                    .split(",")
                    .filter(Boolean)
                    .map((s) => (
                      <span key={s}>{s.trim()}</span>
                    ))}
                </div>
                <h4>Elsewhere</h4>
                {[
                  ["GitHub", person.profile.github],
                  ["LinkedIn", person.profile.linkedin],
                  ["Website", person.profile.website],
                ]
                  .filter(([, url]) => Boolean(url))
                  .map(([name, url]) => (
                    <a
                      className="text-link"
                      href={url}
                      key={name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {name}
                      <ExternalLink size={13} />
                    </a>
                  ))}
                <p className="form-hint">
                  Biography, skills, experience and external projects are
                  self-reported.
                </p>
              </aside>
              <section>
                <div className="portfolio-section-heading">
                  <h2>The work.</h2>
                  <span className="mono">
                    {person.profile.portfolio?.projects.length || 0} PROJECTS
                  </span>
                </div>
                {person.profile.portfolio?.projects.map((project) => (
                  <article key={project.id} className="public-project">
                    <span className="eyebrow">
                      {project.provenance.replaceAll("_", " ")}
                    </span>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <a
                      className="text-link"
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View the work <ArrowUpRight size={16} />
                    </a>
                  </article>
                ))}
                {!person.profile.portfolio?.projects.length && (
                  <p className="profile-empty">
                    This body of work is still taking shape.
                  </p>
                )}
                <h3 className="achievements-title">Confirmed outcomes</h3>
                {person.achievements.map((a) => (
                  <article className="public-achievement" key={a.id}>
                    <span className="eyebrow">ORGANIZER CONFIRMED</span>
                    <h3>{a.title}</h3>
                    <Link href={a.evidenceUrl} className="text-link">
                      View results <ArrowUpRight size={15} />
                    </Link>
                  </article>
                ))}
                {!person.achievements.length && (
                  <p className="profile-empty">
                    No organizer-confirmed achievements yet.
                  </p>
                )}
              </section>
            </div>
          </>
        ) : (
          <Empty
            title="This profile is still taking shape."
            copy="Public profiles appear once someone adds a biography, skills, or a portfolio project."
          />
        )}
        <FormError error={error} />
      </div>
    );
  }
  return (
    <div className="talent-page">
      <div className="talent-heading">
        <div>
          <span className="eyebrow">THE PEOPLE BEHIND THE POSSIBILITIES</span>
          <h1>
            Good minds.
            <br />
            <em>Even better company.</em>
          </h1>
        </div>
        <div>
          <p>
            Look past a list of titles.
            <br />
            Find a perspective. Follow the work.
          </p>
          <span className="mono">SKILLS · EVIDENCE · POTENTIAL</span>
        </div>
      </div>
      <div className="talent-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search talent"
            placeholder="A skill, a name, a different perspective…"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filter talent by role"
        >
          {[
            ["All minds", "All minds"],
            ["STUDENT", "Students & creators"],
            ["FREELANCER", "Freelancers"],
            ["COMPANY", "Founders"],
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <FormError error={error} />
      {loading ? (
        <Loading />
      ) : (
        <motion.div layout className="talent-directory">
          <AnimatePresence>
            {filtered.map((person, i) => (
              <motion.article
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="talent-entry"
                key={person.id}
              >
                <div className="talent-entry-index">
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="talent-initial">
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                </div>
                <div className="talent-person">
                  <span className="eyebrow">
                    {person.role === "STUDENT"
                      ? "STUDENT / CREATOR"
                      : person.role}
                  </span>
                  <h2>
                    <Link href={`/people/${person.id}`}>{person.name}</Link>
                  </h2>
                  <p>
                    {person.profile.bio ||
                      "A curious mind with something to contribute."}
                  </p>
                  <div className="skill-line">
                    {person.profile.skills
                      .split(",")
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((s) => (
                        <span key={s}>{s.trim()}</span>
                      ))}
                  </div>
                </div>
                <div className="talent-evidence">
                  <span>
                    {person.profile.portfolio?.projects.length || 0} shared
                    projects
                  </span>
                  <span>{person.achievements.length} confirmed outcomes</span>
                  <Link href={`/people/${person.id}`} className="text-link">
                    Meet the work <ArrowUpRight size={17} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      {!loading && !filtered.length && (
        <Empty
          title="Make a little room for new perspectives."
          copy="No public profiles match yet. Add skills and a biography in your portfolio to make your work discoverable."
          action={
            <Link href="/portfolio" className="button outline">
              Build your profile <ArrowUpRight size={16} />
            </Link>
          }
        />
      )}
    </div>
  );
}
