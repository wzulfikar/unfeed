type FeedbackType = {
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
  user: Record<any, any>;
  disableErrorAlert: boolean;
  options: FeedbackOptions;
  locale: Locale;
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
