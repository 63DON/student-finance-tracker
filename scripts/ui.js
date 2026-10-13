export function showFieldResult(input, errorElement, result) {
  errorElement.textContent = result.message;
  input.setAttribute("aria-invalid", String(!result.valid));
}

export function clearFieldResult(input, errorElement) {
  errorElement.textContent = "";
  input.removeAttribute("aria-invalid");
}
