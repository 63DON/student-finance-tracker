import { convertAmount } from "./stats.js";

export function showFieldResult(input, errorElement, result) {
  errorElement.textContent = result.message;
  input.setAttribute("aria-invalid", String(!result.valid));
}

export function clearFieldResult(input, errorElement) {
  errorElement.textContent = "";
  input.removeAttribute("aria-invalid");
}

export function createElement(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) {
      continue;
    }
    if (name === "text") {
      element.textContent = value;
    } else if (name === "html") {
      element.innerHTML = value;
    } else if (name === "className") {
      element.className = value;
    } else {
      element.setAttribute(name, value === true ? "" : value);
    }
  }
  element.append(...children);
  return element;
}

export function setText(element, text) {
  if (element.textContent !== text) {
    element.textContent = text;
  }
}

export function formatAmount(amount) {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function formatMoney(amount, settings) {
  return settings.displayCurrency + " " + formatAmount(convertAmount(amount, settings));
}
