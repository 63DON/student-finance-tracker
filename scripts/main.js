import { loadData, saveData } from "./storage.js";
import { hydrate, replaceRecords, subscribe } from "./state.js";
import { initForm } from "./form.js";
import { initRecords } from "./records.js";
import { initDashboard } from "./dashboard.js";
import { initSettings } from "./settings.js";
import { initDataTools } from "./dataTools.js";

const navLinks = Array.from(document.querySelectorAll(".nav-list a"));
const sections = navLinks.map((link) => document.querySelector(link.hash));

function markCurrentSection(sectionId) {
  for (const link of navLinks) {
    if (link.hash === "#" + sectionId) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function isScrolledToBottom() {
  const scrolled = window.scrollY + window.innerHeight;
  return scrolled >= document.documentElement.scrollHeight - 2;
}

function initNavigation() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        markCurrentSection(entry.target.id);
      }
    }
  }, { rootMargin: "-30% 0px -60% 0px" });

  for (const section of sections) {
    observer.observe(section);
  }

  for (const link of navLinks) {
    link.addEventListener("click", () => markCurrentSection(link.hash.slice(1)));
  }

  window.addEventListener("scroll", () => {
    if (isScrolledToBottom()) {
      markCurrentSection(sections[sections.length - 1].id);
    }
  }, { passive: true });
}

function stopFormsFromReloadingThePage() {
  document.addEventListener("submit", (event) => event.preventDefault());
}

const appNotice = document.querySelector("#appNotice");

function saveAfterEveryChange(state) {
  if (!saveData(state)) {
    appNotice.textContent = "Your changes could not be saved in this browser. Export a JSON copy to keep them.";
  }
}

async function fetchSeedRecords() {
  const response = await fetch("seed.json");
  if (!response.ok) {
    throw new Error("The seed file is missing");
  }
  return response.json();
}

async function loadSavedData() {
  const stored = loadData();
  if (stored.status === "ok") {
    hydrate(stored.data);
    return;
  }
  try {
    replaceRecords(await fetchSeedRecords());
    appNotice.textContent = stored.status === "corrupted"
      ? "Your saved data could not be read, so the tracker started again with sample records."
      : "Sample records were loaded to get you started. You can clear them in Settings.";
  } catch {
    appNotice.textContent = "The sample records could not be loaded. Add your first record below.";
  }
}

stopFormsFromReloadingThePage();
initNavigation();
initForm();
initRecords();
initDashboard();
initSettings();
initDataTools();
subscribe(saveAfterEveryChange);
loadSavedData();
