import assert from "node:assert/strict";
import test from "node:test";
import { formatNodeData } from "./node-data.js";

test("formatNodeData omits internal and empty values while formatting tile fields", () => {
  assert.deepEqual(formatNodeData({
    id: "ad-1", name: "Creative", status: "Active", ads: [], budget: 2500, currency: "INR",
    startDate: "2026-07-10", platforms: ["Facebook", "Instagram"], creatives: [{ dataUrl: "large" }], empty: "",
  }), [
    { label: "Budget", value: "₹2,500" },
    { label: "Currency", value: "INR" },
    { label: "Start Date", value: "10 Jul 2026" },
    { label: "Platforms", value: "Facebook, Instagram" },
    { label: "Creatives", value: "1 creative" },
  ]);
});
