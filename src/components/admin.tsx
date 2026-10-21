"use client";
import { useState, useEffect } from "react";
import type { Problem } from "@/lib/types";
import { type Act, type Notify, PageHeading, FormError, messageOf } from "./ui";
export function Admin({ act, notify }: { act: Act; notify: Notify }) {
  const [state, setState] = useState<{
    reports: { id: string; reason: string; problem: Problem }[];
    organizations: { id: string; name: string; verification: string }[];
    problems: Problem[];
    audits: { id: string; action: string; createdAt: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const load = async () => {
    const r = await fetch("/api/platform?view=admin");
    const d = await r.json();
    if (!r.ok) setError(d.error);
    else setState(d);
  };
  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title={
          <>
            A little care.
            <br />
            <em>A healthier exchange.</em>
          </>
        }
        copy="Review reports, verify organizations, and moderate listings."
      />
      <FormError error={error} />
      {state && (
        <>
          <h3>Organization verification</h3>
          {state.organizations.map((o) => (
            <article className="management-row" key={o.id}>
              <div>
                <h4>{o.name}</h4>
                <span className="tag">{o.verification}</span>
              </div>
              <button
                className="button outline"
                disabled={o.verification === "VERIFIED"}
                onClick={async () => {
                  try {
                    await act("verify-organization", {
                      id: o.id,
                      status: "VERIFIED",
                    });
                    notify("Organization verified.");
                    await load();
                  } catch (e) {
                    setError(messageOf(e));
                  }
                }}
              >
                Confirm verification
              </button>
            </article>
          ))}
          <h3>Reported listings</h3>
          {state.reports.map((r) => (
            <article className="management-row" key={r.id}>
              <div>
                <h4>{r.problem.title}</h4>
                <p>{r.reason}</p>
              </div>
              <button
                className="button outline"
                onClick={async () => {
                  try {
                    await act("moderate", {
                      id: r.problem.id,
                      status: "REMOVED",
                    });
                    await load();
                    notify("Listing removed from the exchange.");
                  } catch (e) {
                    setError(messageOf(e));
                  }
                }}
              >
                Remove listing
              </button>
            </article>
          ))}
          {!state.reports.length && (
            <p className="muted">No reported content to review.</p>
          )}
          <h3>Recent platform activity</h3>
          {state.audits.map((a) => (
            <div className="audit-row" key={a.id}>
              <span>{a.action}</span>
              <time>
                {new Date(a.createdAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
              </time>
            </div>
          ))}
        </>
      )}
    </>
  );
}
