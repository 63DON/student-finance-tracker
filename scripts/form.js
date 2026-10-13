import {
  validateDescription,
  validateAmount,
  validateCategory,
  validateDate
} from "./validators.js";
import { showFieldResult, clearFieldResult } from "./ui.js";

const form = document.querySelector("#recordForm");
const formStatus = document.querySelector("#formStatus");

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
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function clearFields() {
  for (const field of fields) {
    clearFieldResult(field.input, field.error);
  }
  form.elements.description.value = "";
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
  formStatus.textContent = "All four fields are valid.";
}

function handleReset(event) {
  event.preventDefault();
  clearFields();
  formStatus.textContent = "";
  form.elements.description.focus();
}

export function initForm() {
  for (const field of fields) {
    field.input.addEventListener("input", () => validateField(field));
    field.input.addEventListener("blur", () => validateField(field));
  }
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", handleReset);
  form.elements.date.value = todayText();
}
