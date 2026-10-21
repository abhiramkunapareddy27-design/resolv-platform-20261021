"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  X,
  Sun,
  Moon,
  Menu,
  Plus,
  Check,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { Platform, Problem, Dashboard } from "@/lib/types";
import dynamic from "next/dynamic";
const CinematicHome = dynamic(() =>
  import("./cinematic-home").then((m) => m.CinematicHome),
);
const About = dynamic(() => import("./about").then((m) => m.About));
const TalentDiscovery = dynamic(() =>
  import("./talent").then((m) => m.TalentDiscovery),
);
import { Dialog, Empty, AuthGate } from "./ui";
const AuthForm = dynamic(() => import("./auth-form").then((m) => m.AuthForm));
const Explore = dynamic(() => import("./explore").then((m) => m.Explore));
const ProblemDetail = dynamic(() =>
  import("./explore").then((m) => m.ProblemDetail),
);
const PostProblem = dynamic(() =>
  import("./problem-editor").then((m) => m.PostProblem),
);
const Workspace = dynamic(() => import("./workspace").then((m) => m.Workspace));
const Teams = dynamic(() => import("./teams").then((m) => m.Teams));
const Portfolio = dynamic(() => import("./portfolio").then((m) => m.Portfolio));
const Companies = dynamic(() => import("./companies").then((m) => m.Companies));
const Admin = dynamic(() => import("./admin").then((m) => m.Admin));
const blank: Platform = {
  user: null,
  problems: [],
  categories: [],
  engagements: [],
  teams: [],
  aiConfigured: false,
  myTeams: [],
  organizations: [],
  savedIds: [],
};
const nav = [
  ["Explore", "/explore"],
  ["Hackathons", "/hackathons"],
  ["Freelance", "/freelance"],
  ["Collaborate", "/collaborate"],
  ["Talent", "/talent"],
];
export function PlatformApp() {
  const actualPath = usePathname();
  const aliases: Record<string, string> = {
    "/arena": "/hackathons",
    "/workspace": "/dashboard",
    "/teams": "/collaborate",
    "/post": "/post-problem",
  };
  const pathname = aliases[actualPath] || actualPath;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Platform>(blank);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState<Problem | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [dashError, setDashError] = useState("");
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/platform");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setData(body);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the exchange.");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadDash = useCallback(async () => {
    setDashError("");
    try {
      const res = await fetch("/api/platform?view=dashboard");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setDash(body);
    } catch (e) {
      setDashError(
        e instanceof Error ? e.message : "Could not load workspace.",
      );
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) void load();
    });
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    queueMicrotask(() => {
      setMenu(false);
      setSelected(null);
      if (
        ["/dashboard", "/portfolio", "/hackathons"].includes(pathname) &&
        data.user?.id
      )
        void loadDash();
    });
  }, [pathname, loadDash, data.user?.id]);
  useEffect(() => {
    const preference = localStorage.getItem("resolv-theme") === "dark";
    queueMicrotask(() => setDark(preference));
    document.documentElement.dataset.theme = preference ? "dark" : "light";
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const problemId = searchParams.get("problem");
    if (problemId && data.problems.length) {
      const p = data.problems.find((p) => p.id === problemId);
      if (p) {
        queueMicrotask(() => setSelected(p));
        router.replace("/explore", { scroll: false });
      }
    }
  }, [searchParams, data.problems, router]);
  useEffect(() => {
    if (!menu) return;
    const panel = document.getElementById("mobile-navigation");
    panel?.querySelector("a")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [menu]);
  const act = async (action: string, body: Record<string, unknown> = {}) => {
    if (!data.user) {
      setSelected(null);
      setAuthOpen(true);
      throw new Error("Sign in to continue.");
    }
    const response = await fetch("/api/platform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Unable to complete action.");
    await load();
    if (dash) await loadDash();
    return result;
  };
  const notify = (message: string) => setToast(message);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("resolv-theme", next ? "dark" : "light");
  };
  const home = pathname === "/";
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header
        className={`site-header page-width ${home ? "home-header" : "product-header"}`}
      >
        <Link className="wordmark" href="/" aria-label="ReSolv home">
          <span className="brand-symbol">✳</span>re<span>solv</span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {nav.map(([label, url]) => (
            <Link
              key={url}
              href={url}
              className={pathname === url ? "nav-active" : ""}
            >
              {label}
              {pathname === url && (
                <motion.span
                  className="global-nav-indicator"
                  layoutId="global-nav-indicator"
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme-button"
            onClick={toggleTheme}
            aria-label={dark ? "Use light theme" : "Use dark theme"}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {data.user ? (
            <Link href="/dashboard" className="text-link account-link">
              {data.user.name.split(" ")[0]} <ArrowUpRight size={15} />
            </Link>
          ) : (
            <button className="login-button" onClick={() => setAuthOpen(true)}>
              Log in
            </button>
          )}
          <Link href="/post-problem" className="button small primary">
            Post a problem <ArrowUpRight size={15} />
          </Link>
          <button
            ref={menuButton}
            aria-controls="mobile-navigation"
            aria-label="Open navigation"
            aria-expanded={menu}
            className="icon-button mobile-menu-button"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              id="mobile-navigation"
              className="mobile-nav"
              aria-label="Mobile navigation"
            >
              {[
                ...nav,
                ["About ReSolv", "/about"],
                ["Your portfolio", "/portfolio"],
                ["Workspace", "/dashboard"],
              ].map(([label, url]) => (
                <Link href={url} key={url} onClick={() => setMenu(false)}>
                  {label}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      {error && (
        <div role="alert" className="global-error page-width">
          {error} <button onClick={load}>Try again</button>
        </div>
      )}
      {data.previewMode && (
        <div className="preview-notice">
          LOCAL DESIGN PREVIEW · EXAMPLE RECORDS IN AN ISOLATED DATABASE
        </div>
      )}
      <main id="main" className={home ? "home-main" : "product-main"}>
        {home ? (
          <CinematicHome />
        ) : (
          <div className="app-shell page-width">
            {["/dashboard", "/portfolio", "/post-problem", "/admin"].includes(
              pathname,
            ) && <AppNav pathname={pathname} user={Boolean(data.user)} />}
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {["/explore", "/hackathons", "/freelance"].includes(pathname) && (
                <Explore
                  data={data}
                  loading={loading}
                  key={pathname}
                  arena={pathname === "/hackathons"}
                  freelance={pathname === "/freelance"}
                  registeredIds={
                    dash?.registrations.map((r) => r.hackathon.problem.id) || []
                  }
                  onSelect={setSelected}
                />
              )}
              {pathname === "/post-problem" && (
                <PostProblem
                  data={data}
                  act={act}
                  notify={notify}
                  onAuth={() => setAuthOpen(true)}
                  onDone={() => router.push("/dashboard")}
                />
              )}
              {pathname === "/dashboard" &&
                (data.user ? (
                  <Workspace
                    data={data}
                    dash={dash}
                    error={dashError}
                    act={act}
                    notify={notify}
                    onSelect={setSelected}
                    onRefresh={loadDash}
                    onSignOut={async () => {
                      await authClient.signOut();
                      setData(blank);
                      setDash(null);
                      router.push("/");
                      await load();
                    }}
                  />
                ) : (
                  <AuthGate onAuth={() => setAuthOpen(true)} />
                ))}
              {pathname === "/collaborate" && (
                <Teams data={data} act={act} notify={notify} />
              )}
              {pathname === "/portfolio" &&
                (data.user ? (
                  <Portfolio
                    data={data}
                    dash={dash}
                    act={act}
                    notify={notify}
                  />
                ) : (
                  <AuthGate onAuth={() => setAuthOpen(true)} />
                ))}
              {pathname === "/about" && <About />}
              {pathname === "/talent" && <TalentDiscovery />}
              {pathname.startsWith("/people/") && (
                <TalentDiscovery personId={pathname.split("/")[2]} />
              )}
              {pathname === "/companies" && <Companies />}
              {pathname === "/admin" && <Admin act={act} notify={notify} />}
              {![
                "/explore",
                "/freelance",
                "/talent",
                "/about",
                "/hackathons",
                "/post-problem",
                "/dashboard",
                "/collaborate",
                "/portfolio",
                "/companies",
                "/admin",
              ].includes(pathname) &&
                !pathname.startsWith("/people/") && (
                  <Empty
                    title="This page hasn’t found its purpose yet."
                    copy="Head back to the exchange to find yours."
                    action={
                      <Link className="button primary" href="/explore">
                        Explore problems <ArrowRight size={16} />
                      </Link>
                    }
                  />
                )}
            </motion.div>
          </div>
        )}
      </main>
      <footer className={`site-footer page-width ${home ? "home-footer" : ""}`}>
        <Link className="wordmark" href="/">
          <span className="brand-symbol">✳</span>resolv
        </Link>
        <p>Real problems. Real talent. Real outcomes.</p>
        <div>
          <Link href="/explore">The exchange</Link>
          <Link href="/collaborate">Community</Link>
          <Link href="/about">Our philosophy</Link>
        </div>
        <span className="mono">© {new Date().getFullYear()} RESOLV</span>
      </footer>
      <AnimatePresence>
        {selected && (
          <Dialog
            title="The problem brief"
            onClose={() => setSelected(null)}
            wide
          >
            <ProblemDetail
              problem={selected}
              data={data}
              act={act}
              notify={notify}
            />
          </Dialog>
        )}
        {authOpen && (
          <Dialog
            title="Your next chapter starts here."
            onClose={() => setAuthOpen(false)}
          >
            <AuthForm
              onSuccess={async () => {
                setAuthOpen(false);
                await load();
                router.push("/dashboard");
              }}
            />
          </Dialog>
        )}
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <Check size={17} />
            {toast}
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
function AppNav({ pathname, user }: { pathname: string; user: boolean }) {
  return (
    <nav className="app-nav" aria-label="Platform navigation">
      {[
        ["Overview", "/dashboard"],
        ["Your portfolio", "/portfolio"],
        ["Create a problem", "/post-problem"],
      ].map(([label, url]) => (
        <Link className={pathname === url ? "active" : ""} key={url} href={url}>
          {pathname === url && (
            <motion.span layoutId="app-nav" className="app-nav-bg" />
          )}
          <span>{label}</span>
        </Link>
      ))}
      {user && (
        <Link href="/post-problem" className="post-nav">
          <Plus size={15} /> Post a problem
        </Link>
      )}
    </nav>
  );
}
