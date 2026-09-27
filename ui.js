// ui.js：操作面板与视图（原生 DOM，无弹窗）
import { render } from "./app.js";

export function mount(spec, parts) {
  parts.log.textContent = "阈值 " + (spec.threshold || 0) + "，冷却 " + (spec.cooldown || 0)
    + "，事件 " + (spec.events || []).length + " 条。";

  function draw() {
    let view = null;
    try {
      view = render(spec);
    } catch (error) {
      parts.out.textContent = String(error && error.code ? error.code : error);
      parts.log.textContent = "跑不动：" + String(error && error.message ? error.message : error);
      return;
    }
    parts.out.textContent = JSON.stringify(view, null, 1);
    parts.stage.textContent = "";
    (spec.events || []).forEach(function (event, spot) {
      const row = document.createElement("div");
      row.className = "row";
      const head = document.createElement("span");
      head.textContent = "第 " + (spot + 1) + " 条 时刻 " + event.at + (event.ok ? " 成功" : " 失败");
      row.appendChild(head);
      const mark = document.createElement("span");
      const blocked = (view.rejected_positions || []).indexOf(spot + 1) !== -1;
      mark.className = "chip" + (blocked ? " bad" : " ok");
      mark.textContent = blocked ? "被拒" : "落到后端";
      row.appendChild(mark);
      parts.stage.appendChild(row);
    });
    parts.legend.textContent = "后端 " + view.backend + " 次，被拒 " + view.rejected + " 次，打开 "
      + view.open_count + " 次，探测 " + view.probes + " 次";
    parts.log.textContent = "收尾状态 " + view.state + "，打开时刻 " + JSON.stringify(view.opens);
  }

  const atInput = document.createElement("input");
  atInput.type = "number";
  atInput.value = "12";
  parts.controls.appendChild(atInput);

  const runButton = document.createElement("button");
  runButton.className = "primary";
  runButton.textContent = "跑一遍";
  runButton.addEventListener("click", draw);
  parts.controls.appendChild(runButton);

  const failButton = document.createElement("button");
  failButton.textContent = "追加一次失败";
  failButton.addEventListener("click", function () {
    const next = Number(atInput.value);
    spec.events = (spec.events || []).concat([{ at: Number.isFinite(next) ? Math.max(0, Math.round(next)) : 0, ok: false }]);
    draw();
  });
  parts.controls.appendChild(failButton);

  const okButton = document.createElement("button");
  okButton.textContent = "追加一次成功";
  okButton.addEventListener("click", function () {
    const next = Number(atInput.value);
    spec.events = (spec.events || []).concat([{ at: Number.isFinite(next) ? Math.max(0, Math.round(next)) : 0, ok: true }]);
    draw();
  });
  parts.controls.appendChild(okButton);

  const dropButton = document.createElement("button");
  dropButton.textContent = "删最后一条事件";
  dropButton.addEventListener("click", function () {
    spec.events = (spec.events || []).slice(0, Math.max(0, (spec.events || []).length - 1));
    draw();
  });
  parts.controls.appendChild(dropButton);

  draw();
}
