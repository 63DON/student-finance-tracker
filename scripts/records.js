import { getState, subscribe, deleteRecord, updateRecord } from "./state.js";
import { createElement, formatAmount, setText } from "./ui.js";
import { compileRegex, filterRecords, sortRecords, highlight } from "./search.js";
import { openDialog } from "./dialog.js";
import { convertAmount } from "./stats.js";
import {
  validateDescription,
  validateAmount,
  validateCategory,
  validateDate,
  collapseSpaces
} from "./validators.js";

const container = document.querySelector("#recordsContainer");
const searchInput = document.querySelector("#searchInput");
const searchError = document.querySelector("#searchError");
const searchStatus = document.querySelector("#searchStatus");
const recordsStatus = document.querySelector("#recordsStatus");
const recordsHeading = document.querySelector("#recordsHeading");
const caseToggle = document.querySelector("#caseToggle");
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
  sortDirection: "descending",
  query: "",
  ignoreCase: true,
  newRecordId: null,
  editingId: null
};

let activeRegex = null;

function displayTexts(record) {
  return {
    date: record.date,
    description: record.description,
    category: record.category,
    amount: formatAmount(convertAmount(record.amount, getState().settings))
  };
}

function cellAttributes(text) {
  return { html: highlight(text, activeRegex) };
}

function entryAttributes(record, className) {
  const isNew = record.id === view.newRecordId;
  return { "data-id": record.id, className: isNew ? className + " is-new" : className };
}

function buildAmount(texts) {
  const currency = getState().settings.displayCurrency;
  return [currency + " ", createElement("span", cellAttributes(texts.amount))];
}

function buildActionButton(record, action, label, extraClass) {
  return createElement("button", {
    type: "button",
    className: "button button-small " + extraClass,
    "data-action": action,
    "data-focus-key": action + "-" + record.id,
    "aria-label": label + " " + record.description,
    text: label
  });
}

