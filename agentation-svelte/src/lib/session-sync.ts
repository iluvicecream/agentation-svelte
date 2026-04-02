import type { Annotation } from "./types";

export type SessionResponse = {
  id: string;
  url: string;
  annotations: Annotation[];
};

const SESSION_KEY_PREFIX = "agentation-svelte-session-";
const REMOVED_STATUSES = new Set(["resolved", "dismissed"]);

export function isRenderableAnnotation(annotation: Annotation): boolean {
  return !annotation.status || !REMOVED_STATUSES.has(annotation.status);
}

export function getSessionStorageKey(pathname: string): string {
  return `${SESSION_KEY_PREFIX}${pathname}`;
}

export function loadSessionId(pathname: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(getSessionStorageKey(pathname));
  } catch {
    return null;
  }
}

export function saveSessionId(pathname: string, sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getSessionStorageKey(pathname), sessionId);
  } catch {
    // localStorage might be disabled
  }
}

export async function createSession(endpoint: string, url: string): Promise<SessionResponse> {
  const response = await fetch(`${endpoint}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  if (!response.ok) {
    throw new Error(`Failed to create session (${response.status})`);
  }
  return response.json() as Promise<SessionResponse>;
}

export async function getSession(endpoint: string, sessionId: string): Promise<SessionResponse> {
  const response = await fetch(`${endpoint}/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch session (${response.status})`);
  }
  return response.json() as Promise<SessionResponse>;
}

export async function syncAnnotation(endpoint: string, sessionId: string, annotation: Annotation): Promise<Annotation> {
  const response = await fetch(`${endpoint}/sessions/${sessionId}/annotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...annotation,
      status: annotation.status ?? "pending"
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to sync annotation (${response.status})`);
  }
  return response.json() as Promise<Annotation>;
}

export async function deleteAnnotationFromServer(endpoint: string, annotationId: string): Promise<void> {
  const response = await fetch(`${endpoint}/annotations/${annotationId}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error(`Failed to delete annotation (${response.status})`);
  }
}

export async function updateAnnotationOnServer(
  endpoint: string,
  annotationId: string,
  patch: Partial<Annotation>
): Promise<Annotation> {
  const response = await fetch(`${endpoint}/annotations/${annotationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  if (!response.ok) {
    throw new Error(`Failed to update annotation (${response.status})`);
  }
  return response.json() as Promise<Annotation>;
}

export type ActionResponse = {
  success: boolean;
  annotationCount: number;
  delivered: {
    sseListeners: number;
    webhooks: number;
    total: number;
  };
};

export async function requestAction(endpoint: string, sessionId: string, output: string): Promise<ActionResponse> {
  const response = await fetch(`${endpoint}/sessions/${sessionId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ output })
  });
  if (!response.ok) {
    throw new Error(`Failed to request action (${response.status})`);
  }
  return response.json() as Promise<ActionResponse>;
}
