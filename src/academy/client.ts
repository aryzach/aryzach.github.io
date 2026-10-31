import {
  productionEnabled,
  staticRenderEnabled,
  services,
} from "../lib/runtime";
import {
  type Entry,
  type Value,
  type Snapshot,
  entryId,
  validateValue,
} from "./engine";
export const localMode = !productionEnabled && !staticRenderEnabled;
const cacheKey = "sf-curriculum-explorer-preview-v1",
  sessionKey = "sf-academy-session-v1";
export const getSession = () =>
  localMode ? "preview" : localStorage.getItem(sessionKey);
export async function api(action: string, data: Record<string, unknown> = {}) {
  if (localMode) throw Error("Cloud access is disabled in local preview.");
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
    throw Error(result.error || "Request failed.");
  }
  return result;
}
export async function login(password: string, activation?: string) {
  const r = await api(activation ? "activate" : "login", {
    password,
    activation,
  });
  localStorage.setItem(sessionKey, r.token);
}
export async function logout() {
  if (!localMode) await api("logout");
  localStorage.removeItem(sessionKey);
}
export async function changePassword(
  currentPassword: string,
  password: string,
) {
  const r = await api("password", { currentPassword, password });
  localStorage.setItem(sessionKey, r.token);
}
export function localSnapshot(): Snapshot {
  try {
    const state = JSON.parse(
      localStorage.getItem(cacheKey) || '{"entries":[]}',
    );
    if (!Array.isArray(state.entries)) throw Error();
    for (const e of state.entries)
      validateValue(e.id.replace("explorer:", ""), e.value);
    return state;
  } catch {
    return { entries: [] };
  }
}
export async function load(): Promise<Snapshot> {
  return localMode ? localSnapshot() : (await api("snapshot")).state;
}
export async function saveTopic(
  topic: string,
  value: Value,
  version: number,
): Promise<Entry> {
  validateValue(topic, value);
  const entry = { id: entryId(topic), kind: "note" as const, value, version };
  if (!localMode) return (await api("entry", { entry })).entry;
  const state = localSnapshot();
  const previous = state.entries.find((e) => e.id === entry.id);
  if ((previous?.version || 0) !== version)
    throw Error("This topic changed in another tab. Refresh and retry.");
  const result = {
    ...entry,
    version: version + 1,
    updatedAt: new Date().toISOString(),
  };
  state.entries = [...state.entries.filter((e) => e.id !== entry.id), result];
  localStorage.setItem(cacheKey, JSON.stringify(state));
  return result;
}
