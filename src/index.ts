import { computePosition, flip, shift } from "@floating-ui/dom";
import { createFocusTrap } from "focus-trap";

import { formHTML } from "./form-html";
import formCSS from "./form.css";

export type UnfeedConfig = {
  url: string;
  user: Record<any, any>;
  disableErrorAlert: boolean;
  context?: string;
  footer?: string;
  payload?: Record<string, string>;
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
    if (!(el instanceof HTMLElement)) return;

    // Infer config from data attributes
    const dataset = el.dataset as Record<string, string>;
    if (dataset.unfeedOpen !== undefined) open(el, dataset);
    if (dataset.unfeedFooter !== undefined)
      config.footer = dataset.unfeedFooter;

    // Customize primary color
    if (dataset.unfeedPrimaryColor) {
      (document.querySelector(":root") as HTMLElement).style.setProperty(
        "--unfeed-primary-color",
        dataset.unfeedPrimaryColor
      );
    }

    el.addEventListener("click", (e: Event) =>
      open(e.target as HTMLElement, dataset)
    );
  });
}
window.addEventListener("load", init);

const containerElement = document.createElement("div");
containerElement.id = "unfeed__container";

const trap = createFocusTrap(containerElement, {
  initialFocus: "#unfeed__radio--issue",
  allowOutsideClick: true,
});

function open(target: HTMLElement, dataset: Record<string, string>) {
  document.body.appendChild(containerElement);
  containerElement.innerHTML = formHTML;
  containerElement.style.display = "block";

  // Customize footer
  if (config.footer !== undefined) {
    containerElement.querySelector("#unfeed__footer")!.innerHTML =
      config.footer;
  }

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
    (el) => el.addEventListener("change", changeType)
  );

  document
    .getElementById("unfeed__form")!
    .addEventListener("submit", (e) => submit(e, dataset));
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

  let placeholder = "I think..";
  if (value === "issue") placeholder = "I'm having an issue with..";
  if (value === "idea") placeholder = "I'd like to see..";

  const feedback = document.getElementById("unfeed__message") as HTMLElement;
  feedback.setAttribute("placeholder", placeholder);
  feedback.focus();
}

function submit(e: Event, dataset: Record<string, string>) {
  e.preventDefault();
  const target = e.target as HTMLFormElement;

  // Merge latest values from dataset to config
  if (dataset.unfeedButton) config.url = dataset.unfeedButton;
  if (dataset.unfeedName) config.user.name = dataset.unfeedName;
  if (dataset.unfeedEmail) config.user.email = dataset.unfeedEmail;
  if (dataset.unfeedContext) config.context = dataset.unfeedContext;

  // If specified, include arbitrary payload as key value
  const prefix = "unfeedPayload";
  for (const key in dataset) {
    if (key.startsWith(prefix)) {
      // Transform `unfeedPayloadSomeKey` into `someKey`
      const payloadName =
        key.charAt(prefix.length).toLowerCase() + key.slice(prefix.length + 1);
      config.payload = { ...config.payload, [payloadName]: dataset[key] };
    }
  }

  if (!config.url) {
    console.error("Unfeed: No URL provided");
    if (!config.disableErrorAlert) {
      alert("Could not send feedback: No URL provided");
    }
    return;
  }

  const submitElement = document.getElementById("unfeed__submit")!;
  submitElement.setAttribute("disabled", "");
  submitElement.innerHTML = "Sending..";

  const data = {
    ...config.user,
    feedbackType: (target.elements as any).feedbackType.value,
    message: (target.elements as any).message.value,
    timestamp: Date.now(),
    context: config.context,
    payload: config.payload,
  };

  fetch(config.url, {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    mode: (dataset.unfeedCorsMode || "no-cors") as RequestMode | undefined,
    body: JSON.stringify(data),
  })
    .then(() => containerElement.setAttribute("data-success", ""))
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
