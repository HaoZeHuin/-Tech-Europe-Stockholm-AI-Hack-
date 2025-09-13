import type { NavKey } from "@/components/nav-items";

const EVT = "nav:go";

export function navGo(key: NavKey) {
  window.dispatchEvent(new CustomEvent<NavKey>(EVT, { detail: key }));
}

export function onNavGo(handler: (key: NavKey) => void) {
  const h = (e: Event) => handler((e as CustomEvent<NavKey>).detail);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
