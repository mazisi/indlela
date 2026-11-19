/** One email Indlela sends (Settings › Email templates); the API's EmailTemplateController::present. */
export interface EmailTemplate {
  type: string;
  label: string;
  description: string;
  /** The placeholders the wording may use, e.g. `{{name}}`. */
  variables: { key: string; description: string }[];
  /** The button added under the message (with its link), if any. */
  buttonText: string | null;
  subject: string;
  body: string;
  /** False for emails with a sign-in code or link: logged without their content. */
  storesBody: boolean;
  /** Who gets it, e.g. "The user". */
  directRecipient: string | null;
  isCustomised: boolean;
  updatedAt: string | null;
}

export interface EmailTemplatesPage {
  data: EmailTemplate[];
  mail: { fromName: string; fromAddress: string };
  can: { update: boolean };
}

export interface TemplateInput {
  subject: string;
  body: string;
}
