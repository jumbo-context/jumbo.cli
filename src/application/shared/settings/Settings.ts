/**
 * Settings type definitions for application-wide configuration.
 * Settings are stored in .jumbo/settings.jsonc file.
 */

export interface QASettings {
  /**
   * Default turn limit for QA iterations on goal completion.
   * When this limit is reached, the goal is automatically completed.
   * Default: 3
   */
  defaultTurnLimit: number;
}

export interface Settings {
  /**
   * QA (Quality Assurance) settings for goal completion
   */
  qa: QASettings;
}
