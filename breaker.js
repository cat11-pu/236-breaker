// breaker.js：熔断状态机（基线：一律给零）
import { mayPass } from "./state.js";

export function runBreaker(spec) {
  function fail(code, message) {
    const error = new Error(message || code);
    error.code = code;
    return error;
  }
  if (!spec || typeof spec !== "object") throw fail("E_BAD_PARAM", "spec 必须是对象");
  const { threshold, cooldown } = spec;
  if (!Number.isInteger(threshold) || threshold <= 0
      || !Number.isInteger(cooldown) || cooldown <= 0) {
    throw fail("E_BAD_PARAM", "threshold 与 cooldown 必须为正整数");
  }
  const events = spec.events;
  if (!Array.isArray(events)) throw fail("E_BAD_PARAM", "events 必须是事件数组");
  for (const event of events) {
    if (!event || typeof event !== "object"
        || typeof event.ok !== "boolean"
        || typeof event.at !== "number" || !Number.isFinite(event.at)) {
      throw fail("E_BAD_PARAM", "每条事件必须给数值 at 与布尔 ok");
    }
  }

  let status = "闭合";
  let openedAt = 0;
  let fails = 0;
  let lastAt = null;
  let backend = 0;
  let probes = 0;
  const rejectedPositions = [];
  const opens = [];

  events.forEach(function (event, index) {
    const now = event.at;
    const position = index + 1;
    if (lastAt !== null && now < lastAt) throw fail("E_TIME_BACK", "时刻回落：" + lastAt + " -> " + now);
    lastAt = now;

    if (status === "打开" && !mayPass(status, openedAt, now, cooldown)) {
      rejectedPositions.push(position);
      return;
    }

    if (status === "打开") status = "半开";
    const isProbe = status === "半开";
    if (isProbe) probes += 1;
    backend += 1;

    if (event.ok) {
      status = "闭合";
      fails = 0;
    } else if (isProbe) {
      status = "打开";
      openedAt = now;
      opens.push(now);
      fails = threshold;
    } else if (fails + 1 >= threshold) {
      fails = threshold;
      status = "打开";
      openedAt = now;
      opens.push(now);
    } else {
      fails += 1;
    }
  });

  return {
    backend,
    rejected: rejectedPositions.length,
    rejected_positions: rejectedPositions,
    opens,
    open_count: opens.length,
    probes,
    state: status
  };
}
