import {
  productionEnabled,
  staticRenderEnabled,
  services,
} from "../lib/runtime";
import {
  attempt,
  blank,
  type Attempt,
  type Entry,
  type Snapshot,
} from "./engine";
export const localMode = !productionEnabled && !staticRenderEnabled;
const cacheKey = "sf-academy-preview-v1";
const sessionKey = "sf-academy-session-v1";
export const getSession = () =>
  localMode ? "preview" : localStorage.getItem(sessionKey);
export async function api(action: string, data: Record<string, unknown> = {}) {
  if (localMode)
    throw Error(
      "Local preview: cloud sync and paid tutor requests are disabled.",
    );
  const response = await fetch(
    services.supabaseUrl + "/functions/v1/academy-api",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey:
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          import.meta.env.VITE_SUPABASE_ANON_KEY ||
          "",
        "x-academy-session": getSession() || "",
      },
      body: JSON.stringify({ action, ...data }),
    },
  );
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && action !== "login")
      localStorage.removeItem(sessionKey);
    throw Error(result.error || "Academy request failed.");
  }
  return result;
}
export async function login(password: string, activation?: string) {
  const result = await api(activation ? "activate" : "login", {
    password,
    activation,
  });
  localStorage.setItem(sessionKey, result.token);
}
export async function logout() {
  if (!localMode) await api("logout");
  localStorage.removeItem(sessionKey);
}
export function localSnapshot(): Snapshot {
  try {
    return (
      JSON.parse(localStorage.getItem(cacheKey) || "null") ||
      structuredClone(blank)
    );
  } catch {
    return structuredClone(blank);
  }
}
export async function load() {
  return localMode
    ? {
        state: localSnapshot(),
        usage: { usedMicros: 0, ceilingMicros: 50000000 },
        tutorReady: false,
      }
    : api("snapshot");
}
export async function saveEntry(entry: Omit<Entry, "updatedAt">) {
  if (!localMode) return (await api("entry", { entry })).entry as Entry;
  const state = localSnapshot();
  const previous = state.entries.find((e) => e.id === entry.id);
  if ((previous?.version || 0) !== entry.version)
    throw Error("This record changed. Refresh before saving.");
  const result = {
    ...entry,
    version: entry.version + 1,
    updatedAt: new Date().toISOString(),
  };
  state.entries = [...state.entries.filter((e) => e.id !== entry.id), result];
  localStorage.setItem(cacheKey, JSON.stringify(state));
  return result;
}
export async function saveAttempt(input: Attempt) {
  if (!localMode)
    return (
      await api("attempt", {
        attempt: {
          id: input.id,
          questionId: input.questionId,
          response: input.response,
          confidence: input.confidence,
        },
      })
    ).attempt as Attempt;
  const state = localSnapshot();
  if (!state.attempts.some((a) => a.id === input.id))
    state.attempts.push(input);
  localStorage.setItem(cacheKey, JSON.stringify(state));
  return input;
}
