/**
 * Port interface for ensuring settings exist during initialization.
 */
export interface ISettingsInitializer {
  /**
   * Ensure the .jumbo/settings.jsonc file exists with defaults.
   */
  ensureSettingsFileExists(): Promise<void>;
}
