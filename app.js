// app.js：渲染结果
import { mayPass } from "./state.js";
import { runBreaker } from "./breaker.js";

export function render(spec) {
  const events = spec.events || [];
  const view = runBreaker(spec);
  const rejected = view.rejected_positions || [];
  return { backend: view.backend || 0, rejected: view.rejected || 0,
           rejected_positions: rejected, opens: view.opens || [],
           open_count: view.open_count || 0, probes: view.probes || 0,
           state: view.state || "闭合", count: events.length,
           conserved: (view.backend || 0) + rejected.length === events.length,
           tail: mayPass("打开", 4, 6, 2) ? 1 : 0 };
}
