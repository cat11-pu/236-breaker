// breaker.js：熔断状态机（基线：一律给零）
import { mayPass } from "./state.js";

export function runBreaker(spec) {
  return { backend: 0, rejected: 0, rejected_positions: [], opens: [], open_count: 0,
           probes: 0, state: "闭合" };
}
