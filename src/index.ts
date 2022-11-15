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
  locale?: typeof defaultLocale;
};
const config: UnfeedConfig = {
  url: "",
  user: {},
  disableErrorAlert: false,
  // Spread user config when loaded
  locale: (window as any).unfeed?.locale,
  ...(window as any).unfeed?.config,
};

const defaultLocale = {
  ns: "unfeed",
  title: "What's on your mind?",
  issueIcon: "&#128064;", // 👀 (https://emojiguide.org/eyes)
  ideaIcon: "&#128161;", // 💡 (https://emojiguide.org/light-bulb)
  otherIcon: "&#128173;", // 💭 (https://emojiguide.org/thought-balloon)
  placeholder: {
    issue: "I'm having an issue with..",
    idea: "I think..",
    other: "I'd like to see..",
  },
  submitText: "Send",
  submitLoadingText: "Sending..",
  thankyouText: "Thanks for your feedback!",
};

// Merge default locale with config
const locale = {
  ...defaultLocale,
  ...config.locale,
  placeholder: {
    ...defaultLocale.placeholder,
    ...config.locale?.placeholder,
  },
};

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
    if (dataset.unfeedFooter !== undefined)
      config.footer = dataset.unfeedFooter;

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
containerElement.id = "unfeed__container";

const trap = createFocusTrap(containerElement, {
  initialFocus: "#unfeed__radio--issue",
  allowOutsideClick: true,
});

function renderHtml(containerElement: HTMLDivElement) {
  document.body.appendChild(containerElement);
  containerElement.innerHTML = formHTML(locale);
  containerElement.style.display = "block";

  // Customize footer
  if (config.footer !== undefined) {
    containerElement.querySelector("#unfeed__footer")!.innerHTML =
      config.footer;
  }
}

function open(target: HTMLElement) {
  renderHtml(containerElement);

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
  const value = (e.target as HTMLInputElement)
    .value as keyof typeof locale.placeholder;
  containerElement.setAttribute("data-unfeed-type", value);

  const feedback = document.getElementById("unfeed__message") as HTMLElement;
  feedback.setAttribute("placeholder", locale.placeholder[value]);
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

  const submitElement = document.getElementById("unfeed__submit")!;
  submitElement.setAttribute("disabled", "");
  submitElement.innerHTML = locale.submitLoadingText;

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
