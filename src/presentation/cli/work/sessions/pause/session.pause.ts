/**
 * CLI Command: jumbo session pause
 *
 * Pauses the current active session.
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { PauseSessionCommandHandler } from "../../../../../application/work/sessions/pause/PauseSessionCommandHandler.js";
import { PauseSessionCommand } from "../../../../../application/work/sessions/pause/PauseSessionCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Pause the current active session",
  category: "work",
  requiredOptions: [],
  options: [],
  examples: [
    {
      command: "jumbo session pause",
      description: "Pause the current active session",
    },
  ],
  related: ["session start", "session resume", "session end"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionPause(options: {}, container: ApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Find active session
    const activeSession = await container.activeSessionReader.findActive();

    if (!activeSession) {
      renderer.error("No active session found. Start a session with 'jumbo session start'");
      process.exit(1);
    }

    // 2. Check if already paused (idempotent behavior)
    if (activeSession.status === "paused") {
      renderer.info("Session is already paused. Resume with 'jumbo session resume'");
      return;
    }

    // 3. Create command handler and execute
    const commandHandler = new PauseSessionCommandHandler(
      container.sessionPausedEventStore,
      container.sessionPausedEventStore,
      container.eventBus
    );
    const command: PauseSessionCommand = {
      sessionId: activeSession.sessionId,
    };

    await commandHandler.execute(command);

    // Success output
    renderer.success("Session paused", {
      sessionId: activeSession.sessionId,
      hint: "Resume with: jumbo session resume",
    });
  } catch (error) {
    renderer.error("Failed to pause session", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
