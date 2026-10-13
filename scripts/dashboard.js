import { getState, subscribe } from "./state.js";
import { totalSpent, topCategory, lastSevenDays, capStatus, convertAmount } from "./stats.js";
import { createElement, formatAmount, formatMoney, setText } from "./ui.js";

const statCount = document.querySelector("#statCount");
const statTotal = document.querySelector("#statTotal");
const statTopCategory = document.querySelector("#statTopCategory");
const statTopCategoryNote = document.querySelector("#statTopCategoryNote");
const trendChart = document.querySelector("#trendChart");
const trendNote = document.querySelector("#trendNote");
const trendSummary = document.querySelector("#trendSummary");
const capCard = document.querySelector("#capCard");
const statCap = document.querySelector("#statCap");
const statCapNote = document.querySelector("#statCapNote");
const capPolite = document.querySelector("#capPolite");
const capAssertive = document.querySelector("#capAssertive");

function renderTotals(records, settings) {
  const top = topCategory(records);
  setText(statCount, String(records.length));
  setText(statTotal, formatMoney(totalSpent(records), settings));
  setText(statTopCategory, top ? top.name : "None yet");
  setText(statTopCategoryNote, top ? formatMoney(top.total, settings) + " spent" : "");
}

function buildChartColumn(day, highestTotal, settings) {
  const bar = createElement("div", { className: "chart-bar" });
  const share = highestTotal > 0 ? (day.total / highestTotal) * 100 : 0;
  bar.style.height = (day.total > 0 ? Math.max(share, 3) : 0) + "%";
  return createElement("div", { className: "chart-column" }, [
    createElement("span", { className: "chart-value", text: formatAmount(convertAmount(day.total, settings)) }),
    createElement("div", { className: "chart-track" }, [bar]),
    createElement("span", { className: "chart-label", text: day.label })
  ]);
}

function renderTrend(records, settings) {
  const days = lastSevenDays(records);
  const highestTotal = Math.max(...days.map((day) => day.total));
  const weekTotal = days.reduce((sum, day) => sum + day.total, 0);
  const spokenDays = days.map((day) => day.label + ", " + formatMoney(day.total, settings));
  trendChart.replaceChildren(...days.map((day) => buildChartColumn(day, highestTotal, settings)));
  setText(trendNote, weekTotal > 0
    ? "You spent " + formatMoney(weekTotal, settings) + " in the last 7 days."
    : "Nothing recorded in the last 7 days.");
  setText(trendSummary, "Spending by day, oldest first: " + spokenDays.join("; ") + ".");
}

function renderCap(records, settings) {
  const status = capStatus(totalSpent(records), settings.budgetCap);
  const difference = formatMoney(status.difference, settings);
  capCard.classList.toggle("is-over", status.state === "over");
  if (status.state === "none") {
    setText(statCap, "No cap set");
    setText(statCapNote, "Set a cap in Settings to track what is left.");
    setText(capPolite, "");
    setText(capAssertive, "");
    return;
  }
  const cap = formatMoney(settings.budgetCap, settings);
  if (status.state === "over") {
    setText(statCap, difference + " over");
    setText(statCapNote, "You have passed your cap of " + cap + ".");
    setText(capPolite, "");
    setText(capAssertive, "Budget exceeded. You are " + difference + " over your cap of " + cap + ".");
    return;
  }
  setText(statCap, difference + " left");
  setText(statCapNote, "Out of a cap of " + cap + ".");
  setText(capAssertive, "");
  setText(capPolite, "You have " + difference + " left of your " + cap + " cap.");
}

function render() {
  const { records, settings } = getState();
  renderTotals(records, settings);
  renderTrend(records, settings);
  renderCap(records, settings);
}

export function initDashboard() {
  subscribe(render);
  render();
}
