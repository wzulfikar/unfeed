import { computePosition, flip, shift } from "@floating-ui/dom";
import { createFocusTrap } from "focus-trap";

import { formHTML } from "./form-html";
import formCSS from "./form.css";

export type UnfeedConfig = {
  url: string;
  user: Record<any, any>;
  disableErrorAlert: boolean;
};
const config: UnfeedConfig = {
  url: "",
  user: {},
  disableErrorAlert: false,
  // Spread user config when loaded
  ...(window as any).unfeed?.config,
};

function init() {
  const styleElement = document.createElement("style");
  styleElement.id = "unfeed__css";
  styleElement.innerHTML = formCSS;

  document.head.insertBefore(styleElement, document.head.firstChild);

  document.querySelectorAll("[data-unfeed-button]").forEach((el) => {
    el.addEventListener("click", open);
  });
}
window.addEventListener("load", init);

const containerElement = document.createElement("div");
containerElement.id = "unfeed__container";

const trap = createFocusTrap(containerElement, {
  initialFocus: "#unfeed__radio--issue",
  allowOutsideClick: true,
});

function open(e: Event) {
  document.body.appendChild(containerElement);
  containerElement.innerHTML = formHTML;
  containerElement.style.display = "block";

  const target = (e?.target as HTMLElement) || document.body;
  computePosition(target, containerElement, {
    placement: "bottom",
    middleware: [flip(), shift({ crossAxis: true, padding: 8 })],
    strategy: "fixed",
  }).then(({ x, y }) => {
    Object.assign(containerElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });

  trap.activate();

  document.getElementById("unfeed__close")!.addEventListener("click", close);

  Array.from(containerElement.getElementsByClassName("unfeed__radio")).forEach(
    (el) => {
      el.addEventListener("change", changeType);
    }
  );

  document.getElementById("unfeed__form")!.addEventListener("submit", submit);
}

function close() {
  trap.deactivate();

  containerElement.innerHTML = "";

  containerElement.remove();
  containerElement.removeAttribute("data-unfeed-type");
  containerElement.removeAttribute("data-success");
}

function changeType(e: Event) {
  const value = (e.target as HTMLInputElement).value;

  containerElement.setAttribute("data-unfeed-type", value);

  let placeholder = "I think…";
  if (value === "issue") placeholder = "I’m having an issue with…";
  else if (value === "idea") placeholder = "I’d like to see…";

  document
    .getElementById("unfeed__message")
    ?.setAttribute("placeholder", placeholder);
}

function submit(e: Event) {
  e.preventDefault();
  const target = e.target as HTMLFormElement;

  if (!config.url) {
    console.error("Unfeed: No URL provided");
    if (!config.disableErrorAlert)
      alert("Could not send feedback: No URL provided");
    return;
  }

  const submitElement = document.getElementById("unfeed__submit")!;
  submitElement.setAttribute("disabled", "");
  submitElement.innerHTML = "Sending…";

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const data = {
    ...config.user,
    feedbackType: (target.elements as any).feedbackType.value,
    message: (target.elements as any).message.value,
    timestamp: Date.now(),
  };

  fetch(config.url, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(data),
  })
    .then(() => {
      containerElement.setAttribute("data-success", "");
    })
    .catch((e) => {
      console.error("Unfeed:", e);
      if (!config.disableErrorAlert)
        alert(`Could not send feedback: ${e.message}`);
    });

  return false;
}

const unfeed = { init, open, changeType, close, submit, config };
(window as any).unfeed = unfeed;

export default unfeed;
