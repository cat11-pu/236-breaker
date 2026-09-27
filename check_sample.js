import fs from "node:fs";
import { mayPass } from "./state.js";
import { runBreaker } from "./breaker.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/events.json", "utf8"));
const view = render(spec);

emit("后端调用条数 =", view.backend);
emit("被拒条数 =", view.rejected);
emit("被拒位置列表 =", JSON.stringify(view.rejected_positions));
emit("打开时刻列表 =", JSON.stringify(view.opens));
emit("打开次数 =", view.open_count);
emit("半开探测次数 =", view.probes);
emit("收尾状态 =", view.state);
emit("事件条数 =", view.count);
emit("拒流复核 =", view.conserved);
emit("放行判定样例 =", view.tail);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  runBreaker({ threshold: 1, cooldown: 1, events: [{ at: 3, ok: true }, { at: 2, ok: true }] });
  emit("时间回落写错的错误码", "没有报错");
} catch (error) {
  emit("时间回落写错的错误码", error && error.code ? error.code : String(error.message));
}
try {
  runBreaker({ threshold: 0, cooldown: 1, events: [] });
  emit("参数写错的错误码", "没有报错");
} catch (error) {
  emit("参数写错的错误码", error && error.code ? error.code : String(error.message));
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "后端调用条数": 3,
  "被拒条数": 3,
  "被拒位置列表": [
    3,
    5,
    6
  ],
  "打开时刻列表": [
    2,
    6
  ],
  "打开次数": 2,
  "半开探测次数": 1,
  "收尾状态": "打开",
  "事件条数": 6,
  "拒流复核": true,
  "放行判定样例": 1,
  "时间回落写错的错误码": "E_TIME_BACK",
  "参数写错的错误码": "E_BAD_PARAM"
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
