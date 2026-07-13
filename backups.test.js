import assert from "node:assert/strict";
import test from "node:test";
import { parseBackup, serializeBackup } from "./backups.js";

const campaigns = [{ id: "campaign-1", name: "Sample", adsets: [{ id: "adset-1", name: "Audience", ads: [{ id: "ad-1", name: "Creative", creatives: [{ name: "ad.png", type: "image/png", dataUrl: "data:image/png;base64,AA==" }] }] }] }];

test("backups round-trip campaign data and reject invalid files", () => {
  assert.deepEqual(parseBackup(serializeBackup(campaigns)), campaigns);
  assert.throws(() => parseBackup("not json"), /valid JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ version: 2, campaigns })), /unsupported version/);
  assert.throws(() => parseBackup(JSON.stringify({ version: 1, campaigns: [{ id: "broken" }] })), /invalid/);
});
