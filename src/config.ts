import type { FeedbackOptions, Locale, UnfeedConfig } from "./types";

const defaultOptions: FeedbackOptions = [
  {
    icon: "&#128064;", // 👀 (https://emojiguide.org/eyes),
    label: "Issue",
    name: "issue",
    placeholder: "I'm having an issue with..",
  },
  {
    icon: "&#128161;", // 💡 (https://emojiguide.org/light-bulb),
    label: "Idea",
    name: "idea",
    placeholder: "I think..",
  },
  {
    icon: "&#128173;", // 💭 (https://emojiguide.org/thought-balloon),
    label: "Other",
    name: "other",
    placeholder: "I'd like to see..",
  },
];

export const ns = "unfeed__";

const defaultLocale: Locale = {
  title: "What's on your mind?",
  submitText: "Send",
  submitLoadingText: "Sending..",
  thankyouText: "Thanks for your feedback!",
} as const;

export const config: UnfeedConfig = {
  url: "",
  user: {},
  disableErrorAlert: false,
  options: defaultOptions,
  // Spread user config when loaded
  locale: { ...defaultLocale, ...(window as any).unfeed?.locale },
  ...(window as any).unfeed?.config,
};
