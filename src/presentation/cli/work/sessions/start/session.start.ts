/**
 * CLI Command: jumbo session start
 *
 * Starts a new working session to track developer activity and provide context.
 */

import { CommandMetadata } from "../../../shared/registry/CommandMetadata.js";
import { StartSessionCommandHandler } from "../../../../../application/work/sessions/start/StartSessionCommandHandler.js";
import { StartSessionCommand } from "../../../../../application/work/sessions/start/StartSessionCommand.js";
import { ApplicationContainer } from "../../../../../infrastructure/composition/bootstrap.js";
import { Renderer } from "../../../shared/rendering/Renderer.js";
import { GetSessionStartContextQueryHandler } from "../../../../../application/work/sessions/get-context/GetSessionStartContextQueryHandler.js";
import { SessionSummaryFormatter } from "./SessionSummaryFormatter.js";
import { PlannedGoalsFormatter } from "./PlannedGoalsFormatter.js";
import { InProgressGoalsFormatter } from "./InProgressGoalsFormatter.js";
import { ProjectContextFormatter } from "./ProjectContextFormatter.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start a new working session",
  category: "work",
  options: [],
  examples: [
    {
      command: 'jumbo session start',
      description: "Start a new working session",
    },
  ],
  related: ["session end", "session pause", "goal start"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 *
 * Responsibilities (presentation layer only):
 * - Call application query to get assembled context data
 * - Render the data for display
 * - Execute command and render result
 *
 * Data assembly is delegated to GetSessionStartContext query in the application layer.
 */
export async function sessionStart(
  options: Record<string, never>,
  container: ApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. QUERY: Get assembled context from application layer
    renderer.info("Loading orientation context...\n");

    const getSessionStartContext = new GetSessionStartContextQueryHandler(
      container.sessionSummaryProjectionStore,
      container.goalStatusReader,
      container.projectContextReader,
      container.audienceContextReader,
      container.audiencePainContextReader,
      container.unprimedBrownfieldQualifier
    );
    const sessionContext = await getSessionStartContext.execute();

    // 2. RENDER: Create formatters and display context
    const projectContextFormatter = new ProjectContextFormatter();
    const sessionSummaryFormatter = new SessionSummaryFormatter();
    const inProgressGoalsFormatter = new InProgressGoalsFormatter();
    const plannedGoalsFormatter = new PlannedGoalsFormatter();

    // Render project context (name, purpose, audiences, pains)
    const projectContextYaml = projectContextFormatter.format(
      sessionContext.project,
      sessionContext.audiences,
      sessionContext.audiencePains
    );
    if (projectContextYaml) {
      renderer.info(projectContextYaml);
    }

    // Render historical context (previous session)
    const sessionContextMarkdown = sessionSummaryFormatter.format(
      sessionContext.latestSessionSummary,
      sessionContext.hasSolutionContext
    );
    renderer.info(sessionContextMarkdown);

    // Render current active work (in-progress goals)
    const inProgressGoalsMarkdown = inProgressGoalsFormatter.format(
      sessionContext.inProgressGoals
    );
    renderer.info(inProgressGoalsMarkdown);

    // Render current state (available goals)
    const plannedGoalsMarkdown = plannedGoalsFormatter.format(
      sessionContext.plannedGoals
    );
    renderer.info(plannedGoalsMarkdown);

    renderer.info("---\n");

    const llmInstruction = [
      "@LLM: Prompt the user for input about what goal to start. ",
      "For example, \"I can see we've recently worked on X, Y, Z. ",
      "Everything was completed without blockers. Goals A, B, and N ",
      "are planned. Do you want to start with A, or something else?\"",
      "IMPORTANT: Run 'jumbo goal start --goal-id <id>' before doing any work!",
    ];
    renderer.info(llmInstruction.join("\n"));

    // 3. COMMAND: Execute session start
    const commandHandler = new StartSessionCommandHandler(
      container.sessionStartedEventStore,
      container.eventBus
    );

    const command: StartSessionCommand = {};
    const result = await commandHandler.execute(command);

    // 4. OUTPUT: Render success
    renderer.success("Session started", {
      sessionId: result.sessionId,
    });
  } catch (error) {
    renderer.error("Failed to start session", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
