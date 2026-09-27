// state.js：能不能放行（基线：一律给真）
export function mayPass(state, openedAt, now, cooldown) {
  if (state === "闭合" || state === "半开") return true;
  if (state === "打开") return now - openedAt >= cooldown;
  return false;
}
