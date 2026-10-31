import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { sections, topics, byTopic, matches, type Topic } from "./curriculum";
import {
  counts,
  emptyValue,
  entryId,
  parseBackup,
  valueFor,
  type Entry,
  type Value,
} from "./engine";
import {
  changePassword,
  getSession,
  load,
  localMode,
  login,
  logout,
  saveTopic,
} from "./client";
import "./academy.css";
const questionId = (t: Topic, i: number) => t.id + ":q" + (i + 1);
export default function Academy() {
  const [signed, setSigned] = useState(
    () =>
      !new URLSearchParams(location.hash.slice(1)).has("activate") &&
      !!getSession(),
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState("");
  const [topicId, setTopicId] = useState("");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [activation] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get("activate") || "",
  );
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const [draft, setDraft] = useState("");
  const dirty = useRef(false);
  const liveEntries = useRef(entries);
  const revision = useRef(0);
  liveEntries.current = entries;
  const topic = byTopic[topicId];
  const selected = sections.find((s) => s.id === section);
  const totals = counts(topics, entries);
  useEffect(() => {
    if (activation) history.replaceState(null, "", location.pathname);
  }, [activation]);
  async function refresh() {
    try {
      const startedAt = revision.current;
      const state = await load();
      if (revision.current !== startedAt) return;
      setEntries(state.entries);
      setError("");
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
      if (!getSession()) setSigned(false);
    }
  }
  useEffect(() => {
    if (!signed) return;
    void refresh();
    const interval = setInterval(() => {
      if (!dirty.current && !busyRef.current) void refresh();
    }, 30000);
    const focus = () => {
      if (!dirty.current && !busyRef.current) void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", focus);
    };
  }, [signed]);
  useEffect(() => {
    setDraft(topic ? valueFor(entries, topic.id).notes : "");
    dirty.current = false;
  }, [topicId]);
  useEffect(() => {
    if (topic && !dirty.current) setDraft(valueFor(entries, topic.id).notes);
  }, [entries]);
  useEffect(() => {
    const stop = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", stop);
    return () => window.removeEventListener("beforeunload", stop);
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
      if (!getSession()) setSigned(false);
    } finally {
      setBusy(false);
    }
  }
  async function persist(id: string, value: Value) {
    const previous = liveEntries.current.find((e) => e.id === entryId(id));
    const saved = await saveTopic(id, value, previous?.version || 0);
    revision.current++;
    setEntries((current) => {
      const next = [...current.filter((e) => e.id !== saved.id), saved];
      liveEntries.current = next;
      return next;
    });
    setStatus(localMode ? "Saved on this browser" : "Synced");
  }
  async function saveNotes() {
    if (topic && dirty.current) {
      await persist(topic.id, {
        ...valueFor(liveEntries.current, topic.id),
        notes: draft,
      });
      dirty.current = false;
    }
  }
  async function navigate(s: string, t = "") {
    await run(async () => {
      await saveNotes();
      setSection(s);
      setTopicId(t);
      setSettings(false);
      window.scrollTo?.(0, 0);
    });
  }
  const progress = (ts: Topic[]) => {
    const p = counts(ts, entries);
    return (
      <span className="ce-progress">
        {p.readings}/{p.readingTotal} readings · {p.questions}/{p.questionTotal}{" "}
        questions
      </span>
    );
  };
  if (!signed || (activation && !ready))
    return (
      <main className="ce ce-login">
        <p className="ce-eyebrow">SF SAUNA · PERSONAL STUDY</p>
        <h1>Electrical safety & certification</h1>
        <p>Your curriculum, reading checklist, and engineering notes.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void run(async () => {
              if (activation && form.get("password") !== form.get("confirm"))
                throw Error("Passwords do not match.");
              await login(
                String(form.get("password")),
                activation || undefined,
              );
              setSigned(true);
              await refresh();
            });
          }}
        >
          <h2>
            {activation ? "Choose your new password" : "Open your curriculum"}
          </h2>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={256}
              required
              autoComplete={activation ? "new-password" : "current-password"}
            />
          </label>
          {activation && (
            <label>
              Confirm password
              <input
                name="confirm"
                type="password"
                minLength={12}
                maxLength={256}
                required
                autoComplete="new-password"
              />
            </label>
          )}
          <p>
            Use at least 12 characters. Your progress syncs between devices.
          </p>
          <button disabled={busy}>
            {busy
              ? "Opening…"
              : activation
                ? "Set password & continue"
                : "Sign in"}
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
      </main>
    );
  return (
    <main className="ce">
      <header className="ce-header">
        <a href="/">SF Sauna</a>
        <span>Electrical safety & certification</span>
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await saveNotes();
              setTopicId("");
              setSettings(true);
            })
          }
        >
          Settings & backup
        </button>
        {!localMode && (
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await saveNotes();
                await logout();
                setSigned(false);
              })
            }
          >
            Sign out
          </button>
        )}
      </header>
      {localMode && (
        <aside className="ce-notice">
          Local preview · checklists and notes save on this browser. Cloud sync
          and password changes are available on the live site.
        </aside>
      )}
      <div className="ce-top">
        <p className="ce-eyebrow">YOUR ENGINEERING READING ROOM</p>
        <h1>
          Build understanding.
          <br />
          Track the work.
        </h1>
        <p>
          Conventional AC heaters, battery-assisted systems, and the path to
          certification.
        </p>
        <div className="ce-stats">
          <div>
            <strong>
              {totals.readings}
              <small> / {totals.readingTotal}</small>
            </strong>
            Readings completed
          </div>
          <div>
            <strong>
              {totals.questions}
              <small> / {totals.questionTotal}</small>
            </strong>
            Self-assessed questions
          </div>
          <div>
            <strong>{sections.length}</strong>Sections received
          </div>
        </div>
        <progress
          aria-label="Overall progress"
          max={totals.readingTotal + totals.questionTotal}
          value={totals.readings + totals.questions}
        />
      </div>
      <details className="ce-product-briefs">
        <summary>Your two product briefs</summary>
        <div className="ce-topics">
          <section className="ce-panel">
            <h3>Product A · Conventional AC heater</h3>
            <p>
              A traditional 120V AC sauna heater, approximately 1.7–2.2 kW,
              ideally plug-in, for small wooden residential cabins.
            </p>
            <p>
              Design for certification and legal installation, including
              manufacture in China and import, rental, installation, and sale in
              the US.
            </p>
          </section>
          <section className="ce-panel">
            <h3>Product B · Battery-assisted heater</h3>
            <p>
              Approximately 5–10 kWh LFP, with nominal 48V DC under evaluation;
              6–10 kW DC rapid heating and approximately 1.2–2.2 kW AC heating,
              subject to residential input limits.
            </p>
            <p>
              Charge from 120V, coordinate heating and charging, and provide
              independent protections. Target 40 minutes to three hours or
              longer of temperature maintenance. Feasibility and the
              certification pathway remain to be established.
            </p>
          </section>
        </div>
      </details>
      <div className="ce-feedback" aria-live="polite">
        {busy ? "Saving…" : status}
        {error && (
          <div role="alert">
            {error}{" "}
            <button disabled={busy} onClick={() => void refresh()}>
              Refresh saved progress
            </button>
          </div>
        )}
      </div>
      {!ready ? (
        <p>Loading your checklist…</p>
      ) : settings ? (
        <section className="ce-panel">
          <button disabled={busy} onClick={() => setSettings(false)}>
            ← Curriculum
          </button>
          <h2>Settings & backup</h2>
          <p>
            Readings and questions are tracked independently. Cloud changes sync
            every 30 seconds and when you return to this tab. Conflicting edits
            are rejected so another device cannot silently overwrite your work.
          </p>
          <button
            onClick={() => {
              const backup = {
                format: "sf-curriculum-explorer",
                version: 1,
                exportedAt: new Date().toISOString(),
                topics: topics.map((t) => ({
                  topic: t.id,
                  value: valueFor(entries, t.id),
                })),
              };
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(backup, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "curriculum-progress.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export progress
          </button>
          <label className="ce-import">
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void run(async () => {
                  const rows = parseBackup(await file.text());
                  if (
                    !confirm(
                      `Replace saved checklists and notes for ${rows.length} topics? Export first if you need a backup.`,
                    )
                  )
                    return;
                  let done = 0;
                  try {
                    for (const row of rows) {
                      await persist(row.topic, row.value);
                      done++;
                    }
                    setStatus(`Imported ${done} topics.`);
                  } catch (e) {
                    throw Error(
                      `Imported ${done} of ${rows.length} topics. ${(e as Error).message}`,
                    );
                  }
                });
                e.target.value = "";
              }}
            />
          </label>
          <h3>Change access password</h3>
          {localMode ? (
            <p>Open the live site to change your password.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                void run(async () => {
                  if (data.get("new") !== data.get("confirm"))
                    throw Error("New passwords do not match.");
                  await changePassword(
                    String(data.get("current")),
                    String(data.get("new")),
                  );
                  form.reset();
                  setStatus(
                    "Password changed. Other devices have been signed out.",
                  );
                });
              }}
            >
              <label>
                Current password
                <input
                  name="current"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={12}
                />
              </label>
              <label>
                New password
                <input
                  name="new"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={256}
                />
              </label>
              <label>
                Confirm new password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={256}
                />
              </label>
              <button disabled={busy}>Change password</button>
            </form>
          )}
        </section>
      ) : (
        <>
          <nav className="ce-breadcrumb" aria-label="Curriculum navigation">
            <button disabled={busy} onClick={() => void navigate("")}>
              All sections
            </button>
            {selected && (
              <>
                <span>/</span>
                <button
                  disabled={busy}
                  onClick={() => void navigate(selected.id)}
                >
                  {selected.title}
                </button>
              </>
            )}
            {topic && <span>/ {topic.id}</span>}
          </nav>
          <label className="ce-search">
            Go to module
            <select
              aria-label="Go to module"
              value={section}
              disabled={busy}
              onChange={(e) => void navigate(e.target.value)}
            >
              <option value="">All modules</option>
              {Array.from({ length: 24 }, (_, i) => String(i + 1)).map((id) => (
                <option key={id} value={id}>
                  Module {id} ·{" "}
                  {sections.find((s) => s.id === id)?.title ||
                    "Content not received"}
                </option>
              ))}
            </select>
          </label>
          {!topic && (
            <label className="ce-search">
              Search the curriculum
              <input
                type="search"
                placeholder="Topics, questions, standards, readings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          )}
          {topic ? (
            <article className="ce-detail">
              <p className="ce-eyebrow">TOPIC {topic.id}</p>
              <h2>{topic.title}</h2>
              {progress([topic])}
              {topic.incomplete && (
                <p className="ce-notice">
                  This topic’s supplied text ends early. Additional content is
                  awaiting the owner’s continuation.
                </p>
              )}
              <section className="ce-panel">
                <h3>Why this matters</h3>
                <p>{topic.why}</p>
                {topic.context.map((c, i) => (
                  <p key={i}>{c}</p>
                ))}
                <h3>Learning objectives</h3>
                <ul>
                  {topic.objectives.map((objective, i) => (
                    <li key={i}>{objective}</li>
                  ))}
                </ul>
              </section>
              <section className="ce-panel">
                <h3>
                  {topic.deliverableCount
                    ? "Capstone deliverables and mastery questions"
                    : topic.id === "20.4"
                      ? "Capstone deliverables"
                      : "Questions I should be able to answer"}
                </h3>
                <p>
                  These checkboxes are your self-assessment, not a verified
                  mastery score. Reading completion does not check questions
                  automatically.
                </p>
                {topic.questions.map((q, i) => (
                  <div key={q}>
                    {topic.deliverableCount && i === 0 ? (
                      <h4>Required deliverables</h4>
                    ) : null}
                    {topic.deliverableCount && i === topic.deliverableCount ? (
                      <h4>Final mastery questions</h4>
                    ) : null}
                    <label className="ce-check">
                      <input
                        type="checkbox"
                        disabled={busy}
                        checked={
                          !!valueFor(entries, topic.id).questions[
                            questionId(topic, i)
                          ]
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          void run(async () => {
                            const v = valueFor(liveEntries.current, topic.id);
                            await persist(topic.id, {
                              ...v,
                              notes: dirty.current ? draft : v.notes,
                              questions: {
                                ...v.questions,
                                [questionId(topic, i)]: checked,
                              },
                            });
                            dirty.current = false;
                          });
                        }}
                      />
                      <span>{q}</span>
                    </label>
                  </div>
                ))}
              </section>
              <section className="ce-panel">
                <div className="ce-row">
                  <h3>Readings</h3>
                  <button
                    disabled={busy || !topic.readings.length}
                    onClick={() =>
                      void run(async () => {
                        const v = valueFor(liveEntries.current, topic.id);
                        await persist(topic.id, {
                          ...v,
                          notes: dirty.current ? draft : v.notes,
                          readings: Object.fromEntries(
                            topic.readings.map((r) => [r.id, true]),
                          ),
                        });
                        dirty.current = false;
                      })
                    }
                  >
                    Mark all readings complete
                  </button>
                </div>
                {topic.readings.map((r) => (
                  <div key={r.id} className="ce-reading">
                    <label className="ce-check">
                      <input
                        type="checkbox"
                        disabled={busy}
                        checked={!!valueFor(entries, topic.id).readings[r.id]}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          void run(async () => {
                            const v = valueFor(liveEntries.current, topic.id);
                            await persist(topic.id, {
                              ...v,
                              notes: dirty.current ? draft : v.notes,
                              readings: { ...v.readings, [r.id]: checked },
                            });
                            dirty.current = false;
                          });
                        }}
                      />
                      <strong>{r.title}</strong>
                    </label>
                    <div className="ce-reading-body">
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.searchDestination
                          ? "Open search destination"
                          : r.access
                            ? "Open catalog / access page"
                            : "Open reading"}{" "}
                        ↗
                      </a>
                      <p>
                        <b>Read:</b> {r.scope}
                      </p>
                      <p>{r.summary}</p>
                      {r.extensionSummary && (
                        <p>
                          <b>Extension focus:</b> {r.extensionSummary}
                        </p>
                      )}
                      <p className="ce-muted">
                        <b>Why read it:</b> {r.relevance}
                      </p>
                      {r.accessNote && (
                        <p className="ce-access">{r.accessNote}</p>
                      )}
                    </div>
                  </div>
                ))}
              </section>
              {topic.closingNote && (
                <p className="ce-notice">{topic.closingNote}</p>
              )}
              {topic.exercise && (
                <section className="ce-panel ce-exercise">
                  <h3>Applied exercise / case</h3>
                  <ReactMarkdown>{topic.exercise}</ReactMarkdown>
                  <p>
                    Use your topic notes below to record your analysis,
                    evidence, and unresolved questions.
                  </p>
                </section>
              )}
              <section className="ce-panel">
                <h3>Your notes</h3>
                <label>
                  Notes for Topic {topic.id}
                  <textarea
                    disabled={busy}
                    value={draft}
                    maxLength={30000}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      dirty.current = true;
                      setStatus("Unsaved notes");
                    }}
                    placeholder="Evidence, open questions, and decisions…"
                  />
                </label>
                <button disabled={busy} onClick={() => void run(saveNotes)}>
                  Save notes
                </button>
                <button
                  className="ce-danger"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Reset readings, questions, and notes for this topic?",
                      )
                    )
                      void run(async () => {
                        await persist(topic.id, emptyValue());
                        setDraft("");
                        dirty.current = false;
                      });
                  }}
                >
                  Reset topic
                </button>
              </section>
            </article>
          ) : (
            <>
              <aside className="ce-notice">
                All 24 modules are included. Reading checks and question checks
                track your self-assessed progress independently.
              </aside>
              {Array.from({ length: 24 }, (_, i) => String(i + 1))
                .filter((id) => !sections.some((s) => s.id === id))
                .filter((id) => section === id)
                .map((id) => (
                  <section
                    className="ce-section"
                    key={id}
                    aria-label={"Module " + id + " content not received"}
                  >
                    <h2>Module {id} · Content not received</h2>
                    <p>
                      Send the source material to add this module. No lessons or
                      progress items have been invented.
                    </p>
                  </section>
                ))}
              {sections
                .filter((s) => !section || s.id === section)
                .filter((s) => s.topics.some((t) => matches(t, search, s)))
                .map((s) => (
                  <section className="ce-section" key={s.id}>
                    <div className="ce-section-heading">
                      <button
                        className="ce-section-title"
                        onClick={() => void navigate(s.id)}
                      >
                        <span className="ce-number">
                          {s.id.padStart(2, "0")}
                        </span>
                        <h2>{s.title}</h2>
                      </button>
                      <button
                        aria-expanded={!collapsed.includes(s.id)}
                        onClick={() =>
                          setCollapsed((v) =>
                            v.includes(s.id)
                              ? v.filter((id) => id !== s.id)
                              : [...v, s.id],
                          )
                        }
                      >
                        {collapsed.includes(s.id) ? "Expand" : "Collapse"}
                      </button>
                    </div>
                    {s.objective && <p>{s.objective}</p>}
                    {s.context && <ReactMarkdown>{s.context}</ReactMarkdown>}
                    {progress(s.topics)}
                    {!collapsed.includes(s.id) && (
                      <div className="ce-topics">
                        {s.topics
                          .filter((t) => matches(t, search, s))
                          .map((t) => (
                            <button
                              className="ce-topic"
                              key={t.id}
                              disabled={busy}
                              onClick={() => void navigate(s.id, t.id)}
                            >
                              <span>{t.id}</span>
                              <div>
                                <h3>{t.title}</h3>
                                {progress([t])}
                                {t.incomplete && (
                                  <small>Continuation pending</small>
                                )}
                              </div>
                              <span>→</span>
                            </button>
                          ))}
                      </div>
                    )}
                    {s.capstone && (
                      <div className="ce-capstone">
                        <b>Section capstone</b>
                        <ReactMarkdown>{s.capstone}</ReactMarkdown>
                      </div>
                    )}
                  </section>
                ))}
              {!Array.from({ length: 24 }, (_, i) => String(i + 1)).some(
                (id) => id === section && !sections.some((s) => s.id === id),
              ) &&
                !sections.some(
                  (s) =>
                    (!section || s.id === section) &&
                    s.topics.some((t) => matches(t, search, s)),
                ) && <p>No matching topics. Try a different phrase.</p>}
            </>
          )}
        </>
      )}
      <footer>
        Product A · 120V AC sauna heater &nbsp; / &nbsp; Product B ·
        Battery-assisted sauna heater
        <p>
          Use current source documents and confirm applicability with the
          relevant laboratory or authority. Checkmarks record your own study
          progress.
        </p>
      </footer>
    </main>
  );
}
