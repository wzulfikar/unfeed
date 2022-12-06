import { computePosition, flip, shift } from "@floating-ui/dom";
import { createFocusTrap } from "focus-trap";

import { config, ns } from "./config";
import { formHTML } from "./form-html";
import formCSS from "./form.css";

const containerElement = document.createElement("div");
containerElement.id = `${ns}container`;

function init() {
  const styleElement = document.createElement("style");
  styleElement.id = `${ns}css`;
  styleElement.innerHTML = formCSS;

  document.head.insertBefore(styleElement, document.head.firstChild);

  document
    .querySelectorAll("[data-unfeed],[data-unfeed-button]")
    .forEach((el) => {
      if (!(el instanceof HTMLElement)) return;

      // Infer config from dataset
      const dataset = el.dataset;
      if (dataset.unfeedFeatures !== undefined) {
        config.features = dataset.unfeedFeatures;
      }
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

      if (dataset.unfeedButton) {
        el.addEventListener("click", (e: Event) =>
          open(e.target as HTMLElement)
        );
      } else {
        buildHtml(containerElement, el);
      }
    });
}
window.addEventListener("load", init);

const trap = createFocusTrap(containerElement, {
  initialFocus: `#${ns}radio--0`,
  allowOutsideClick: true,
});

function buildHtml(
  containerElement: HTMLDivElement,
  parent: HTMLElement,
  getDataset: () => DOMStringMap = () => parent.dataset
) {
  parent.appendChild(containerElement);
  containerElement.innerHTML = formHTML(ns, config.locale);
  containerElement.style.display = "block";
  containerElement
    .querySelector(`#${ns}close`)!
    .addEventListener("click", close);

  const mergeConfig = { ...config, ...(window as any).unfeed } as typeof config;

  // Build options
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

  Array.from(optionsElement.getElementsByClassName(`${ns}radio`)).forEach(
    (el) => el.addEventListener("change", changeType)
  );

  (containerElement as Element)
    .querySelector(`#${ns}form`)!
    .addEventListener("submit", (e) => submit(e, getDataset));

  // Customize footer
  if (mergeConfig.footer !== undefined) {
    containerElement.querySelector(`#${ns}footer`)!.innerHTML =
      mergeConfig.footer;
  }

  // Enable image upload
  if (mergeConfig.features?.includes("upload-image")) {
    const sizeLimitMB = 4;
    const fileLabel = containerElement.querySelector(
      `label[for=${ns}file]`
    ) as HTMLElement;
    fileLabel.style.display = "inherit";
    (
      containerElement.querySelector(`#${ns}file`) as HTMLInputElement
    ).onchange = (evt: any) => {
      const file = evt.target.files[0];
      if (file.size > 1024 * 1024 * sizeLimitMB) {
        alert(
          `Whoops, your image is too large.\nImage size should not exceed ${sizeLimitMB}MB.`
        );
        return;
      }
      fileLabel.dataset.hasFile = "true";
      fileLabel.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
      fileLabel.style.backgroundSize = "cover";
      fileLabel.querySelector("svg")!.style.display = "none";
    };
  }
}

function open(target: HTMLElement) {
  buildHtml(containerElement, document.body, () => target.dataset);

  computePosition(target, containerElement, {
    placement: "bottom",
    middleware: [flip(), shift({ crossAxis: true, padding: 8 })],
    strategy: "fixed",
  }).then(({ x, y }: { x: number; y: number }) => {
    Object.assign(containerElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });
  trap.activate();
}

function close() {
  trap.deactivate();
  containerElement.removeAttribute("data-unfeed-type");
  containerElement.removeAttribute("data-success");

  const parentIsContainer = containerElement.parentElement?.dataset.unfeed;
  if (parentIsContainer) {
    buildHtml(containerElement, containerElement.parentElement);
  } else {
    containerElement.innerHTML = "";
    containerElement.style.display = "none";
  }
}

function changeType(e: Event) {
  const inputElement = e.target as HTMLInputElement;
  containerElement.setAttribute("data-unfeed-type", inputElement.value);

  const feedback = document.getElementById(`${ns}message`) as HTMLElement;
  feedback.setAttribute("placeholder", inputElement.dataset.placeholder || "");
  feedback.focus();
}

async function submit(e: Event, getDataset: () => DOMStringMap) {
  e.preventDefault();
  const target = e.target as HTMLFormElement;

  // Merge latest values from dataset to config
  const dataset = getDataset() as Record<string, string>;
  if (dataset.unfeedName) config.user.name = dataset.unfeedName;
  if (dataset.unfeedEmail) config.user.email = dataset.unfeedEmail;
  if (dataset.unfeedContext) config.context = dataset.unfeedContext;

  // Override url with dataset if provided
  const overrideUrl = dataset.unfeed || dataset.unfeedButton;
  if (overrideUrl) config.url = overrideUrl;

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

  const { feedbackType, message, file } = target.elements as any;
  const data = {
    ...config.user,
    feedbackType: feedbackType.value,
    message: message.value,
    timestamp: Date.now(),
    context: config.context,
    payload: config.payload,
  };

  const fileLabel = document.querySelector(
    `label[for=${ns}file]`
  ) as HTMLElement;
  const hasUpload =
    config.features?.includes("upload-image") &&
    file.value &&
    fileLabel.dataset.hasFile;
  if (hasUpload) {
    (data as any).file = {
      name: file.files[0].name,
      datauri: await new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.readAsDataURL(file.files[0]);
      }),
    };
  }

  fetch(config.url, {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    mode: dataset.unfeedCorsMode as RequestMode | undefined,
    body: JSON.stringify(data),
  })
    .then(() => {
      containerElement.setAttribute("data-success", "");
      (document.getElementById(`${ns}message`) as HTMLInputElement)!.value = "";
    })
    .catch((e) => {
      config.disableErrorAlert
        ? console.error("Unfeed:", e)
        : alert(`Could not send feedback: ${e.message}`);
    })
    .finally(() => {
      submitElement.removeAttribute("disabled");
      submitElement.innerHTML = config.locale.submitText;
    });
  return false;
}

const unfeed = { init, open, changeType, close, submit, config };
(window as any).unfeed = unfeed;

export default unfeed;
