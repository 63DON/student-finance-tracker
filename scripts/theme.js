import { getState, subscribe, updateSettings } from "./state.js";

const themeToggle = document.querySelector("#themeToggle");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  const { theme } = getState().settings;
  if (theme === "dark" || theme === "light") {
    return theme;
  }
  return systemPrefersDark.matches ? "dark" : "light";
}

function applyTheme() {
  const theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
}

function switchTheme() {
  updateSettings({ theme: currentTheme() === "dark" ? "light" : "dark" });
}

export function initTheme() {
  themeToggle.addEventListener("click", switchTheme);
  systemPrefersDark.addEventListener("change", applyTheme);
  subscribe(applyTheme);
  applyTheme();
}
