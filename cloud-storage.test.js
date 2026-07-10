import assert from "node:assert/strict";
import test from "node:test";
import { createCloudStorage } from "./cloud-storage.js";

test("cloud storage migrates the existing local campaign state when the cloud is empty", async () => {
  const values = new Map([["adops-campaigns-v1", '[{"id":"campaign-1","adsets":[]}]']]);
  const webStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const requests = [];
  const fetcher = async (_url, options = {}) => {
    requests.push(options);
    return options.method === "PUT"
      ? { ok: true, json: async () => ({ updated_at: "2026-07-10T10:00:00.000Z" }) }
      : { ok: true, json: async () => null };
  };

  const result = await createCloudStorage(fetcher, webStorage).get("adops-campaigns-v1");

  assert.equal(result.value, '[{"id":"campaign-1","adsets":[]}]');
  assert.equal(requests[1].method, "PUT");
  assert.deepEqual(JSON.parse(requests[1].body).campaigns, [{ id: "campaign-1", adsets: [] }]);
});
