"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, Plus, ArrowUpRight } from "lucide-react";
import type { Platform } from "@/lib/types";
import {
  type Act,
  type Notify,
  PageHeading,
  FormError,
  Empty,
  Dialog,
  InlineForm,
  messageOf,
} from "./ui";
export function Teams({
  data,
  act,
  notify,
}: {
  data: Platform;
  act: Act;
  notify: Notify;
}) {
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const teams = data.teams.filter((t) =>
    `${t.name} ${t.skills} ${t.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="THE COLLABORATION NETWORK"
        title={
          <>
            Different minds.
            <br />
            <em>Better together.</em>
          </>
        }
        copy="Find the skills you’re missing. Meet people who care about the same problems."
      />
      <div className="section-top">
        <div className="search-bar compact-search">
          <Search size={18} />
          <input
            aria-label="Search teams"
            placeholder="Find a team by name or skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="button primary" onClick={() => setCreate(true)}>
          Start a team <Plus size={17} />
        </button>
      </div>
      <FormError error={error} />
      <div className="team-grid">
        {teams.map((t, i) => (
          <motion.article
            whileHover={{ y: -3 }}
            className="team-card"
            key={t.id}
          >
            <span className={`team-symbol tone-${i % 3}`}>✳</span>
            <span className="mono">
              {t._count?.members || 0} ACTIVE MEMBERS
            </span>
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <div className="skill-line">
              {t.skills
                .split(",")
                .filter(Boolean)
                .map((s) => (
                  <span key={s}>{s.trim()}</span>
                ))}
            </div>
            <button
              className="text-link"
              onClick={async () => {
                try {
                  await act("join-team", { id: t.id });
                  notify(
                    "Request sent. The team owner can approve it in their workspace.",
                  );
                } catch (e) {
                  setError(messageOf(e));
                }
              }}
            >
              Request to join <ArrowUpRight size={16} />
            </button>
          </motion.article>
        ))}
      </div>
      {!teams.length && (
        <Empty
          title="There’s room for your kind of team."
          copy="Start with a shared interest, a worthwhile problem, and an open invitation."
        />
      )}
      <AnimatePresence>
        {create && (
          <Dialog
            title="MAKE ROOM FOR DIFFERENT MINDS"
            onClose={() => setCreate(false)}
          >
            <h2>
              Start something
              <br />
              <em>together.</em>
            </h2>
            <InlineForm
              fields={[
                { name: "name", label: "Team name" },
                {
                  name: "description",
                  label: "What do you want to build? (20+ characters)",
                },
                {
                  name: "skills",
                  label: "Skills you bring or need (comma separated)",
                },
              ]}
              submit="Create team"
              onSubmit={async (v) => {
                await act("team", v);
                notify("Team created. Invite people in your workspace.");
                setCreate(false);
              }}
            />
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
