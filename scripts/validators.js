export const patterns = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/
};

function pass() {
  return { valid: true, message: "" };
}

function fail(message) {
  return { valid: false, message };
}

export function collapseSpaces(value) {
  return value.replace(/\s{2,}/g, " ");
}

export function validateDescription(value) {
  if (value === "") {
    return fail("Enter a description.");
  }
  if (!patterns.description.test(value)) {
    return fail("Remove the spaces at the start or end.");
  }
  return pass();
}

export function validateAmount(value) {
  if (value === "") {
    return fail("Enter an amount.");
  }
  if (!patterns.amount.test(value)) {
    return fail("Use digits with up to two decimals and no leading zeros, like 12.50.");
  }
  return pass();
}
