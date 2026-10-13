import { initForm } from "./form.js";
import { initRecords } from "./records.js";
import { initDashboard } from "./dashboard.js";

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

stopFormsFromReloadingThePage();
initNavigation();
initForm();
initRecords();
initDashboard();
