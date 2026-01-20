import { Settings } from "../../../application/shared/settings/Settings.js";

/**
 * Default settings used when no settings file exists
 * or when creating a new settings file.
 */
export const DEFAULT_SETTINGS: Settings = {
  qa: {
    defaultTurnLimit: 3,
  },
};
