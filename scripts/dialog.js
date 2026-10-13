import { createElement } from "./ui.js";

const dialog = document.querySelector("#appDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogMessage = document.querySelector("#dialogMessage");
const dialogActions = document.querySelector("#dialogActions");

let answerPending = null;
let closeEventsToIgnore = 0;

function buildChoiceButton(choice) {
  return createElement("button", {
    type: "button",
    className: choice.className || "button",
    value: choice.value,
    text: choice.label
  });
}

function settle(value) {
  if (!answerPending) {
    return;
  }
  const answer = answerPending;
  answerPending = null;
  if (dialog.open) {
    closeEventsToIgnore += 1;
    dialog.close();
  }
  answer(value || null);
}

export function openDialog({ title, message, choices }) {
  const opener = document.activeElement;
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialogActions.replaceChildren(...choices.map(buildChoiceButton));
  return new Promise((resolve) => {
    answerPending = (value) => {
      if (opener && opener.isConnected) {
        opener.focus();
      }
      resolve(value);
    };
    dialog.showModal();
    dialogActions.firstElementChild.focus();
  });
}

dialogActions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) {
    settle(button.value);
  }
});

dialog.addEventListener("close", () => {
  if (closeEventsToIgnore > 0) {
    closeEventsToIgnore -= 1;
    return;
  }
  settle(null);
});
