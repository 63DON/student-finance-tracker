import { getState, subscribe } from "./state.js";
import { createElement, formatAmount } from "./ui.js";

const container = document.querySelector("#recordsContainer");

const columns = [
  { key: "date", label: "Date", sortable: true },
  { key: "description", label: "Description", sortable: true },
  { key: "category", label: "Category", sortable: false },
  { key: "amount", label: "Amount", sortable: true }
];

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

function buildHeaderCell(column) {
  return createElement("th", { scope: "col", text: column.label });
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

function buildEmptyState(message) {
  return createElement("p", { className: "empty-state", text: message });
}

function render() {
  const { records } = getState();
  const visible = records;
  if (records.length === 0) {
    container.replaceChildren(buildEmptyState("No records yet. Add your first one with the form below."));
    return;
  }
  container.replaceChildren(buildTable(visible));
}

export function initRecords() {
  subscribe(render);
  render();
}
