// state.js：能不能放行（闭合/半开放行；打开态看冷却是否走完）
export function mayPass(state, openedAt, now, cooldown) {
  if (state === "闭合" || state === "半开") return true;
  if (state === "打开") return now - openedAt >= cooldown;
  return false;
}
