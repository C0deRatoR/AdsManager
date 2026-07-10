export function createCloudStorage(fetcher = globalThis.fetch, webStorage = globalThis.localStorage) {
  if (!fetcher || !webStorage) throw new Error("Cloud storage requires fetch and browser storage");

  const timestampKey = (key) => `${key}:updated-at`;

  const set = async (key, value) => {
    const campaigns = JSON.parse(value);
    if (!Array.isArray(campaigns)) throw new Error("Campaign storage must be an array");

    const updatedAt = new Date().toISOString();
    webStorage.setItem(key, value);
    webStorage.setItem(timestampKey(key), updatedAt);

    // ponytail: one shared JSON row is enough until concurrent editors require record-level writes.
    const response = await fetcher("/api/campaigns", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaigns }),
    });
    if (!response.ok) throw new Error(`Cloud save failed (${response.status})`);
    const saved = await response.json();
    if (saved.updated_at) webStorage.setItem(timestampKey(key), saved.updated_at);
  };

  return {
    async get(key) {
      const cached = webStorage.getItem(key);
      const cachedAt = webStorage.getItem(timestampKey(key));
      let response;
      try {
        response = await fetcher("/api/campaigns", { credentials: "same-origin" });
        if (!response.ok) throw new Error(`Cloud read failed (${response.status})`);
      } catch (error) {
        if (cached !== null) return { value: cached };
        throw error;
      }

      const remote = await response.json();
      if (remote) {
        if (cached !== null && cachedAt && cachedAt > remote.updated_at) {
          try { await set(key, cached); } catch { /* Keep the newer offline copy for the next retry. */ }
          return { value: cached };
        }
        const value = JSON.stringify(remote.campaigns);
        webStorage.setItem(key, value);
        webStorage.setItem(timestampKey(key), remote.updated_at);
        return { value };
      }

      if (cached !== null) try { await set(key, cached); } catch { /* Local cache remains authoritative. */ }
      return { value: cached };
    },
    set,
  };
}
