import { createElement } from "./ui.js";

const dialog = document.querySelector("#appDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogMessage = document.querySelector("#dialogMessage");
const dialogActions = document.querySelector("#dialogActions");

function buildChoiceButton(choice) {
  return createElement("button", {
    type: "button",
    className: choice.className || "button",
    value: choice.value,
    text: choice.label
  });
}

export function openDialog({ title, message, choices }) {
  const opener = document.activeElement;
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialogActions.replaceChildren(...choices.map(buildChoiceButton));
  return new Promise((resolve) => {
    dialog.returnValue = "";
    dialog.addEventListener("close", () => {
      if (opener && opener.isConnected) {
        opener.focus();
      }
      resolve(dialog.returnValue || null);
    }, { once: true });
    dialog.showModal();
    dialogActions.firstElementChild.focus();
  });
}

dialogActions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) {
    dialog.close(button.value);
  }
});
