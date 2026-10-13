import { getState, subscribe } from "./state.js";
import { createElement, formatAmount } from "./ui.js";
import { sortRecords } from "./search.js";

const container = document.querySelector("#recordsContainer");
const wideScreen = window.matchMedia("(min-width: 48em)");
const sortSelect = document.querySelector("#sortSelect");

const columns = [
  { key: "date", label: "Date", sortable: true },
  { key: "description", label: "Description", sortable: true },
  { key: "category", label: "Category", sortable: false },
  { key: "amount", label: "Amount", sortable: true }
];

const view = {
  sortKey: "date",
  sortDirection: "descending"
};

function displayTexts(record) {
  return {
    date: record.date,
    description: record.description,
    category: record.category,
    amount: formatAmount(record.amount)
  };
}

function cellAttributes(text) {
  return { text };
}

function entryAttributes(record, className) {
  return { "data-id": record.id, className };
}

function buildAmount(texts) {
  const currency = getState().settings.baseCurrency;
  return [currency + " ", createElement("span", cellAttributes(texts.amount))];
}

function nextDirection(key) {
  if (view.sortKey !== key) {
    return "ascending";
  }
  return view.sortDirection === "ascending" ? "descending" : "ascending";
}

function sortArrow(key) {
  if (view.sortKey !== key) {
    return "↕";
  }
  return view.sortDirection === "ascending" ? "↑" : "↓";
}

function buildHeaderCell(column) {
  if (!column.sortable) {
    return createElement("th", { scope: "col", text: column.label });
  }
  const button = createElement("button", {
    type: "button",
    className: "sort-button",
    "data-sort-key": column.key,
    "data-focus-key": "sort-" + column.key
  }, [
    column.label,
    createElement("span", { className: "sort-arrow", "aria-hidden": "true", text: sortArrow(column.key) })
  ]);
  const sortState = view.sortKey === column.key ? view.sortDirection : "none";
  return createElement("th", { scope: "col", "aria-sort": sortState }, [button]);
}

function buildRow(record) {
  const texts = displayTexts(record);
  return createElement("tr", entryAttributes(record, "record-row"), [
    createElement("td", cellAttributes(texts.date)),
    createElement("th", { scope: "row", ...cellAttributes(texts.description) }),
    createElement("td", cellAttributes(texts.category)),
    createElement("td", { className: "amount-cell" }, buildAmount(texts))
  ]);
}

function buildTable(records) {
  return createElement("table", { className: "records-table" }, [
    createElement("caption", { text: "Your transactions" }),
    createElement("thead", {}, [createElement("tr", {}, columns.map(buildHeaderCell))]),
    createElement("tbody", {}, records.map(buildRow))
  ]);
}

function buildDetail(label, content) {
  return createElement("div", {}, [
    createElement("dt", { text: label }),
    createElement("dd", {}, content)
  ]);
}

function buildCard(record) {
  const texts = displayTexts(record);
  return createElement("li", entryAttributes(record, "record-card"), [
    createElement("h3", { className: "record-title", ...cellAttributes(texts.description) }),
    createElement("dl", { className: "record-details" }, [
      buildDetail("Date", [createElement("span", cellAttributes(texts.date))]),
      buildDetail("Category", [createElement("span", cellAttributes(texts.category))]),
      buildDetail("Amount", buildAmount(texts))
    ])
  ]);
}

function buildCardList(records) {
  return createElement("ul", { className: "record-cards" }, records.map(buildCard));
}

function buildEmptyState(message) {
  return createElement("p", { className: "empty-state", text: message });
}

function render() {
  const { records } = getState();
  const visible = sortRecords(records, view.sortKey, view.sortDirection);
  const focusKey = document.activeElement?.dataset.focusKey;
  sortSelect.value = view.sortKey + "-" + view.sortDirection;
  if (records.length === 0) {
    container.replaceChildren(buildEmptyState("No records yet. Add your first one with the form below."));
    return;
  }
  container.replaceChildren(wideScreen.matches ? buildTable(visible) : buildCardList(visible));
  restoreFocus(focusKey);
}

function restoreFocus(focusKey) {
  if (!focusKey) {
    return;
  }
  const target = container.querySelector("[data-focus-key=\"" + focusKey + "\"]");
  if (target) {
    target.focus();
  }
}

function handleSortClick(event) {
  const button = event.target.closest("[data-sort-key]");
  if (!button) {
    return;
  }
  const key = button.dataset.sortKey;
  view.sortDirection = nextDirection(key);
  view.sortKey = key;
  render();
}

function handleSortSelect() {
  const [key, direction] = sortSelect.value.split("-");
  view.sortKey = key;
  view.sortDirection = direction;
  render();
}

export function initRecords() {
  subscribe(render);
  wideScreen.addEventListener("change", render);
  container.addEventListener("click", handleSortClick);
  sortSelect.addEventListener("change", handleSortSelect);
  render();
}
