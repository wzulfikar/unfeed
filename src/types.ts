type FeedbackType = {
  /**
   * Text to show in the form
   */
  label: string;

  /**
   * Emoji icon
   */
  icon?: string;

  /**
   * Text to show in placeholder.
   * Will use empty string if not specified.
   */
  placeholder?: string;

  /**
   * Name of the payload.
   * Will use `label` if not specified
   */
  name?: string;
};

export type FeedbackOptions = Array<FeedbackType>;

export type UnfeedConfig = {
  url: string;
  user: Record<string, string>;
  disableErrorAlert: boolean;
  options: FeedbackOptions;
  locale: Locale;
  features?: string; // Comma-separated string of opt-in features
  context?: string;
  footer?: string;
  payload?: Record<string, string>;
};

export type Locale = {
  title: string;
  submitText: string;
  submitLoadingText: string;
  thankyouText: string;
};
