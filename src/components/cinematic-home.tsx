"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { createTimeline, svg } from "animejs";
import { ArrowUpRight, ArrowDown, ArrowRight } from "lucide-react";
import { clamp, cinematicStops, createScrollSignal } from "@/lib/cinematic";
const Sculpture = dynamic(() => import("./sculpture"), { ssr: false });
const scenes = [
  {
    label: "THE UNSOLVED",
    heading: (
      <>
        Some problems
        <br />
        are worth <em>solving.</em>
      </>
    ),
    copy: "Find the people. Build the answer.",
  },
  {
    label: "A DIFFERENT PERSPECTIVE",
    heading: (
      <>
        Look at it
        <br />
        <em>differently.</em>
      </>
    ),
    copy: "A problem is rarely just one thing.",
  },
  {
    label: "OPEN POSSIBILITIES",
    heading: (
      <>
        Different minds.
        <br />
        <em>New possibilities.</em>
      </>
    ),
    copy: "A skill. An idea. A perspective you were missing.",
  },
  {
    label: "THE CONNECTION",
    heading: (
      <>
        Find the people.
        <br />
        <em>Build the answer.</em>
      </>
    ),
    copy: "Good work begins where different worlds meet.",
  },
  {
    label: "A SHARED OUTCOME",
    heading: (
      <>
        Better things are
        <br />
        built <em>together.</em>
      </>
    ),
    copy: "Real problems. Real talent. Real outcomes.",
  },
  {
    label: "YOUR NEXT BEGINNING",
    heading: (
      <>
        What will you
        <br />
        <em>make possible?</em>
      </>
    ),
    copy: "There’s a good place to start.",
  },
];
export function CinematicHome() {
  const root = useRef<HTMLElement>(null);
  const signal = useMemo(() => createScrollSignal(), []);
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const el = root.current;
    if (!el) return;
    const initialReduced = media.matches;
    const staticView = initialReduced || compact;
    queueMicrotask(() => setReduced(initialReduced));
    const state = { progress: 0 };
    let activePhase = -1;
    const timeline = createTimeline({
      autoplay: false,
      defaults: { ease: "linear" },
    });
    timeline.add(state, { progress: [0, 1], duration: 10000 }, 0);
    const texts = el.querySelectorAll<HTMLElement>(".film-scene");
    texts.forEach((text, i) => {
      const start = cinematicStops[i] * 10000;
      const finish = cinematicStops[i + 1] * 10000;
      timeline.add(
        text,
        {
          opacity: i === 0 ? [1, 1] : [0, 1],
          translateY: i === 0 ? [0, 0] : [18, 0],
          duration: i === 0 ? 1 : 350,
        },
        i === 0 ? 0 : start,
      );
      if (i < 5)
        timeline.add(
          text,
          { opacity: [1, 0], translateY: [0, -14], duration: 280 },
          finish - 280,
        );
    });
    const drawable = svg.createDrawable(
      el.querySelectorAll(".film-progress-path"),
    );
    timeline.add(drawable, { draw: ["0 0", "0 1"], duration: 10000 }, 0);
    let raf = 0;
    const update = () => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const distance = el.offsetHeight - innerHeight;
      const p = staticView ? 0 : clamp(-box.top / Math.max(1, distance));
      timeline.seek(p * 10000);
      signal.set(state.progress);
      const next =
        p >= 1
          ? 5
          : Math.min(
              5,
              Math.max(
                0,
                cinematicStops.findIndex(
                  (stop, index) => index > 0 && p < stop,
                ) - 1,
              ),
            );
      if (next !== activePhase) {
        activePhase = next;
        setPhase(next);
      }

      el.style.setProperty("--film-progress", String(p));
    };
    const scroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    const observer = new ResizeObserver(scroll);
    observer.observe(el);
    update();
    const preference = () => setReduced(media.matches);
    media.addEventListener("change", preference);
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      media.removeEventListener("change", preference);
      observer.disconnect();
      cancelAnimationFrame(raf);
      timeline.revert();
    };
  }, [compact, reduced, signal]);
  const skip = () => {
    const element = root.current;
    if (!element) return;
    window.scrollTo({
      top: element.offsetTop + (element.offsetHeight - innerHeight) * 0.94,
      behavior: reduced ? "instant" : "smooth",
    });
  };
  return (
    <section
      ref={root}
      data-phase={phase}
      className={`cinematic-scroll ${reduced || compact ? "film-static" : ""}`}
      aria-label="From a problem to a shared solution"
    >
      <div className="film-sticky">
        <Sculpture signal={signal} reduced={reduced || compact} />
        <div className="film-grain" aria-hidden="true" />
        <div className="film-topline">
          <span>RE SOLV / A PLACE TO BEGIN</span>
          <span>INDEPENDENT MINDS. SHARED POSSIBILITIES.</span>
        </div>
        <div className="film-copy">
          {scenes.map((scene, i) => (
            <div
              className="film-scene"
              key={scene.label}
              data-scene={i}
              aria-hidden={phase !== i}
            >
              <span className="film-eyebrow">
                0{i + 1} / {scene.label}
              </span>
              {i === 0 ? <h1>{scene.heading}</h1> : <h2>{scene.heading}</h2>}
              <p>{scene.copy}</p>
              {i === 5 && (
                <div className="film-entry">
                  <Link
                    href="/explore"
                    className="button primary"
                    tabIndex={phase === 5 ? 0 : -1}
                  >
                    Explore problems <ArrowUpRight size={17} />
                  </Link>
                  <Link
                    href="/post-problem"
                    className="text-link"
                    tabIndex={phase === 5 ? 0 : -1}
                  >
                    Post a problem <ArrowUpRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
        <div
          className={`film-annotations ${phase === 2 || phase === 3 ? "visible" : ""}`}
          aria-hidden="true"
        >
          <span className="annotation-one">01 — THE QUESTION</span>
          <span className="annotation-two">02 — THE PEOPLE</span>
          <span className="annotation-three">03 — THE POSSIBILITY</span>
        </div>
        <div className="film-side-note">
          <span className="film-cross">+</span>
          <p>
            THE COMMON FORM
            <br />A STUDY IN COMING TOGETHER
          </p>
          <span>SCROLL-DRIVEN / 001</span>
        </div>
        <div className="film-bottom">
          <div className="film-scroll-cue">
            <ArrowDown size={15} />
            <span>
              {phase >= 4
                ? "A new shape. A new beginning."
                : "Scroll to change the perspective"}
            </span>
          </div>
          <div className="film-progress">
            <span>0{phase + 1}</span>
            <svg viewBox="0 0 180 2" aria-hidden="true">
              <path d="M0 1 H180" stroke="currentColor" opacity=".2" />
              <path
                className="film-progress-path"
                d="M0 1 H180"
                stroke="currentColor"
              />
            </svg>
            <span>06</span>
          </div>
          <Link href="/explore" className="film-direct-link">
            Enter the exchange <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="film-controls">
          <button
            onClick={() => {
              setCompact(!compact);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            {compact ? "Restore scroll experience" : "Simple view"}
          </button>
          {!compact && !reduced && (
            <button onClick={skip}>
              Skip the story <ArrowRight size={12} />
            </button>
          )}
        </div>
        {(reduced || compact) && (
          <div className="film-accessible-entry">
            <Link href="/explore" className="button primary">
              Explore problems <ArrowUpRight size={17} />
            </Link>
            <Link href="/post-problem" className="text-link">
              Post a problem <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
