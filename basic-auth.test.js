import assert from "node:assert/strict";
import test from "node:test";
import { validBasicAuth } from "./basic-auth.js";

test("basic auth accepts only the configured credentials", async () => {
  const request = (credentials) => new Request("https://example.com", {
    headers: credentials ? { Authorization: `Basic ${Buffer.from(credentials).toString("base64")}` } : {},
  });

  assert.equal(await validBasicAuth(request("ads:correct"), "ads", "correct"), true);
  assert.equal(await validBasicAuth(request("ads:wrong"), "ads", "correct"), false);
  assert.equal(await validBasicAuth(request(), "ads", "correct"), false);
});
