"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import type { Platform, Problem } from "@/lib/types";
import {
  type Act,
  type Notify,
  PageHeading,
  Empty,
  AuthGate,
  Field,
  Submit,
  FormError,
  messageOf,
} from "./ui";
export function localDateTime(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function PostProblem({
  data,
  act,
  notify,
  onAuth,
  onDone,
  editing,
}: {
  data: Platform;
  act: Act;
  notify: Notify;
  onAuth: () => void;
  onDone: () => void;
  editing?: Problem;
}) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [aiText, setAiText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({
    title: editing?.title || "",
    organizationId: editing?.organization?.id || "",
    brief: editing?.brief || "",
    deliverables: editing?.deliverables || "",
    evaluation: editing?.evaluation || "",
    categoryId: editing?.categoryId || data.categories[0]?.id || "",
    engagementId: editing?.engagementId || data.engagements[0]?.id || "",
    difficulty: editing?.difficulty || "Intermediate",
    reward: editing?.reward || "",
    deadline: editing ? localDateTime(new Date(editing.deadline)) : "",
    skills: editing?.skills.map((s) => s.skill.name).join(", ") || "",
    commercialUse: editing?.commercialUse || false,
    ipTerms:
      editing?.ipTerms ||
      "Creators retain ownership. Any commercial license requires a separate written agreement.",
  });
  const value = (name: string) => String(values[name] || "");
  const bind = (name: string) => ({
    name,
    value: value(name),
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });
  const save = async (status: string) => {
    setBusy(true);
    setError("");
    try {
      if (
        !value("deadline") ||
        Number.isNaN(new Date(value("deadline")).getTime())
      )
        throw new Error("Choose a valid future deadline before saving.");
      const body = {
        ...values,
        id: editing?.id,
        categoryId: value("categoryId") || data.categories[0]?.id,
        engagementId: value("engagementId") || data.engagements[0]?.id,
        skills: value("skills")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        deadline:
          editing &&
          value("deadline") === localDateTime(new Date(editing.deadline))
            ? editing.deadline
            : new Date(value("deadline")).toISOString(),
        organizationId: value("organizationId") || undefined,
        status,
      };
      await act("problem", body);
      notify(
        status === "DRAFT"
          ? "Draft saved to your workspace."
          : "Your problem is published. Let the possibilities begin.",
      );
      onDone();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };
  if (!data.user) return <AuthGate onAuth={onAuth} />;
  if (!["COMPANY", "ADMIN"].includes(data.user.role))
    return (
      <Empty
        title="Bring a problem to the table."
        copy="Choose “Company / founder” in your portfolio settings to create and manage opportunities."
        action={
          <Link href="/portfolio" className="button primary">
            Set up your company profile <ArrowRight size={16} />
          </Link>
        }
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="A GOOD BRIEF IS A GOOD BEGINNING"
        title={
          <>
            {editing ? "Refine your" : "Post a real"}
            <br />
            <em>problem.</em>
          </>
        }
        copy="Be clear about the challenge. Be fair about the reward. Leave room for a fresh perspective."
      />
      <div className="form-layout">
        <div>
          <div className="form-progress">
            {["The challenge", "The opportunity", "Review & publish"].map(
              (s, i) => (
                <button
                  key={s}
                  className={i === step ? "current" : ""}
                  onClick={() => {
                    if (i < step) setStep(i);
                  }}
                  disabled={i > step}
                >
                  <span>{i + 1}</span>
                  {s}
                </button>
              ),
            )}
          </div>
          <form
            ref={formRef}
            className="editor-form"
            aria-label="Problem brief creation"
            tabIndex={-1}
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 2) {
                const visible = new FormData(e.currentTarget);
                const captured = Object.fromEntries(
                  Array.from(visible.entries()).map(([key, val]) => [
                    key,
                    String(val),
                  ]),
                );
                setValues((previous) => ({
                  ...previous,
                  ...captured,
                  ...(step === 1
                    ? { commercialUse: visible.has("commercialUse") }
                    : {}),
                }));
                setStep(step + 1);
              } else void save("PUBLISHED");
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
                onAnimationComplete={() => {
                  if (step > 0) {
                    formRef.current?.scrollIntoView({
                      block: "start",
                      behavior: "instant",
                    });
                    formRef.current?.focus({ preventScroll: true });
                  }
                }}
              >
                {step === 0 ? (
                  <>
                    <label>
                      Organization (optional)
                      <select {...bind("organizationId")}>
                        <option value="">Independent organizer</option>
                        {data.organizations.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="Give your problem a clear title"
                      required
                      minLength={8}
                      maxLength={160}
                      placeholder="Help small farms make better use of rainfall data"
                      {...bind("title")}
                    />
                    <label>
                      The brief
                      <textarea
                        required
                        minLength={60}
                        maxLength={12000}
                        rows={8}
                        placeholder="What’s happening, why does it matter, and what do you need help with?"
                        {...bind("brief")}
                      />
                    </label>
                    <div className="form-grid">
                      <label>
                        Discipline
                        <select {...bind("categoryId")} required>
                          {data.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Engagement model
                        <select {...bind("engagementId")} required>
                          {data.engagements.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <Field
                      label="Helpful skills (comma separated)"
                      placeholder="Python, Data science, Research"
                      {...bind("skills")}
                    />
                  </>
                ) : step === 1 ? (
                  <>
                    <label>
                      Expected deliverables
                      <textarea
                        required
                        minLength={10}
                        maxLength={4000}
                        rows={4}
                        placeholder="What should participants submit?"
                        {...bind("deliverables")}
                      />
                    </label>
                    <label>
                      Evaluation criteria & competition rules
                      <textarea
                        required
                        minLength={10}
                        maxLength={4000}
                        rows={4}
                        placeholder="How will work be evaluated? Include eligibility and any constraints."
                        {...bind("evaluation")}
                      />
                    </label>
                    <div className="form-grid">
                      <Field
                        label="Reward / budget disclosure"
                        required
                        minLength={3}
                        maxLength={120}
                        placeholder="₹50,000 prize · or Unpaid collaboration"
                        {...bind("reward")}
                      />
                      <Field
                        label="Deadline (your local time)"
                        type="datetime-local"
                        required
                        min={localDateTime(new Date())}
                        {...bind("deadline")}
                      />
                    </div>
                    <label>
                      Difficulty
                      <select {...bind("difficulty")}>
                        {["Beginner", "Intermediate", "Advanced"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="commercialUse"
                        checked={Boolean(values.commercialUse)}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            commercialUse: e.target.checked,
                          }))
                        }
                      />
                      We may wish to use submitted work commercially.
                    </label>
                    <label>
                      Intellectual property terms
                      <textarea
                        required
                        minLength={20}
                        rows={3}
                        {...bind("ipTerms")}
                      />
                    </label>
                    <p className="form-hint">
                      Publishing never transfers ownership. Licensing requires a
                      separate written agreement. No payments are processed
                      through ReSolv.
                    </p>
                  </>
                ) : (
                  <div className="review-brief">
                    <span className="tag">READY FOR YOUR REVIEW</span>
                    <h2>{value("title")}</h2>
                    <p>{value("brief")}</p>
                    <h3>Deliverables</h3>
                    <p>{value("deliverables")}</p>
                    <h3>Evaluation & rules</h3>
                    <p>{value("evaluation")}</p>
                    <div className="detail-facts">
                      <div>
                        <span className="mono">REWARD</span>
                        <strong>{value("reward")}</strong>
                      </div>
                      <div>
                        <span className="mono">DEADLINE</span>
                        <strong>{value("deadline").replace("T", " · ")}</strong>
                      </div>
                    </div>
                    <div className="ip-notice">
                      <strong>Intellectual property</strong>
                      <p>{value("ipTerms")}</p>
                      <p>
                        Commercial use requested:{" "}
                        {values.commercialUse ? "Yes" : "No"}
                      </p>
                    </div>
                    <label className="checkbox-label">
                      <input type="checkbox" required />
                      I’ve reviewed this brief, the reward disclosure, and the
                      rights of participants.
                    </label>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <FormError error={error} />
            <div className="form-bottom">
              {step > 0 && (
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <Submit busy={busy}>
                {step === 2 ? "Publish problem" : "Continue"}{" "}
                <ArrowRight size={16} />
              </Submit>
              {step === 2 && (
                <button
                  type="button"
                  disabled={busy}
                  className="text-link"
                  onClick={() => save("DRAFT")}
                >
                  Save as draft
                </button>
              )}
            </div>
          </form>
        </div>
        <aside className="writing-aside">
          <span className="eyebrow">A LITTLE GUIDANCE</span>
          <h3>Clear beats clever.</h3>
          <p>
            The best briefs explain what’s needed without prescribing every
            step.
          </p>
          <ul>
            <li>Share the real context.</li>
            <li>Define a useful outcome.</li>
            <li>Disclose the reward and rights.</li>
            <li>Give people room to think.</li>
          </ul>
          <div className="assistant-panel">
            <Sparkles size={20} />
            <h4>A second pair of eyes.</h4>
            <p>
              {data.aiConfigured
                ? "Describe your challenge to generate a draft for your review."
                : "AI drafting isn’t configured yet. You can write and publish your brief using the form."}
            </p>
            {data.aiConfigured && (
              <>
                <label>
                  Your starting point
                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    minLength={30}
                    rows={4}
                  />
                </label>
                <button
                  className="button outline"
                  disabled={busy || aiText.length < 30}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const result = (await act("ai-brief", {
                        description: aiText,
                      })) as { draft: string };
                      setDraft(result.draft);
                    } catch (e) {
                      setError(messageOf(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Generate a draft
                </button>
                {draft && (
                  <div className="ai-draft">
                    <h4>Draft — review before use</h4>
                    <p>{draft}</p>
                    <button
                      className="text-link"
                      onClick={() => {
                        setValues((v) => ({ ...v, brief: draft }));
                        setStep(0);
                      }}
                    >
                      Use as starting brief
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
