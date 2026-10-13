import {
  validateDescription,
  validateAmount,
  validateCategory,
  validateDate,
  findDuplicateWord,
  collapseSpaces
} from "./validators.js";
import { showFieldResult, clearFieldResult, createElement } from "./ui.js";
import { addRecord, getState, subscribe } from "./state.js";
import { toIsoDate } from "./stats.js";

const form = document.querySelector("#recordForm");
const formStatus = document.querySelector("#formStatus");
const descriptionWarning = document.querySelector("#descriptionWarning");
const amountCurrency = document.querySelector("#amountCurrency");

const fields = [
  { name: "description", label: "Description", validate: validateDescription },
  { name: "amount", label: "Amount", validate: validateAmount },
  { name: "category", label: "Category", validate: validateCategory },
  { name: "date", label: "Date", validate: validateDate }
].map((field) => ({
  ...field,
  input: form.elements[field.name],
  error: document.querySelector("#" + field.name + "Error")
}));

function validateField(field) {
  const result = field.validate(field.input.value);
  showFieldResult(field.input, field.error, result);
  return result.valid;
}

function todayText() {
  return toIsoDate(new Date());
}

function showDuplicateWordWarning() {
  const word = findDuplicateWord(form.elements.description.value);
  descriptionWarning.textContent = word
    ? "The word \"" + word + "\" appears twice in a row. Is that a typo?"
    : "";
}

function clearFields() {
  for (const field of fields) {
    clearFieldResult(field.input, field.error);
  }
  form.elements.description.value = "";
  descriptionWarning.textContent = "";
  form.elements.amount.value = "";
  form.elements.category.selectedIndex = 0;
  form.elements.date.value = todayText();
}

function describeInvalidFields(invalidFields) {
  const names = invalidFields.map((field) => field.label).join(", ");
  if (invalidFields.length === 1) {
    return "1 field needs fixing: " + names + ".";
  }
  return invalidFields.length + " fields need fixing: " + names + ".";
}

function handleSubmit() {
  const invalidFields = fields.filter((field) => !validateField(field));
  if (invalidFields.length > 0) {
    formStatus.textContent = describeInvalidFields(invalidFields);
    invalidFields[0].input.focus();
    return;
  }
  const record = addRecord({
    description: collapseSpaces(form.elements.description.value),
    amount: Number(form.elements.amount.value),
    category: form.elements.category.value,
    date: form.elements.date.value
  });
  clearFields();
  formStatus.textContent = "Added \"" + record.description + "\" to your records.";
  form.elements.description.focus();
}

function handleReset(event) {
  event.preventDefault();
  clearFields();
  formStatus.textContent = "";
  form.elements.description.focus();
}

function renderCategoryOptions() {
  const { categories } = getState().settings;
  const select = form.elements.category;
  const current = Array.from(select.options).map((option) => option.value);
  if (current.join("|") === categories.join("|")) {
    return;
  }
  const chosen = select.value;
  select.replaceChildren(...categories.map((name) => createElement("option", { text: name })));
  if (categories.includes(chosen)) {
    select.value = chosen;
  }
}

function followSettings() {
  amountCurrency.textContent = "(" + getState().settings.baseCurrency + ")";
  renderCategoryOptions();
}

export function initForm() {
  for (const field of fields) {
    field.input.addEventListener("input", () => validateField(field));
    field.input.addEventListener("blur", () => {
      if (field.input.value !== "") {
        validateField(field);
      }
    });
  }
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", handleReset);
  form.elements.description.addEventListener("input", showDuplicateWordWarning);
  form.elements.date.value = todayText();
  subscribe(followSettings);
  followSettings();
}
