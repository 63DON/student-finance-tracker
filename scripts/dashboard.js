import { getState, subscribe } from "./state.js";
import { totalSpent, topCategory } from "./stats.js";
import { formatMoney, setText } from "./ui.js";

const statCount = document.querySelector("#statCount");
const statTotal = document.querySelector("#statTotal");
const statTopCategory = document.querySelector("#statTopCategory");
const statTopCategoryNote = document.querySelector("#statTopCategoryNote");

function renderTotals(records, settings) {
  const top = topCategory(records);
  setText(statCount, String(records.length));
  setText(statTotal, formatMoney(totalSpent(records), settings));
  setText(statTopCategory, top ? top.name : "None yet");
  setText(statTopCategoryNote, top ? formatMoney(top.total, settings) + " spent" : "");
}

function render() {
  const { records, settings } = getState();
  renderTotals(records, settings);
}

export function initDashboard() {
  subscribe(render);
  render();
}
