import { getState, updateSettings } from "./state.js";
import { validateBudgetCap } from "./validators.js";
import { showFieldResult } from "./ui.js";

const budgetForm = document.querySelector("#budgetForm");
const budgetCapInput = document.querySelector("#budgetCapInput");
const budgetCapError = document.querySelector("#budgetCapError");
const budgetStatus = document.querySelector("#budgetStatus");

function validateBudgetInput() {
  const result = validateBudgetCap(budgetCapInput.value);
  showFieldResult(budgetCapInput, budgetCapError, result);
  return result.valid;
}

function saveBudgetCap() {
  if (!validateBudgetInput()) {
    budgetStatus.textContent = "The cap was not saved. Fix the value first.";
    budgetCapInput.focus();
    return;
  }
  const value = budgetCapInput.value;
  updateSettings({ budgetCap: value === "" ? null : Number(value) });
  budgetStatus.textContent = value === ""
    ? "Cap removed."
    : "Cap saved as " + getState().settings.baseCurrency + " " + value + ".";
}

function fillBudgetInput() {
  const { budgetCap } = getState().settings;
  budgetCapInput.value = budgetCap === null ? "" : String(budgetCap);
}

export function initSettings() {
  budgetCapInput.addEventListener("input", validateBudgetInput);
  budgetForm.addEventListener("submit", saveBudgetCap);
  fillBudgetInput();
}
