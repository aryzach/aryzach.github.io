import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Library,
  MessageCircle,
  NotebookPen,
  RefreshCw,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  CONTENT_VERSION,
  fundamentals,
  modules,
  questions,
  questionById,
  sources,
  type Question,
} from "./curriculum";
import {
  attempt,
  battery,
  blank,
  heater,
  mastery,
  recommend,
  thermal,
  validateImport,
  type Attempt,
  type Entry,
  type Snapshot,
} from "./engine";
import {
  api,
  getSession,
  load,
  localMode,
  login,
  logout,
  saveAttempt,
  saveEntry,
} from "./client";
import { cases } from "./cases";
import "./academy.css";
type View =
  | "today"
  | "curriculum"
  | "lesson"
  | "practice"
  | "review"
  | "tutor"
  | "cases"
  | "tools"
  | "sources"
  | "projects"
  | "settings";
const nav: [View, string, typeof BookOpen][] = [
  ["today", "Today", LayoutDashboard],
  ["curriculum", "Learning path", BookOpen],
  ["review", "Review", RefreshCw],
  ["tutor", "Your tutor", MessageCircle],
  ["cases", "Case studies", Library],
  ["tools", "Calculators", FlaskConical],
  ["sources", "Sources", ShieldCheck],
  ["projects", "Product notebook", NotebookPen],
  ["settings", "Settings & backup", Settings],
];
function Tag({ children }: { children: ReactNode }) {
  return <span className="ac-tag">{children}</span>;
}
function SourceLinks({ ids }: { ids: string[] }) {
  return (
    <div className="ac-source-links">
      {ids.map((id) => {
        const s = sources.find((s) => s.id === id);
        return s ? (
          <a key={id} href={s.url} target="_blank" rel="noreferrer">
            {s.title} ↗
          </a>
        ) : null;
      })}
    </div>
  );
}
export default function Academy() {
  const [params, setParams] = useSearchParams();
  const view = (params.get("view") || "today") as View;
  const module =
    modules.find((m) => m.id === params.get("module")) || modules[0];
  const [state, setState] = useState<Snapshot>(blank);
  const [signed, setSigned] = useState(!!getSession());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sync, setSync] = useState(
    localMode ? "Saved on this device only" : "Connecting…",
  );
  const [tutorReady, setTutorReady] = useState(false);
  const [usage, setUsage] = useState({
    usedMicros: 0,
    ceilingMicros: 50000000,
  });
  const [lastSync, setLastSync] = useState("");
  const go = (next: View, id?: string) => {
    setParams({ view: next, ...(id ? { module: id } : {}) });
    window.scrollTo(0, 0);
  };
  const refresh = async () => {
    try {
      const result = await load();
      setState(result.state);
      setUsage(result.usage);
      setTutorReady(result.tutorReady);
      setSync(
        localMode ? "Saved on this device only" : "Synced across your devices",
      );
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      setSync("Sync unavailable · your unsent draft stays here");
      setError((e as Error).message);
      if (!getSession()) setSigned(false);
    }
  };
  useEffect(() => {
    document.title = "Electrical Safety Academy · SF Sauna";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex,nofollow";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);
  useEffect(() => {
    if (!signed) return;
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 20000);
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [signed]);
  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const write = async (
    id: string,
    kind: Entry["kind"],
    value: Record<string, unknown>,
    expectedVersion?: number,
  ) => {
    const current = state.entries.find((e) => e.id === id);
    const entry = await saveEntry({
      id,
      kind,
      value,
      version: expectedVersion ?? current?.version ?? 0,
    });
    setState((s) => ({
      ...s,
      entries: [...s.entries.filter((e) => e.id !== id), entry],
    }));
    return entry;
  };
  const submit = async (q: Question, response: string, confidence: number) => {
    const a = await saveAttempt(attempt(q.id, response, confidence));
    setState((s) => ({
      ...s,
      attempts: [...s.attempts.filter((x) => x.id !== a.id), a],
    }));
    return a;
  };
  const evaluate = async (a: Attempt) => {
    const result = await api("evaluate", {
      requestId: crypto.randomUUID(),
      attemptId: a.id,
      moduleId: questionById[a.questionId].concept,
    });
    if (result.attempt)
      setState((s) => ({
        ...s,
        attempts: s.attempts.map((x) => (x.id === a.id ? result.attempt : x)),
      }));
    setUsage(result.usage);
    return result;
  };
  if (!signed)
    return (
      <div className="academy ac-lock">
        <div className="ac-lock-card">
          <div className="ac-brand">
            <Zap size={25} /> SF SAUNA <span>ACADEMY</span>
          </div>
          <Tag>YOUR PERSONAL LEARNING SPACE</Tag>
          <h1>
            Build the knowledge.
            <br />
            Make safer decisions.
          </h1>
          <p>
            Electrical safety, product certification and the engineering behind
            your next sauna.
          </p>
          <Login
            onLogin={async (p, a) => {
              await login(p, a);
              history.replaceState(null, "", location.pathname);
              setSigned(true);
            }}
          />
          <a href="/">← Back to SF Sauna</a>
        </div>
      </div>
    );
  const recommended = recommend(state);
  const allMastery = modules.map((m) => mastery(m.id, state.attempts));
  const mastered = allMastery.filter((m) => m.status === "mastered").length;
  const due = modules.filter((m) => mastery(m.id, state.attempts).due);
  const read = state.entries.filter(
    (e) => e.kind === "lesson" && e.value.completed,
  ).length;
  return (
    <div className="academy">
      <aside className="ac-sidebar">
        <a className="ac-brand" href="/learn-certify">
          <Zap size={23} /> SF SAUNA <span>ACADEMY</span>
        </a>
        <div className="ac-sidebar-label">YOUR WORKSPACE</div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={
                view === id ||
                ((view === "lesson" || view === "practice") &&
                  id === "curriculum")
                  ? "active"
                  : ""
              }
              onClick={() => go(id)}
            >
              <Icon size={18} />
              {label}
              {id === "review" && due.length > 0 && <b>{due.length}</b>}
            </button>
          ))}
        </nav>
        <div className="ac-sidebar-bottom">
          <ShieldCheck size={19} />
          <p>
            Understand the evidence.
            <br />
            Know what is still unknown.
          </p>
          <a href="/">← SF Sauna website</a>
        </div>
      </aside>
      <div className="ac-workspace">
        <header className="ac-topbar">
          <span>Electrical Safety & Certification</span>
          <div
            className="ac-sync"
            title={lastSync ? "Last checked " + lastSync : undefined}
          >
            <span className="ac-dot" />
            {sync}
          </div>
        </header>
        <main className="ac-main">
          {localMode && (
            <div className="ac-notice">
              Local preview · explore the academy and save practice on this
              device. Cloud sync and the paid AI tutor activate on the live
              site.
            </div>
          )}
          {error && (
            <div className="ac-error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}
          {view === "today" && (
            <>
              <div className="ac-eyebrow">YOUR PERSONAL TECHNICAL ACADEMY</div>
              <h1>
                From good ideas
                <br />
                to sound engineering.
              </h1>
              <p className="ac-lead">
                A focused path through electrical safety, certification and the
                decisions behind your two heater concepts.
              </p>
              <div className="ac-stats">
                <div>
                  <strong>
                    {mastered}
                    <small> / 15</small>
                  </strong>
                  <span>Skills mastered</span>
                </div>
                <div>
                  <strong>
                    {read}
                    <small> / 30</small>
                  </strong>
                  <span>Lessons read</span>
                </div>
                <div>
                  <strong>{due.length}</strong>
                  <span>Reviews due</span>
                </div>
                <div>
                  <strong>
                    ${(usage.usedMicros / 1000000).toFixed(2)}
                    <small> / $50</small>
                  </strong>
                  <span>AI budget used this month</span>
                </div>
              </div>
              <section className="ac-hero">
                <div>
                  <Tag>{recommended.reason}</Tag>
                  <h2>{recommended.module.title}</h2>
                  <p>{recommended.module.summary}</p>
                  <button
                    className="ac-primary"
                    onClick={() => go("lesson", recommended.module.id)}
                  >
                    Continue learning <ArrowRight size={17} />
                  </button>
                  <span className="ac-meta">
                    Two focused lessons · about 22 minutes
                  </span>
                </div>
                <SafetyDiagram />
              </section>
              <div className="ac-two">
                <section className="ac-card">
                  <div className="ac-eyebrow">START WHERE YOU ARE</div>
                  <h2>Skip the basics you know.</h2>
                  <p>
                    A short diagnostic checks calculations and the safety
                    assumptions that are easy to miss. Correct guesses alone
                    never establish mastery.
                  </p>
                  <button
                    className="ac-text-button"
                    onClick={() => {
                      setParams({ view: "practice", module: "diagnostic" });
                    }}
                  >
                    Start diagnostic <ArrowRight size={16} />
                  </button>
                </section>
                <section className="ac-card">
                  <div className="ac-eyebrow">BUILD WITH PURPOSE</div>
                  <h2>Two products. Open questions.</h2>
                  <p>
                    Track evidence for the 120V heater and the battery-assisted
                    concept. Keep proposed ideas separate from verified
                    requirements.
                  </p>
                  <button
                    className="ac-text-button"
                    onClick={() => go("projects")}
                  >
                    Open product notebook <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <div className="ac-section-heading">
                <h2>Your learning path</h2>
                <button onClick={() => go("curriculum")}>
                  View all 15 modules →
                </button>
              </div>
              <div className="ac-three">
                {modules.slice(0, 3).map((m, i) => (
                  <button
                    className="ac-module-card"
                    key={m.id}
                    onClick={() => go("lesson", m.id)}
                  >
                    <span className="ac-number">0{i + 1}</span>
                    <h3>{m.title}</h3>
                    <p>{m.summary}</p>
                    <Tag>
                      {mastery(m.id, state.attempts).status.replace(/_/g, " ")}
                    </Tag>
                  </button>
                ))}
              </div>
            </>
          )}
          {view === "curriculum" && (
            <>
              <PageTitle
                label="15 MODULES · TWO PRODUCT TRACKS"
                title="Your learning path"
                description="Start with safety and scope. Move through evidence, integration and the work of bringing a product to market."
              />
              {modules.map((m, i) => {
                const progress = mastery(m.id, state.attempts);
                return (
                  <button
                    className="ac-module-row"
                    key={m.id}
                    onClick={() => go("lesson", m.id)}
                  >
                    <span className="ac-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{m.title}</h3>
                      <p>{m.summary}</p>
                      <span className="ac-meta">
                        {m.prerequisites.length
                          ? "Builds on: " +
                            m.prerequisites
                              .map(
                                (id) => modules.find((x) => x.id === id)?.title,
                              )
                              .join(" · ")
                          : "Start here"}{" "}
                        · 2 lessons
                      </span>
                    </div>
                    <Tag>{progress.status.replace(/_/g, " ")}</Tag>
                    <ChevronRight size={18} />
                  </button>
                );
              })}
            </>
          )}
          {view === "lesson" && (
            <LessonView
              key={module.id}
              module={module}
              state={state}
              busy={busy}
              run={run}
              write={write}
              go={go}
            />
          )}
          {view === "practice" && (
            <>
              <PageTitle
                label={
                  params.get("module") === "diagnostic"
                    ? "DIAGNOSTIC"
                    : "INDEPENDENT PRACTICE"
                }
                title={
                  params.get("module") === "diagnostic"
                    ? "Find your starting point"
                    : module.title
                }
                description="Explain your reasoning before reading the answer. Open responses use a rubric; they stay ungraded until the tutor evaluates them."
              />
              <Practice
                key={params.get("module")}
                bank={
                  params.get("module") === "diagnostic"
                    ? [
                        ...fundamentals,
                        ...modules.slice(0, 3).map((m) => m.questions[0]),
                      ]
                    : module.questions
                }
                state={state}
                busy={busy}
                run={run}
                submit={submit}
                evaluate={evaluate}
                tutorReady={tutorReady}
              />
            </>
          )}
          {view === "review" && (
            <>
              <PageTitle
                label="RETRIEVE · CORRECT · APPLY"
                title="Make the knowledge stick"
                description="Reviews use one schedule: 1, 3, 7, 14 and 30 days. A mistake returns the skill to correction; reading feedback does not resolve it."
              />
              {due.length === 0 ? (
                <section className="ac-card">
                  <h2>No reviews due yet.</h2>
                  <p>
                    Your first graded answer starts the review schedule. Try an
                    independent question in your current module.
                  </p>
                  <button
                    className="ac-primary"
                    onClick={() => go("practice", recommended.module.id)}
                  >
                    Practice a skill <ArrowRight size={17} />
                  </button>
                </section>
              ) : (
                due.map((m) => (
                  <div className="ac-card" key={m.id}>
                    <h2>{m.title}</h2>
                    <p>
                      {mastery(m.id, state.attempts).unresolved
                        ? "An error still needs independent correction and delayed retrieval."
                        : "Time to retrieve and apply this skill."}
                    </p>
                    <button
                      className="ac-primary"
                      onClick={() => go("practice", m.id)}
                    >
                      Review now
                    </button>
                  </div>
                ))
              )}
              <h2 className="ac-space">Evidence, skill by skill</h2>
              <div className="ac-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Skill</th>
                      <th>Status</th>
                      <th>Independent questions</th>
                      <th>Transfer</th>
                      <th>Delayed recall</th>
                      <th>High-confidence errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => {
                      const s = mastery(m.id, state.attempts);
                      return (
                        <tr key={m.id}>
                          <td>{m.title}</td>
                          <td>{s.status.replace(/_/g, " ")}</td>
                          <td>{s.distinct}</td>
                          <td>{s.transfer ? "Yes" : "Not yet"}</td>
                          <td>{s.delayed ? "Yes" : "Not yet"}</td>
                          <td>{s.highConfidenceErrors}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {view === "tutor" && (
            <Tutor
              state={state}
              moduleId={module.id}
              ready={tutorReady}
              usage={usage}
              busy={busy}
              run={run}
              refresh={refresh}
            />
          )}
          {view === "cases" && (
            <>
              <PageTitle
                label="REAL PRODUCTS · REAL EVIDENCE"
                title="Learn from the field"
                description="Certification precedents, recalls and documented failures. Facts, interpretations and missing evidence stay separate. Recall cases also serve as the failure cases; they are not counted as separate incidents."
              />
              <div className="ac-cases">
                {cases.map((c) => (
                  <details className="ac-card" key={c.id}>
                    <summary>
                      <Tag>{c.category}</Tag>
                      <h2>{c.title}</h2>
                      <p>{c.summary}</p>
                      <span className="ac-text-button">
                        Read evidence & questions ↓
                      </span>
                    </summary>
                    <h3>What the evidence says</h3>
                    <p>{c.facts}</p>
                    <h3>Engineering interpretation</h3>
                    <p>{c.lesson}</p>
                    <h3>Still unknown</h3>
                    <p>{c.unknown}</p>
                    <h3>Think it through</h3>
                    <p>{c.question}</p>
                    <a href={c.url} target="_blank" rel="noreferrer">
                      {c.publisher} · source ↗
                    </a>
                    <p className="ac-meta">
                      Checked October 31, 2026 · {c.status}
                    </p>
                    <button
                      className="ac-text-button"
                      onClick={() => go("practice", c.module)}
                    >
                      Practice the related skill →
                    </button>
                  </details>
                ))}
              </div>
            </>
          )}
          {view === "tools" && <Tools />}
          {view === "sources" && (
            <>
              <PageTitle
                label="TRACEABLE KNOWLEDGE"
                title="The source library"
                description="Public summaries are distinguished from full normative text. No unverified clause numbers or certification conclusions are supplied."
              />
              <div className="ac-notice">
                Claim labels: verified fact · normative requirement (only with
                verified text) · engineering interpretation · educational
                simplification · hypothesis · unknown. This edition contains no
                claimed full-text normative clause verification.
              </div>
              <SourceLibrary />
            </>
          )}
          {view === "projects" && (
            <Projects state={state} write={write} run={run} busy={busy} />
          )}
          {view === "settings" && (
            <SettingsView
              state={state}
              usage={usage}
              write={write}
              submit={submit}
              run={run}
              busy={busy}
              refresh={refresh}
              signOut={async () => {
                await logout();
                setState(blank);
                setSigned(false);
              }}
            />
          )}
        </main>
        <footer className="ac-footer">
          SF Sauna Academy · Curriculum {CONTENT_VERSION}
          <span>Evidence before certainty.</span>
        </footer>
      </div>
    </div>
  );
}
function PageTitle({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="ac-page-title">
      <div className="ac-eyebrow">{label}</div>
      <h1>{title}</h1>
      <p className="ac-lead">{description}</p>
    </div>
  );
}
function Login({
  onLogin,
}: {
  onLogin: (password: string, activation?: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activation =
    new URLSearchParams(location.hash.slice(1)).get("activate") || undefined;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onLogin(password, activation);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {activation ? "Choose your academy password" : "Academy password"}
        <input
          type="password"
          minLength={12}
          maxLength={256}
          required
          autoComplete={activation ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <p className="ac-meta">
        {activation
          ? "Use at least 12 characters. This activation link is single use."
          : "One password for your academy. This device stays signed in for up to 90 days."}
      </p>
      {error && (
        <p role="alert" className="ac-error">
          {error}
        </p>
      )}
      <button className="ac-primary" disabled={busy}>
        {busy
          ? "Opening…"
          : activation
            ? "Activate my academy"
            : "Open my academy"}{" "}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
function SafetyDiagram() {
  return (
    <svg
      className="ac-safety-diagram"
      viewBox="0 0 360 250"
      role="img"
      aria-label="Safety evidence connects product design, independent protection, testing and certification scope"
    >
      <defs>
        <pattern
          id="acdots"
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="#77988b" opacity=".25" />
        </pattern>
      </defs>
      <rect width="360" height="250" fill="url(#acdots)" />
      <path
        d="M90 65H270V185H90Z M180 65V185 M90 125H270"
        fill="none"
        stroke="#78978a"
        strokeWidth="1"
      />
      <circle cx="180" cy="125" r="48" fill="#e6eee5" stroke="#7b9988" />
      <path
        d="m180 97 22 9v18c0 15-13 26-22 31-9-5-22-16-22-31v-18z"
        fill="none"
        stroke="#345e4d"
        strokeWidth="2"
      />
      <path
        d="m170 124 7 7 14-16"
        fill="none"
        stroke="#345e4d"
        strokeWidth="3"
      />
      {[
        ["DESIGN", 90, 47],
        ["PROTECTION", 270, 47],
        ["TEST EVIDENCE", 90, 211],
        ["CERTIFICATION", 270, 211],
      ].map(([t, x, y]) => (
        <g key={t}>
          <circle cx={x} cy={Number(y) < 100 ? 65 : 185} r="5" fill="#345e4d" />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            fill="#42604f"
            fontSize="10"
            letterSpacing="1"
          >
            {t}
          </text>
        </g>
      ))}
    </svg>
  );
}
function LessonView({
  module,
  state,
  busy,
  run,
  write,
  go,
}: {
  module: (typeof modules)[number];
  state: Snapshot;
  busy: boolean;
  run: (t: () => Promise<unknown>) => Promise<void>;
  write: (
    id: string,
    kind: Entry["kind"],
    value: Record<string, unknown>,
    version?: number,
  ) => Promise<Entry>;
  go: (v: View, id?: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const lesson = module.lessons[index];
  const note = state.entries.find((e) => e.id === "note:" + lesson.id);
  return (
    <>
      <button className="ac-text-button" onClick={() => go("curriculum")}>
        ← Learning path
      </button>
      <PageTitle
        label={"MODULE " + String(modules.indexOf(module) + 1).padStart(2, "0")}
        title={module.title}
        description={module.summary}
      />
      <div className="ac-lesson-tabs">
        {module.lessons.map((l, i) => (
          <button
            key={l.id}
            onClick={() => setIndex(i)}
            className={i === index ? "active" : ""}
          >
            {i + 1}. {l.title}
            {state.entries.some((e) => e.id === l.id && e.value.completed) && (
              <Check size={15} />
            )}
          </button>
        ))}
        <button onClick={() => go("practice", module.id)}>
          3. Independent practice →
        </button>
      </div>
      <div className="ac-lesson-layout">
        <article className="ac-reading">
          <Tag>
            {lesson.claim.replace(/_/g, " ")} · {lesson.minutes} MIN
          </Tag>
          <ReactMarkdown>{lesson.body}</ReactMarkdown>
          <div className="ac-objective">
            <strong>Show what you can do</strong>
            <p>{module.objectives[0]}</p>
          </div>
          <SourceLinks ids={module.sources} />
          <div className="ac-row">
            <button
              disabled={busy}
              className="ac-primary"
              onClick={() =>
                run(async () => {
                  await write(lesson.id, "lesson", {
                    completed: true,
                    contentVersionSeen: CONTENT_VERSION,
                    completedAt: new Date().toISOString(),
                  });
                  if (index === 0) setIndex(1);
                  else go("practice", module.id);
                })
              }
            >
              {state.entries.some(
                (e) => e.id === lesson.id && e.value.completed,
              )
                ? "Continue"
                : "Mark read & continue"}{" "}
              <ArrowRight size={17} />
            </button>
            <span className="ac-meta">Reading does not grant mastery.</span>
          </div>
        </article>
        <LessonNotes
          key={lesson.id}
          lessonId={lesson.id}
          moduleId={module.id}
          note={note}
          busy={busy}
          run={run}
          write={write}
          go={go}
        />
      </div>
    </>
  );
}
function LessonNotes({
  lessonId,
  moduleId,
  note,
  busy,
  run,
  write,
  go,
}: {
  lessonId: string;
  moduleId: string;
  note?: Entry;
  busy: boolean;
  run: (t: () => Promise<unknown>) => Promise<void>;
  write: (
    id: string,
    kind: Entry["kind"],
    value: Record<string, unknown>,
    version?: number,
  ) => Promise<Entry>;
  go: (v: View, id?: string) => void;
}) {
  // Keep the draft and its base version stable during background sync. A new
  // lesson remounts this keyed editor; a remote edit is caught on save.
  const [draft, setDraft] = useState(String(note?.value.text || ""));
  const [base, setBase] = useState(note?.version || 0);
  return (
    <aside className="ac-card ac-notes">
      <NotebookPen size={21} />
      <h3>Your working notes</h3>
      <p>Questions, assumptions and ideas to return to.</p>
      <label className="ac-sr" htmlFor="lesson-note">
        Lesson notes
      </label>
      <textarea
        id="lesson-note"
        rows={10}
        maxLength={20000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button
        disabled={busy}
        onClick={() =>
          run(async () => {
            const e = await write(
              "note:" + lessonId,
              "note",
              { text: draft, lessonId: lessonId },
              base,
            );
            setBase(e.version);
          })
        }
      >
        Save note
      </button>
      <p className="ac-meta">
        {note
          ? "Saved " + new Date(note.updatedAt).toLocaleString()
          : "No note saved yet"}
      </p>
      <button className="ac-text-button" onClick={() => go("tutor", moduleId)}>
        Discuss with your tutor →
      </button>
    </aside>
  );
}
function Practice({
  bank,
  state,
  busy,
  run,
  submit,
  evaluate,
  tutorReady,
}: {
  bank: Question[];
  state: Snapshot;
  busy: boolean;
  run: (t: () => Promise<unknown>) => Promise<void>;
  submit: (q: Question, r: string, c: number) => Promise<Attempt>;
  evaluate: (a: Attempt) => Promise<unknown>;
  tutorReady: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [result, setResult] = useState<Attempt | null>(null);
  const q = bank[index];
  const current = result
    ? state.attempts.find((a) => a.id === result.id) || result
    : null;
  const next = (i: number) => {
    setIndex(i);
    setResponse("");
    setResult(null);
  };
  return (
    <section className="ac-card ac-practice">
      <div className="ac-row">
        {bank.map((_, i) => (
          <button
            key={i}
            className={index === i ? "ac-primary" : "ac-small"}
            onClick={() => next(i)}
            aria-label={"Question " + (i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <Tag>
        {q.type.replace(/_/g, " ")}
        {q.transfer ? " · TRANSFER" : ""}
      </Tag>
      <h2>{q.prompt}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () =>
            setResult(await submit(q, response, confidence)),
          );
        }}
      >
        {q.options ? (
          <div className="ac-options">
            {q.options.map((o) => (
              <label key={o}>
                <input
                  type="radio"
                  name="answer"
                  value={o}
                  checked={response === o}
                  onChange={() => setResponse(o)}
                  disabled={!!current}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
        ) : (
          <label>
            Your independent answer {q.units && "(" + q.units + ")"}
            <textarea
              rows={q.numeric !== undefined ? 2 : 6}
              required
              maxLength={8000}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={!!current}
            />
          </label>
        )}
        <label className="ac-confidence">
          Confidence{" "}
          <select
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            disabled={!!current}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} / 5
                {n === 1 ? " · guessing" : n === 5 ? " · very confident" : ""}
              </option>
            ))}
          </select>
        </label>
        {!current && (
          <button className="ac-primary" disabled={busy || !response.trim()}>
            Save my answer <ArrowRight size={17} />
          </button>
        )}
      </form>
      {current && (
        <div className="ac-feedback">
          <Tag>
            {current.correct === true
              ? "Correct evidence"
              : current.correct === false
                ? "Correction needed"
                : "Awaiting rubric evaluation"}
          </Tag>
          <p>{current.feedback}</p>
          {current.method === "pending" && (
            <>
              <details>
                <summary>Review the rubric</summary>
                <ul>
                  {q.rubric.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </details>
              <button
                disabled={busy || !tutorReady}
                onClick={() => run(() => evaluate(current))}
              >
                Evaluate with tutor
              </button>
              {!tutorReady && (
                <p className="ac-meta">
                  AI evaluation is unavailable{" "}
                  {localMode
                    ? "in local preview"
                    : "until the server key is configured"}
                  . Your response is saved without awarding mastery.
                </p>
              )}
            </>
          )}
          {current.evaluation && (
            <ul>
              {current.evaluation.criteria.map((c, i) => (
                <li key={i}>
                  {c.met ? "✓" : "○"} {c.criterion}: {c.evidence}
                </li>
              ))}
            </ul>
          )}
          {current.correct === false && (
            <p>
              <strong>Contrast:</strong>{" "}
              {q.type === "numeric"
                ? "A physically correct arithmetic result still leaves compliance questions open."
                : "Evidence for one component or normal operating condition cannot establish every system condition."}{" "}
              Explain the difference in your own words, then try the next
              independent question. A later review is still required.
            </p>
          )}
          <SourceLinks ids={q.sources} />
          {index < bank.length - 1 && (
            <button className="ac-primary" onClick={() => next(index + 1)}>
              Next independent question <ArrowRight size={17} />
            </button>
          )}
        </div>
      )}
      <details className="ac-space">
        <summary>Your previous attempts for this question</summary>
        {state.attempts
          .filter((a) => a.questionId === q.id)
          .map((a) => (
            <div className="ac-history" key={a.id}>
              <span>
                {new Date(a.createdAt).toLocaleString()} · confidence{" "}
                {a.confidence}/5 · {a.method}
              </span>
              <p>{a.response}</p>
              <p>{a.feedback}</p>
            </div>
          ))}
      </details>
    </section>
  );
}
function Tutor({
  state,
  moduleId,
  ready,
  usage,
  busy,
  run,
  refresh,
}: {
  state: Snapshot;
  moduleId: string;
  ready: boolean;
  usage: { usedMicros: number };
  busy: boolean;
  run: (t: () => Promise<unknown>) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(moduleId);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState("main");
  const ids = [
    ...new Set([
      "main",
      ...state.entries
        .filter((e) => e.kind === "conversation")
        .map((e) => e.id.split(":")[1]),
    ]),
  ];
  const history = state.entries
    .filter(
      (e) =>
        e.kind === "conversation" &&
        e.id.startsWith("chat:" + conversation + ":"),
    )
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  return (
    <>
      <PageTitle
        label="THINK IT THROUGH"
        title="Your technical tutor"
        description="Ask a question, test an assumption or work through a case. The tutor uses the current lesson, source limits and a compact view of your learning evidence."
      />
      <div className="ac-row">
        <label>
          Focus
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Conversation
          <select
            value={conversation}
            onChange={(e) => setConversation(e.target.value)}
          >
            {ids.map((id, i) => (
              <option key={id} value={id}>
                {id === "main" ? "General discussion" : "Discussion " + (i + 1)}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setConversation(crypto.randomUUID())}>
          New discussion
        </button>
      </div>
      {!ready && (
        <div className="ac-notice">
          {localMode
            ? "The paid tutor is disabled in local preview."
            : "The tutor needs a server-side OpenAI key. Your lessons, notebook and deterministic practice still work."}
        </div>
      )}
      <div className="ac-chat">
        {history.length === 0 ? (
          <div className="ac-card">
            <MessageCircle size={25} />
            <h2>Start with a decision you’re unsure about.</h2>
            <p>
              For example: “Why doesn’t a 90-minute runtime automatically make a
              2kW heater acceptable on a 20A circuit?”
            </p>
          </div>
        ) : (
          history.map((e) => (
            <div key={e.id}>
              <div className="ac-message ac-user">
                <strong>You</strong>
                <p>{String(e.value.user)}</p>
              </div>
              <div className="ac-message">
                <strong>Academy tutor</strong>
                <p>{String(e.value.assistant)}</p>
                <SourceLinks ids={(e.value.sources || []) as string[]} />
                <span className="ac-meta">
                  {String(e.value.model)} ·{" "}
                  {new Date(e.updatedAt).toLocaleString()} · verify important
                  conclusions against primary evidence
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <form
        className="ac-card"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await api("tutor", {
              requestId: crypto.randomUUID(),
              message,
              moduleId: selected,
              conversationId: conversation,
            });
            setMessage("");
            await refresh();
          });
        }}
      >
        <label htmlFor="tutor-message">Your question</label>
        <textarea
          id="tutor-message"
          rows={4}
          maxLength={6000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="ac-row">
          <button
            className="ac-primary"
            disabled={!ready || busy || !message.trim()}
          >
            {busy ? "Thinking…" : "Ask tutor"} <ArrowRight size={17} />
          </button>
          <span className="ac-meta">
            ${(usage.usedMicros / 1000000).toFixed(2)} of $50 monthly ceiling ·
            no automatic paid retries
          </span>
        </div>
      </form>
    </>
  );
}
function SourceLibrary() {
  const [query, setQuery] = useState("");
  return (
    <>
      <label>
        Search sources
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Standard, publisher or topic"
        />
      </label>
      <div className="ac-cases">
        {sources
          .filter((s) =>
            (s.title + " " + s.publisher + " " + s.scope)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((s) => (
            <article className="ac-card" key={s.id}>
              <Tag>{s.status}</Tag>
              <h2>{s.title}</h2>
              <p>{s.scope}</p>
              <p className="ac-meta">
                {s.publisher} · {s.edition || "Edition not established"} ·
                checked {s.checked}
              </p>
              <a href={s.url} target="_blank" rel="noreferrer">
                Open primary reference ↗
              </a>
            </article>
          ))}
      </div>
    </>
  );
}
function Tools() {
  const [v, setV] = useState([120, 2000, 20, 0]);
  const [b, setB] = useState([5, 8, 48, 0.8, 0.9, 1]);
  const [t, setT] = useState([100, 1.5, 60, 1, 8]);
  function fields(
    labels: string[],
    values: number[],
    set: (v: number[]) => void,
  ) {
    return (
      <div className="ac-tool-fields">
        {labels.map((label, i) => (
          <label key={label}>
            {label}
            <input
              type="number"
              step="any"
              value={values[i]}
              onChange={(e) =>
                set(
                  values.map((x, j) => (j === i ? Number(e.target.value) : x)),
                )
              }
            />
          </label>
        ))}
      </div>
    );
  }
  function result(
    fn: () => Record<string, number | null>,
    labels: Record<string, string>,
  ) {
    try {
      return (
        <div className="ac-results">
          {Object.entries(fn()).map(([key, val]) => (
            <div key={key}>
              <strong>
                {val === null
                  ? "No net heating"
                  : Number(val.toFixed(2)).toLocaleString()}
              </strong>
              <span>{labels[key]}</span>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <p role="alert">{(e as Error).message}</p>;
    }
  }
  return (
    <>
      <PageTitle
        label="TRANSPARENT ASSUMPTIONS"
        title="Work the numbers"
        description="Deterministic calculations. No AI calls, hidden simulation or approval implied. Compare scenarios and take the unresolved questions to your engineer and laboratory."
      />
      <section className="ac-card">
        <h2>Heater & branch comparison</h2>
        {fields(
          [
            "Voltage · V",
            "Heater input · W",
            "Branch rating · A",
            "Other coincident input · W",
          ],
          v,
          setV,
        )}
        {result(() => heater(...(v as [number, number, number, number])), {
          current: "Total nominal current · A",
          resistance: "Heater resistance · Ω",
          continuousComparison: "Simplified 125% comparison · A",
          branchPercent: "Nominal branch load · %",
        })}
        <p className="ac-meta">
          I = (heater + other input)/V. R = V²/P for the heater. The 125%
          comparison is an educational sizing scenario; it does not determine
          load classification, allowable connection, exceptions, conductor
          sizing or compliance. Verify adopted rules and equipment instructions.
        </p>
      </section>
      <section className="ac-card">
        <h2>Battery energy & power</h2>
        {fields(
          [
            "Nominal energy · kWh",
            "Delivered output · kW",
            "Operating voltage · V",
            "Usable energy fraction · 0–1",
            "Delivery/charge efficiency · 0–1",
            "AC charge input · kW",
          ],
          b,
          setB,
        )}
        {result(
          () =>
            battery(...(b as [number, number, number, number, number, number])),
          {
            minutes: "Estimated runtime · minutes",
            current: "Ideal DC load current · A",
            cRate: "Approximate energy-based C-rate",
            chargeHours: "Constant-power recharge estimate · hours",
          },
        )}
        <p className="ac-meta">
          Runtime = energy × usable fraction × efficiency / output. DC current
          shown is ideal P/V before conversion losses; actual pack current can
          be higher. C-rate is an approximate nominal-energy comparison.
          Charging uses the same illustrative efficiency; taper, temperature,
          auxiliary loads and coincident heating are omitted.
        </p>
      </section>
      <section className="ac-card">
        <h2>Sauna energy budget</h2>
        {fields(
          [
            "Lumped heated mass · kg",
            "Average specific heat · kJ/kg·K",
            "Temperature rise · °C",
            "Average heat loss · kW",
            "Delivered heating · kW",
          ],
          t,
          setT,
        )}
        {result(
          () => thermal(...(t as [number, number, number, number, number])),
          {
            energyKwh: "Stored sensible heat · kWh",
            minutes: "Idealized heating time · minutes",
          },
        )}
        <p className="ac-meta">
          Q = m·c·ΔT. Time = Q / (input − assumed average loss). One lumped mass
          and constant average loss are deliberate simplifications. Moisture,
          ventilation variation, radiation, stones/wood gradients and changing
          material properties are not modeled. This is not a clearance or
          surface-temperature model.
        </p>
      </section>
      <section className="ac-card">
        <h2>Certification scope comparison</h2>
        <div className="ac-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Can support</th>
                <th>Does not establish by itself</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Recognized component",
                  "Component suitability under stated conditions",
                  "Finished appliance listing",
                ],
                [
                  "UL 1973 battery evidence",
                  "Defined pack/application evaluation",
                  "Hot-zone sauna integration",
                ],
                [
                  "UL 9540A test report",
                  "Behavior in a defined fire test",
                  "UL 9540 product listing",
                ],
                [
                  "UN 38.3 summary",
                  "Transport evidence for identified battery",
                  "Appliance or installation approval",
                ],
                [
                  "Finished appliance listing",
                  "Defined product and instructions",
                  "Every site or modified construction",
                ],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((c, i) => (
                    <td key={i}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceLinks ids={["osha", "ess", "9540a"]} />
      </section>
    </>
  );
}
const productSeeds = [
  {
    id: "A",
    title: "Conventional 120V heater",
    spec: "1.7–2.2 kW AC · residential · cord connection preferred · indoor/outdoor prefab cabin feasibility",
    items: [
      "15A/20A connection and load classification",
      "Heater versus complete-cabin certification boundary",
      "Independent overtemperature protection and critical BOM",
      "Thermal/abnormal-operation test plan",
      "NRTL scope inquiry and proposal comparison",
    ],
  },
  {
    id: "B",
    title: "Battery-assisted heater",
    spec: "5–10 kWh LFP · ~48V under evaluation · 6–10 kW DC boost · 1.2–2.2 kW AC sustaining",
    items: [
      "Battery placement, environment and service boundary",
      "48V versus higher-voltage architecture comparison",
      "Coordinated AC heater/charger input and failure response",
      "DC interruption and independent protective functions",
      "Top-level standard and supplemental scope confirmation",
    ],
  },
];
function Projects({
  state,
  write,
  run,
  busy,
}: {
  state: Snapshot;
  write: (
    id: string,
    k: Entry["kind"],
    v: Record<string, unknown>,
    version?: number,
  ) => Promise<Entry>;
  run: (t: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [track, setTrack] = useState("A");
  const [kind, setKind] = useState<Entry["kind"]>("question");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("under_investigation");
  const [editing, setEditing] = useState<Entry | null>(null);
  const product = productSeeds.find((p) => p.id === track)!;
  return (
    <>
      <PageTitle
        label="IDEAS → EVIDENCE → DECISIONS"
        title="Your product notebook"
        description="Capture requirements, alternatives, lab questions and milestones. Verified status needs evidence; unresolved certification pathways stay unresolved."
      />
      <div className="ac-lesson-tabs">
        {productSeeds.map((p) => (
          <button
            key={p.id}
            className={track === p.id ? "active" : ""}
            onClick={() => {
              setTrack(p.id);
              setEditing(null);
              setTitle("");
              setText("");
            }}
          >
            Product {p.id} · {p.title}
          </button>
        ))}
      </div>
      <section className="ac-card">
        <Tag>EARLY CONCEPT · NOT AN APPROVED DESIGN</Tag>
        <h2>{product.title}</h2>
        <p>{product.spec}</p>
        <h3>Evidence milestones</h3>
        <ul>
          {product.items.map((item, i) => {
            const id = "milestone:" + track + ":" + i;
            const record = state.entries.find((e) => e.id === id);
            return (
              <li key={item}>
                <label className="ac-check">
                  <input
                    type="checkbox"
                    checked={!!record?.value.completed}
                    disabled={busy}
                    onChange={(e) =>
                      run(() =>
                        write(id, "milestone", {
                          track,
                          title: item,
                          completed: e.target.checked,
                        }),
                      )
                    }
                  />
                  {item}
                </label>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="ac-two">
        <form
          className="ac-card"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (status === "verified" && !text.trim())
                throw Error(
                  "Record the supporting evidence before marking verified.",
                );
              await write(
                editing?.id || "product:" + track + ":" + crypto.randomUUID(),
                kind,
                { track, title, text, status },
                editing?.version,
              );
              setTitle("");
              setText("");
              setEditing(null);
            });
          }}
        >
          <h2>{editing ? "Edit record" : "Add to the evidence register"}</h2>
          <label>
            Record type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Entry["kind"])}
            >
              <option value="question">Certification question</option>
              <option value="decision">
                Requirement / engineering decision
              </option>
              <option value="note">Research note</option>
            </select>
          </label>
          <label>
            Title
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {[
                "proposed",
                "under_investigation",
                "verified",
                "rejected",
                "requires_lab_confirmation",
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Options, tradeoffs, evidence and next verification step
            <textarea
              rows={8}
              maxLength={20000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <button className="ac-primary" disabled={busy}>
            Save record
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setTitle("");
                setText("");
              }}
            >
              Cancel edit
            </button>
          )}
        </form>
        <section>
          <h2>Current records</h2>
          {state.entries.filter(
            (e) => e.value.track === track && e.kind !== "milestone",
          ).length === 0 && (
            <p>No records yet. Start with a scope question for the lab.</p>
          )}
          {state.entries
            .filter((e) => e.value.track === track && e.kind !== "milestone")
            .map((e) => (
              <article className="ac-card" key={e.id}>
                <Tag>{String(e.value.status).replace(/_/g, " ")}</Tag>
                <h3>{String(e.value.title)}</h3>
                <p className="ac-preserve">{String(e.value.text)}</p>
                <p className="ac-meta">
                  {e.kind} · updated {new Date(e.updatedAt).toLocaleString()}
                </p>
                <button
                  onClick={() => {
                    setEditing(e);
                    setKind(e.kind);
                    setTitle(String(e.value.title));
                    setText(String(e.value.text));
                    setStatus(String(e.value.status));
                  }}
                >
                  Edit record
                </button>
              </article>
            ))}
        </section>
      </div>
    </>
  );
}
function SettingsView({
  state,
  usage,
  write,
  submit,
  run,
  busy,
  refresh,
  signOut,
}: {
  state: Snapshot;
  usage: { usedMicros: number };
  write: (
    id: string,
    k: Entry["kind"],
    v: Record<string, unknown>,
    version?: number,
  ) => Promise<Entry>;
  submit: (q: Question, r: string, c: number) => Promise<Attempt>;
  run: (t: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const settings = state.entries.find((e) => e.id === "settings");
  const [minutes, setMinutes] = useState(Number(settings?.value.minutes || 20));
  const [model, setModel] = useState(
    String(settings?.value.model || "gpt-6.1-sol"),
  );
  const [external, setExternal] = useState("");
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              format: "sf-academy",
              version: 1,
              curriculumVersion: CONTENT_VERSION,
              exportedAt: new Date().toISOString(),
              state,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "sf-academy-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const prompt =
    "Act as my electrical safety tutor. I know basic circuits but am learning US codes, NRTL product certification, independent protection, thermal safety and LFP integration. Ask one question at a time about a 120V sauna heater or a preliminary battery-assisted heater. Require reasoning, distinguish facts from interpretations and unknowns, and never invent standard clauses or approve an unverified design. Diagnose misconceptions. End with a summary of questions asked, my actual responses, rubric criteria, errors and suggested independent retests. External grading is only a study aid; the academy will require new independent evidence.";
  return (
    <>
      <PageTitle
        label="YOUR DATA · YOUR PACE"
        title="Settings & backup"
        description="Keep a portable copy of your progress, responses, notes, product decisions and tutor discussions."
      />
      <div className="ac-two">
        <section className="ac-card">
          <h2>Study preferences</h2>
          <label>
            Preferred session length
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              {[10, 20, 30, 45].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <label>
            Tutor model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-6.1-sol">
                GPT-6.1 Sol · recommended for reasoning
              </option>
              <option value="gpt-6.1-terra">GPT-6.1 Terra · lower cost</option>
            </select>
          </label>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await write("settings", "settings", {
                  minutes,
                  model,
                  masteryPolicy: "independent-transfer-delayed-v1",
                });
                setNotice("Preferences saved.");
              })
            }
          >
            Save preferences
          </button>
          <p>
            Mastery uses independent evidence, transfer and delayed recall.
            Reading and external AI scores do not grant mastery.
          </p>
          <p className="ac-meta">
            Tutor: {model} · medium reasoning · $
            {(usage.usedMicros / 1000000).toFixed(2)} used/reserved this UTC
            month · $50 ceiling. This ceiling covers academy calls only, not
            unrelated API usage. Prices are configured server-side; revisit when
            provider pricing changes.
          </p>
        </section>
        <section className="ac-card">
          <h2>Export & restore</h2>
          <p>
            Export includes assessment history, derived mastery evidence,
            misconception evidence, notes, projects, settings and tutor
            conversation records. No password or API key is exported.
          </p>
          <button className="ac-primary" onClick={exportData}>
            Download JSON backup
          </button>
          <label>
            Restore a previous academy export
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <p className="ac-meta">
            Restore merges missing records only. Existing notes are never
            overwritten. Imported open-answer grades are reset to pending;
            deterministic answers are regraded. Cloud restore assigns new
            submission times to prevent forged delayed-recall evidence.
          </p>
          <button
            disabled={busy || !file}
            onClick={() =>
              run(async () => {
                if (file!.size > 10000000)
                  throw Error("Choose an export smaller than 10MB.");
                const imported = validateImport(JSON.parse(await file!.text()));
                let added = 0;
                for (const e of imported.entries) {
                  if (e.kind === "conversation") continue;
                  if (!state.entries.some((x) => x.id === e.id)) {
                    await write(e.id, e.kind, e.value);
                    added++;
                  }
                }
                for (const a of imported.attempts) {
                  if (!state.attempts.some((x) => x.id === a.id)) {
                    await submit(
                      questionById[a.questionId],
                      a.response,
                      a.confidence,
                    );
                    added++;
                  }
                }
                await refresh();
                setNotice(
                  "Restored " +
                    added +
                    " records. Conversation history remains in the backup for reference; it is not re-imported as tutor context.",
                );
              })
            }
          >
            Merge backup
          </button>
        </section>
      </div>
      <section className="ac-card">
        <h2>Practice in external ChatGPT</h2>
        <p>
          Copy this exercise into another chat. Paste its summary back as a
          research note; follow up with an independent assessment here.
        </p>
        <textarea
          readOnly
          rows={7}
          value={prompt}
          aria-label="External exercise prompt"
        />
        <button
          onClick={() =>
            run(async () => {
              await navigator.clipboard.writeText(prompt);
              setNotice("Exercise copied.");
            })
          }
        >
          Copy exercise prompt
        </button>
        <label>
          External exercise summary
          <textarea
            rows={5}
            maxLength={20000}
            value={external}
            onChange={(e) => setExternal(e.target.value)}
          />
        </label>
        <button
          disabled={busy || !external.trim()}
          onClick={() =>
            run(async () => {
              await write("external:" + crypto.randomUUID(), "external", {
                summary: external,
                validationStatus: "unverified_followup_required",
                prompt,
              });
              setExternal("");
              setNotice(
                "Saved as unverified study evidence. Take a new independent assessment here.",
              );
            })
          }
        >
          Save summary for follow-up
        </button>
        {state.entries
          .filter((e) => e.kind === "external")
          .map((e) => (
            <details key={e.id}>
              <summary>
                Exercise · {new Date(e.updatedAt).toLocaleDateString()}
              </summary>
              <p className="ac-preserve">{String(e.value.summary)}</p>
            </details>
          ))}
      </section>
      {notice && (
        <p role="status" className="ac-notice">
          {notice}
        </p>
      )}
      <button disabled={busy || localMode} onClick={() => run(signOut)}>
        Sign out of this device
      </button>
      <p className="ac-meta">
        Academy data is separate from customer, rental and accounting records.
        The live site stores learning data in the existing database; local
        preview stores only on this device.
      </p>
    </>
  );
}
