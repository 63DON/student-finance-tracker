import {
  validateDescription,
  validateAmount,
  validateCategory,
  validateDate
} from "./validators.js";
import { showFieldResult, clearFieldResult } from "./ui.js";

const form = document.querySelector("#recordForm");

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

export function initForm() {
  for (const field of fields) {
    field.input.addEventListener("input", () => validateField(field));
    field.input.addEventListener("blur", () => validateField(field));
  }
}
