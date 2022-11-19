type UnfeedConfig = {
  url: string;
  user: Record<any, any>;
  disableErrorAlert: boolean;
  context?: string;
  footer?: string;
  payload?: Record<string, string>;
  locale?: typeof defaultLocale;
};
export const config: UnfeedConfig = {
  url: "",
  user: {},
  disableErrorAlert: false,
  // Spread user config when loaded
  locale: (window as any).unfeed?.locale,
  ...(window as any).unfeed?.config,
};

export const ns = "unfeed__";

const defaultLocale = {
  ns,
  title: "What's on your mind?",
  issueLabel: "Issue",
  ideaLabel: "Idea",
  otherLabel: "Other",
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
} as const;

// Merge default locale with config
export const locale = {
  ...defaultLocale,
  ...config.locale,
  placeholder: {
    ...defaultLocale.placeholder,
    ...config.locale?.placeholder,
  },
} as const;
