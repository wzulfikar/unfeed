import { computePosition, flip, shift } from "@floating-ui/dom";
import { createFocusTrap } from "focus-trap";

import { config, ns } from "./config";
import { formHTML } from "./form-html";
import formCSS from "./form.css";

function init() {
  const styleElement = document.createElement("style");
  styleElement.id = "unfeed__css";
  styleElement.innerHTML = formCSS;

  document.head.insertBefore(styleElement, document.head.firstChild);

  document.querySelectorAll("[data-unfeed-button]").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;

    // Infer config from dataset
    const dataset = el.dataset;
    if (dataset.unfeedOpen !== undefined) open(el);
    if (dataset.unfeedFooter !== undefined) {
      config.footer = dataset.unfeedFooter;
    }

    // Customize primary color
    if (dataset.unfeedPrimaryColor) {
      (document.querySelector(":root") as HTMLElement).style.setProperty(
        "--unfeed-primary-color",
        dataset.unfeedPrimaryColor
      );
    }

    el.addEventListener("click", (e: Event) => open(e.target as HTMLElement));
  });
}
window.addEventListener("load", init);

const containerElement = document.createElement("div");
containerElement.id = `${ns}container`;

const trap = createFocusTrap(containerElement, {
  initialFocus: `#${ns}radio--0`,
  allowOutsideClick: true,
});

function buildHtml(containerElement: HTMLDivElement) {
  document.body.appendChild(containerElement);
  containerElement.innerHTML = formHTML(ns, config.locale);
  containerElement.style.display = "block";

  const mergeConfig = { ...config, ...(window as any).unfeed } as typeof config;

  const optionsElement = containerElement.querySelector(
    `#${ns}radio-group`
  ) as HTMLElement;
  optionsElement.innerHTML = mergeConfig.options
    .map(({ icon, label, name, placeholder }, i) => [
      `<input
      class="${ns}radio"
      type="radio"
      id="${ns}radio--${i}"
      name="feedbackType"
      value="${name || label}" 
      data-placeholder="${placeholder || ""}"
      required />
    <label for="${ns}radio--${i}" class="${ns}button ${ns}radio-label">
      ${icon ? `<span class="${ns}radio-icon">${icon}</span>` : ""}${label}
    </label>`,
    ])
    .join("");

  // Customize footer
  if (mergeConfig.footer !== undefined) {
    containerElement.querySelector(`#${ns}footer`)!.innerHTML =
      mergeConfig.footer;
  }
}

function open(target: HTMLElement) {
  buildHtml(containerElement);

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
  document.getElementById(`${ns}close`)!.addEventListener("click", close);
  Array.from(containerElement.getElementsByClassName(`${ns}radio`)).forEach(
    (el) => el.addEventListener("change", changeType)
  );

  document
    .getElementById(`${ns}form`)!
    .addEventListener("submit", (e) => submit(e, target));
}

function close() {
  trap.deactivate();
  containerElement.innerHTML = "";

  containerElement.remove();
  containerElement.removeAttribute("data-unfeed-type");
  containerElement.removeAttribute("data-success");
}

function changeType(e: Event) {
  const inputElement = e.target as HTMLInputElement;
  containerElement.setAttribute("data-unfeed-type", inputElement.value);

  const feedback = document.getElementById(`${ns}message`) as HTMLElement;
  feedback.setAttribute("placeholder", inputElement.dataset.placeholder || "");
  feedback.focus();
}

function submit(e: Event, buttonElement: HTMLElement) {
  e.preventDefault();
  const target = e.target as HTMLFormElement;

  // Merge latest values from dataset to config
  const dataset = buttonElement.dataset as Record<string, string>;
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
    config.disableErrorAlert
      ? console.error("Unfeed: No URL provided")
      : alert("Could not send feedback: No URL provided");
    return;
  }

  const submitElement = document.getElementById(`${ns}submit`)!;
  submitElement.setAttribute("disabled", "");
  submitElement.innerHTML = config.locale.submitLoadingText;

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
      config.disableErrorAlert
        ? console.error("Unfeed:", e)
        : alert(`Could not send feedback: ${e.message}`);
    });
  return false;
}

const unfeed = { init, open, changeType, close, submit, config };
(window as any).unfeed = unfeed;

export default unfeed;
