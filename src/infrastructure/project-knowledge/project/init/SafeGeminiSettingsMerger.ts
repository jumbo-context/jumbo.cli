import * as fs from "fs-extra";
import * as path from "path";

/**
 * Gemini CLI settings structure
 * Based on Gemini CLI hooks configuration
 */
export interface GeminiHook {
  type: "command";
  command: string;
}

export interface GeminiSessionStartMatcher {
  matcher: "startup" | "resume" | "clear" | "compact";
  hooks: GeminiHook[];
}

export interface GeminiSettings {
  hooks?: {
    SessionStart?: GeminiSessionStartMatcher[];
  };
}

/**
 * Safe merger for Gemini CLI settings.json files
 *
 * Strategy:
 * - Creates backup before modification
 * - Deep merges objects, deduplicates arrays
 * - Validates JSON before and after merge
 * - Rolls back on error
 * - Idempotent (safe to run multiple times)
 *
 * @example
 * await SafeGeminiSettingsMerger.mergeSettings(projectRoot, {
 *   hooks: {
 *     SessionStart: [{
 *       matcher: "startup",
 *       hooks: [{ type: "command", command: "jumbo session start" }]
 *     }]
 *   }
 * });
 */
export class SafeGeminiSettingsMerger {
  /**
   * Merges new settings into existing .gemini/settings.json
   *
   * @param projectRoot - Root directory of the project
   * @param newSettings - Settings to merge in
   * @throws Error if JSON is malformed or validation fails
   */
  static async mergeSettings(
    projectRoot: string,
    newSettings: GeminiSettings
  ): Promise<void> {
    const settingsPath = path.join(projectRoot, ".gemini", "settings.json");
    const backupPath = `${settingsPath}.backup.${Date.now()}`;

    // Ensure .gemini directory exists
    await fs.ensureDir(path.join(projectRoot, ".gemini"));

    // STEP 1: Create backup if file exists
    if (await fs.pathExists(settingsPath)) {
      await fs.copy(settingsPath, backupPath);
    }

    try {
      // STEP 2: Read existing or use empty object
      let existing: GeminiSettings = {};
      if (await fs.pathExists(settingsPath)) {
        const content = await fs.readFile(settingsPath, "utf-8");
        existing = this.parseAndValidate(content);
      }

      // STEP 3: Merge safely
      const merged = this.deepMerge(existing, newSettings);

      // STEP 4: Validate merged config
      this.validateSettings(merged);

      // STEP 5: Write back with formatting
      await fs.writeFile(
        settingsPath,
        JSON.stringify(merged, null, 2) + "\n",
        "utf-8"
      );

      // STEP 6: Cleanup backup on success (optional - keep for audit trail)
      // await fs.remove(backupPath);
    } catch (error) {
      // STEP 7: Rollback on error
      if (await fs.pathExists(backupPath)) {
        await fs.copy(backupPath, settingsPath, { overwrite: true });
      }
      throw error;
    }
  }

  /**
   * Deep merges two settings objects
   * - Objects are merged recursively
   * - Arrays are deduplicated based on content
   * - Existing user settings are preserved
   */
  private static deepMerge(
    existing: GeminiSettings,
    newSettings: GeminiSettings
  ): GeminiSettings {
    const result: GeminiSettings = { ...existing };

    // Merge hooks
    if (newSettings.hooks) {
      result.hooks = result.hooks ?? {};

      // Merge SessionStart hooks
      if (newSettings.hooks.SessionStart) {
        const existingSessionStart = existing.hooks?.SessionStart ?? [];
        const newSessionStart = newSettings.hooks.SessionStart;

        result.hooks.SessionStart = this.mergeSessionStartHooks(
          existingSessionStart,
          newSessionStart
        );
      }
    }

    return result;
  }

  /**
   * Merges SessionStart hook arrays, deduplicating by command
   */
  private static mergeSessionStartHooks(
    existing: GeminiSessionStartMatcher[],
    additions: GeminiSessionStartMatcher[]
  ): GeminiSessionStartMatcher[] {
    const merged = [...existing];

    for (const newMatcher of additions) {
      // Find existing matcher with same matcher type
      const existingIndex = merged.findIndex(
        (m) => m.matcher === newMatcher.matcher
      );

      if (existingIndex >= 0) {
        // Merge hooks within the same matcher, deduplicating by command
        const existingMatcher = merged[existingIndex];
        const hookMap = new Map<string, GeminiHook>();

        // Add existing hooks
        for (const hook of existingMatcher.hooks) {
          hookMap.set(hook.command, hook);
        }

        // Add new hooks (overwrites if same command)
        for (const hook of newMatcher.hooks) {
          hookMap.set(hook.command, hook);
        }

        merged[existingIndex] = {
          ...existingMatcher,
          hooks: Array.from(hookMap.values()),
        };
      } else {
        // No existing matcher with this type, add it
        merged.push(newMatcher);
      }
    }

    return merged;
  }

  /**
   * Parses JSON string and validates structure
   */
  private static parseAndValidate(jsonString: string): GeminiSettings {
    try {
      const parsed = JSON.parse(jsonString);
      this.validateSettings(parsed);
      return parsed;
    } catch (error) {
      throw new Error(
        `Invalid settings.json: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validates settings structure
   */
  private static validateSettings(settings: GeminiSettings): void {
    // Must be an object
    if (typeof settings !== "object" || settings === null) {
      throw new Error("Settings must be an object");
    }

    // Validate hooks structure if present
    if (settings.hooks !== undefined) {
      if (typeof settings.hooks !== "object" || settings.hooks === null) {
        throw new Error("hooks must be an object");
      }

      if (settings.hooks.SessionStart !== undefined) {
        if (!Array.isArray(settings.hooks.SessionStart)) {
          throw new Error("hooks.SessionStart must be an array");
        }

        for (const matcher of settings.hooks.SessionStart) {
          if (!matcher.matcher || typeof matcher.matcher !== "string") {
            throw new Error("SessionStart matcher must have a matcher property");
          }

          if (!Array.isArray(matcher.hooks)) {
            throw new Error("SessionStart matcher.hooks must be an array");
          }

          for (const hook of matcher.hooks) {
            if (hook.type !== "command") {
              throw new Error("Hook type must be 'command'");
            }

            if (typeof hook.command !== "string") {
              throw new Error("Hook command must be a string");
            }
          }
        }
      }
    }

    // Ensure valid JSON serialization
    try {
      JSON.stringify(settings);
    } catch (error) {
      throw new Error(
        `Settings cannot be serialized to JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
