async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("unauthenticated");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Anfrage fehlgeschlagen (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  me: () => request<{ id: string; email: string | null; name: string | null }>("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),

  spaces: {
    list: () => request<import("./types").Space[]>("/api/spaces"),
    create: (data: { name: string; color?: string; icon?: string }) =>
      request<import("./types").Space>("/api/spaces", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; color: string; icon: string; position: number }>) =>
      request<import("./types").Space>(`/api/spaces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/spaces/${id}`, { method: "DELETE" }),
  },

  todos: {
    priority: () => request<import("./types").Todo[]>("/api/todos/priority"),
    listForSpace: (spaceId: string) => request<import("./types").Todo[]>(`/api/todos/space/${spaceId}`),
    create: (spaceId: string, title: string) =>
      request<import("./types").Todo>(`/api/todos/space/${spaceId}`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    update: (id: string, data: Partial<{ title: string; done: boolean; priority: boolean; position: number }>) =>
      request<import("./types").Todo>(`/api/todos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/todos/${id}`, { method: "DELETE" }),
  },

  notes: {
    listForSpace: (spaceId: string) => request<import("./types").Note[]>(`/api/notes/space/${spaceId}`),
    create: (spaceId: string, data: Partial<{ content: string; color: string; x: number; y: number }>) =>
      request<import("./types").Note>(`/api/notes/space/${spaceId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ content: string; color: string; x: number; y: number; rotation: number }>) =>
      request<import("./types").Note>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/notes/${id}`, { method: "DELETE" }),
  },
};
