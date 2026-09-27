import assert from "node:assert";
import { mayPass } from "../state.js";
import { runBreaker } from "../breaker.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("mayPass returns a flag", () => {
  assert.strictEqual(typeof mayPass("闭合", 0, 1, 2), "boolean");
});

check("runBreaker returns backend count", () => {
  assert.strictEqual(typeof runBreaker({ threshold: 1, cooldown: 1, events: [] }).backend, "number");
});

check("runBreaker returns rejected positions", () => {
  assert.ok(Array.isArray(runBreaker({ threshold: 1, cooldown: 1, events: [] }).rejected_positions));
});

check("render counts events", () => {
  assert.strictEqual(typeof render({ threshold: 1, cooldown: 1, events: [] }).count, "number");
});

check("render exposes conserved flag", () => {
  assert.strictEqual(typeof render({ threshold: 1, cooldown: 1, events: [] }).conserved, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
