/**
 * CLI Command: jumbo session resume
 *
 * Resumes a paused session.
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { ApplicationContainer } from "../../../composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { ResumeSessionCommandHandler } from "../../../../../application/work/sessions/resume/ResumeSessionCommandHandler.js";
import { ResumeSessionCommand } from "../../../../../application/work/sessions/resume/ResumeSessionCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Resume a paused session",
  category: "work",
  requiredOptions: [],
  options: [],
  examples: [
    {
      command: "jumbo session resume",
      description: "Resume the current paused session",
    },
  ],
  related: ["session start", "session pause", "session end"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionResume(options: {}, container: ApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Find paused or active session
    const activeSession = await container.activeSessionReader.findActive();

    if (!activeSession) {
      renderer.error("No active session found. Start a session with 'jumbo session start'");
      process.exit(1);
    }

    // 2. Check if already active (idempotent behavior)
    if (activeSession.status === "active") {
      renderer.info("Session is already active. Continue your work!", {
        sessionId: activeSession.sessionId,
        focus: activeSession.focus,
      });
      return;
    }

    // 3. Create command handler and execute
    const commandHandler = new ResumeSessionCommandHandler(
      container.sessionResumedEventStore,
      container.sessionResumedEventStore,
      container.eventBus
    );
    const command: ResumeSessionCommand = {
      sessionId: activeSession.sessionId,
    };

    await commandHandler.execute(command);

    // Success output
    renderer.success("Session resumed", {
      sessionId: activeSession.sessionId,
      focus: activeSession.focus,
      hint: "Continue your work!",
    });
  } catch (error) {
    renderer.error("Failed to resume session", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
