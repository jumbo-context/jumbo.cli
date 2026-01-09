/**
 * CLI Command: jumbo session end
 *
 * Ends the current active or paused session with a focus summary.
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { EndSessionCommandHandler } from "../../../../../application/work/sessions/end/EndSessionCommandHandler.js";
import { EndSessionCommand } from "../../../../../application/work/sessions/end/EndSessionCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "End the current active session",
  category: "work",
  requiredOptions: [
    {
      flags: "--focus <focus>",
      description: "Summary of what was accomplished",
    },
  ],
  options: [
    {
      flags: "--summary <text>",
      description: "Detailed session summary (optional)",
    },
  ],
  examples: [
    {
      command:
        'jumbo session end --focus "Completed authentication implementation"',
      description: "End session with focus summary",
    },
    {
      command:
        'jumbo session end --focus "Bug fixes" --summary "Fixed 3 critical bugs"',
      description: "End session with detailed summary",
    },
  ],
  related: ["session start", "session pause", "goal complete"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionEnd(
  options: {
    focus: string;
    summary?: string;
  },
  container: ApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new EndSessionCommandHandler(
      container.sessionEndedEventStore,
      container.sessionEndedEventStore,
      container.activeSessionReader,
      container.eventBus
    );

    // 2. Execute command
    const command: EndSessionCommand = {
      focus: options.focus,
      summary: options.summary,
    };

    const result = await commandHandler.execute(command);

    // Success output
    const data: Record<string, string> = {
      sessionId: result.sessionId,
      focus: options.focus,
    };
    if (options.summary) {
      data.summary = options.summary;
    }

    renderer.success("Session ended", data);
  } catch (error) {
    renderer.error("Failed to end session", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
