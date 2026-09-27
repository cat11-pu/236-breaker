// breaker.js：熔断状态机（闭合 → 打开 → 半开 → 闭合/重新打开）
import { mayPass } from "./state.js";

function badParam(message) {
  const error = new Error(message);
  error.code = "E_BAD_PARAM";
  return error;
}

function timeBack(message) {
  const error = new Error(message);
  error.code = "E_TIME_BACK";
  return error;
}

export function runBreaker(spec) {
  if (!spec || typeof spec !== "object") throw badParam("spec 必须是对象");
  const { threshold, cooldown, events } = spec;

  if (!Number.isInteger(threshold) || threshold <= 0) {
    throw badParam("threshold 必须是正整数");
  }
  if (!Number.isInteger(cooldown) || cooldown <= 0) {
    throw badParam("cooldown 必须是正整数");
  }
  if (!Array.isArray(events)) throw badParam("events 必须是数组");

  let status = "闭合";
  let failures = 0;
  let openedAt = null;
  let backend = 0;
  let rejected = 0;
  const rejected_positions = [];
  const opens = [];
  let probes = 0;
  let lastAt = null;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      throw badParam("事件必须是对象");
    }
    if (typeof event.ok !== "boolean") throw badParam("事件 ok 必须是布尔");
    if (typeof event.at !== "number" || !Number.isFinite(event.at)) {
      throw badParam("事件 at 必须是有限数");
    }
    if (lastAt !== null && event.at < lastAt) {
      throw timeBack("事件时刻回落：" + lastAt + " → " + event.at);
    }
    lastAt = event.at;

    if (status === "闭合") {
      backend += 1;
      if (event.ok) {
        failures = 0;
      } else {
        failures += 1;
        if (failures >= threshold) {
          status = "打开";
          openedAt = event.at;
          opens.push(event.at);
          failures = 0;
        }
      }
    } else if (status === "打开") {
      if (mayPass(status, openedAt, event.at, cooldown)) {
        // 冷却走完：本次调用进半开当探测，落到后端
        status = "半开";
        probes += 1;
        backend += 1;
        if (event.ok) {
          status = "闭合";
          openedAt = null;
          failures = 0;
        } else {
          status = "打开";
          openedAt = event.at;
          opens.push(event.at);
        }
      } else {
        rejected += 1;
        rejected_positions.push(i + 1);
      }
    } else {
      // 半开态理论上不会停留：上一次探测后已立刻离开
      status = "半开";
      probes += 1;
      backend += 1;
      if (event.ok) {
        status = "闭合";
        openedAt = null;
        failures = 0;
      } else {
        status = "打开";
        openedAt = event.at;
        opens.push(event.at);
      }
    }
  }

  return {
    backend,
    rejected,
    rejected_positions,
    opens,
    open_count: opens.length,
    probes,
    state: status
  };
}