function buildActions(record) {
  return [
    buildActionButton(record, "edit", "Edit", ""),
    buildActionButton(record, "delete", "Delete", "button-danger")
  ];
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

function buildEditInput(name, label, value, errorId) {
  return createElement("input", {
    type: "text",
    name,
    value,
    autocomplete: "off",
    "aria-label": label,
    "data-focus-key": "field-" + name,
    "aria-describedby": errorId
  });
}

function buildEditControls(record) {
  const { categories, baseCurrency } = getState().settings;
  const options = categories.includes(record.category) ? categories : [record.category, ...categories];
  const errorId = "editError-" + record.id;
  return {
    description: buildEditInput("description", "Description", record.description, errorId),
    amount: buildEditInput("amount", "Amount in " + baseCurrency, String(record.amount), errorId),
    date: buildEditInput("date", "Date as year, month, day", record.date, errorId),
    category: createElement("select", { name: "category", "aria-label": "Category", "aria-describedby": errorId, "data-focus-key": "field-category" },
      options.map((name) => createElement("option", { text: name, selected: name === record.category }))),
    error: createElement("p", { className: "field-error", id: errorId }),
    buttons: [
      createElement("button", { type: "button", className: "button button-small button-primary", "data-action": "save", text: "Save" }),
      createElement("button", { type: "button", className: "button button-small", "data-action": "cancel", text: "Cancel" })
    ]
  };
}

function buildEditRow(record) {
  const controls = buildEditControls(record);
  return createElement("tr", { "data-id": record.id, "data-editing": true, className: "record-row is-editing" }, [
    createElement("td", {}, [controls.date]),
    createElement("td", {}, [controls.description]),
    createElement("td", {}, [controls.category]),
    createElement("td", {}, [controls.amount]),
    createElement("td", {}, [createElement("div", { className: "row-actions" }, controls.buttons), controls.error])
  ]);
}

function buildLabelledControl(label, control) {
  return createElement("label", { className: "field" }, [createElement("span", { text: label }), control]);
}

function buildEditCard(record) {
  const controls = buildEditControls(record);
  return createElement("li", { "data-id": record.id, "data-editing": true, className: "record-card is-editing" }, [
    createElement("h3", { className: "record-title", text: "Editing " + record.description }),
    buildLabelledControl("Description", controls.description),
    buildLabelledControl("Amount", controls.amount),
    buildLabelledControl("Category", controls.category),
    buildLabelledControl("Date", controls.date),
    controls.error,
    createElement("div", { className: "button-row" }, controls.buttons)
  ]);
}

function buildRow(record) {
  if (record.id === view.editingId) {
    return buildEditRow(record);
  }
  const texts = displayTexts(record);
  return createElement("tr", entryAttributes(record, "record-row"), [
    createElement("td", cellAttributes(texts.date)),
    createElement("th", { scope: "row", ...cellAttributes(texts.description) }),
    createElement("td", cellAttributes(texts.category)),
    createElement("td", { className: "amount-cell" }, buildAmount(texts)),
    createElement("td", {}, [createElement("div", { className: "row-actions" }, buildActions(record))])
  ]);
}

function buildTable(records) {
  return createElement("table", { className: "records-table" }, [
    createElement("caption", { text: "Your transactions, amounts in " + getState().settings.displayCurrency }),
    createElement("thead", {}, [createElement("tr", {}, [
      ...columns.map(buildHeaderCell),
      createElement("th", { scope: "col", text: "Actions" })
    ])]),
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
  if (record.id === view.editingId) {
    return buildEditCard(record);
  }
  const texts = displayTexts(record);
  return createElement("li", entryAttributes(record, "record-card"), [
    createElement("h3", { className: "record-title", ...cellAttributes(texts.description) }),
    createElement("dl", { className: "record-details" }, [
      buildDetail("Date", [createElement("span", cellAttributes(texts.date))]),
      buildDetail("Category", [createElement("span", cellAttributes(texts.category))]),
      buildDetail("Amount", buildAmount(texts))
    ]),
    createElement("div", { className: "button-row" }, buildActions(record))
  ]);
}

function buildCardList(records) {
  return createElement("ul", { className: "record-cards" }, records.map(buildCard));
}

function buildEmptyState(message) {
  return createElement("p", { className: "empty-state", text: message });
}

function readEditDraft() {
  const entry = container.querySelector("[data-editing]");
  if (!entry) {
    return null;
  }
  const values = {};
  for (const control of entry.querySelectorAll("input, select")) {
    values[control.name] = control.value;
  }
  return { id: entry.dataset.id, values };
}

function applyEditDraft(draft) {
  const entry = container.querySelector("[data-editing]");
  if (!draft || !entry || entry.dataset.id !== draft.id) {
    return;
  }
  for (const control of entry.querySelectorAll("input, select")) {
    control.value = draft.values[control.name];
  }
}

function render() {
  const { records } = getState();
  activeRegex = compileRegex(view.query, view.ignoreCase ? "i" : "");
  const patternIsInvalid = view.query !== "" && activeRegex === null;
  const matching = filterRecords(records, activeRegex, searchTexts);
  const visible = sortRecords(matching, view.sortKey, view.sortDirection);
  showSearchFeedback(patternIsInvalid, visible.length, records.length);
  const focusKey = document.activeElement?.dataset.focusKey;
  const draft = readEditDraft();
  sortSelect.value = view.sortKey + "-" + view.sortDirection;
  if (records.length === 0) {
    container.replaceChildren(buildEmptyState("No records yet. Add your first one with the form below."));
    return;
  }
  if (visible.length === 0) {
    container.replaceChildren(buildEmptyState("No records match that pattern. Try a simpler one or clear the search."));
    return;
  }
  container.replaceChildren(wideScreen.matches ? buildTable(visible) : buildCardList(visible));
  applyEditDraft(draft);
  restoreFocus(focusKey);
}

function searchTexts(record) {
  return Object.values(displayTexts(record));
}

function showSearchFeedback(patternIsInvalid, shownCount, totalCount) {
  searchInput.setAttribute("aria-invalid", String(patternIsInvalid));
  setText(searchError, patternIsInvalid
    ? "That pattern is not valid. Check for an unclosed bracket or a stray backslash."
    : "");
  if (patternIsInvalid) {
    setText(searchStatus, "Invalid pattern, so all " + totalCount + " records are shown.");
  } else if (view.query === "") {
    setText(searchStatus, "");
  } else {
    setText(searchStatus, "Showing " + shownCount + " of " + totalCount + " records.");
  }
}

function handleSearchInput() {
  view.query = searchInput.value;
  render();
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

function handleHintClick(event) {
  const button = event.target.closest("[data-pattern]");
  if (!button) {
    return;
  }
  searchInput.value = button.dataset.pattern;
  handleSearchInput();
  searchInput.focus();
}

function moveFocus(focusKey) {
  const target = focusKey
    ? container.querySelector("[data-focus-key=\"" + focusKey + "\"]")
    : null;
  (target || recordsHeading).focus();
}

function neighbourId(id) {
  const ids = Array.from(container.querySelectorAll("[data-id]")).map((entry) => entry.dataset.id);
  const index = ids.indexOf(id);
  return ids[index + 1] || ids[index - 1] || null;
}

async function confirmDelete(id) {
  const record = getState().records.find((entry) => entry.id === id);
  const answer = await openDialog({
    title: "Delete this record?",
    message: "\"" + record.description + "\" will be removed for good.",
    choices: [
      { label: "Keep it", value: "" },
      { label: "Delete", value: "delete", className: "button button-danger" }
    ]
  });
  if (answer !== "delete") {
    return;
  }
  const nextId = neighbourId(id);
  deleteRecord(id);
  moveFocus(nextId ? "edit-" + nextId : null);
  setText(recordsStatus, "Deleted \"" + record.description + "\".");
}

const editRules = {
  description: validateDescription,
  amount: validateAmount,
  category: validateCategory,
  date: validateDate
};

function startEdit(id) {
  view.editingId = id;
  render();
  container.querySelector("[data-editing] [name=\"description\"]").focus();
  setText(recordsStatus, "Editing. Press Enter to save or Escape to cancel.");
}

function cancelEdit(id) {
  view.editingId = null;
  render();
  moveFocus("edit-" + id);
  setText(recordsStatus, "Edit cancelled. Nothing was changed.");
}

function checkEditControl(control) {
  const result = editRules[control.name](control.value);
  control.setAttribute("aria-invalid", String(!result.valid));
  return result;
}

function saveEdit(entry) {
  const controls = Object.keys(editRules).map((name) => entry.querySelector("[name=\"" + name + "\"]"));
  const failures = controls
    .map((control) => ({ control, result: checkEditControl(control) }))
    .filter((failure) => !failure.result.valid);
  if (failures.length > 0) {
    entry.querySelector(".field-error").textContent = failures.map((failure) => failure.result.message).join(" ");
    failures[0].control.focus();
    return;
  }
  const [description, amount, category, date] = controls.map((control) => control.value);
  view.editingId = null;
  const record = updateRecord(entry.dataset.id, {
    description: collapseSpaces(description),
    amount: Number(amount),
    category,
    date
  });
  moveFocus("edit-" + record.id);
  setText(recordsStatus, "Saved changes to \"" + record.description + "\".");
}

function handleEditInput(event) {
  const entry = event.target.closest("[data-editing]");
  if (!entry) {
    return;
  }
  entry.querySelector(".field-error").textContent = checkEditControl(event.target).message;
}

function handleEditKeys(event) {
  const entry = event.target.closest("[data-editing]");
  if (!entry) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    cancelEdit(entry.dataset.id);
  } else if (event.key === "Enter" && event.target.matches("input, select")) {
    event.preventDefault();
    saveEdit(entry);
  }
}

function handleActionClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }
  const entry = button.closest("[data-id]");
  const action = button.dataset.action;
  if (action === "edit") {
    startEdit(entry.dataset.id);
  }
  if (action === "save") {
    saveEdit(entry);
  }
  if (action === "cancel") {
    cancelEdit(entry.dataset.id);
  }
  if (action === "delete") {
    confirmDelete(entry.dataset.id);
  }
}

export function initRecords() {
  subscribe((state, change) => {
    view.newRecordId = change.type === "add" ? change.id : null;
    render();
    view.newRecordId = null;
  });
  wideScreen.addEventListener("change", render);
  container.addEventListener("click", handleSortClick);
  container.addEventListener("click", handleActionClick);
  container.addEventListener("input", handleEditInput);
  container.addEventListener("keydown", handleEditKeys);
  sortSelect.addEventListener("change", handleSortSelect);
  searchInput.addEventListener("input", handleSearchInput);
  document.querySelector("#hintList").addEventListener("click", handleHintClick);
  caseToggle.addEventListener("change", () => {
    view.ignoreCase = caseToggle.checked;
    render();
  });
  render();
}
