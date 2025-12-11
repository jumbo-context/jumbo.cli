/**
 * Banner Content Generator
 *
 * Generates dynamic banner content based on project context and trigger type.
 * Supports three trigger scenarios:
 * - "first-time": Welcome message for new users
 * - "explicit-flag": Full project status when --show-banner used
 * - "returning-user": Contextual guidance for regular usage
 */

import chalk from "chalk";
import { ProjectSummaryView } from "../../../../application/project-knowledge/project/ProjectSummaryView.js";
import { WorkSummaryView } from "../../../../application/work/views/WorkSummaryView.js";

/**
 * Banner trigger type determines content variant
 */
export type BannerTrigger = "first-time" | "explicit-flag" | "returning-user";

/**
 * Combined context for banner display (presentation layer composition)
 */
export interface BannerDisplayContext {
  project: ProjectSummaryView | null;
  work: WorkSummaryView;
}

/**
 * Generate banner content based on context and trigger
 *
 * @param context - Combined project and work context
 * @param trigger - Trigger type determining content variant
 * @returns Array of content lines to display
 */
export function generateBannerContent(
  context: BannerDisplayContext,
  trigger: BannerTrigger
): string[] {
  if (trigger === "first-time") {
    return generateFirstTimeContent();
  } else if (trigger === "explicit-flag") {
    return generateExplicitFlagContent(context);
  } else {
    return generateReturningUserContent(context);
  }
}

/**
 * First-time user content: Welcome + getting started guide
 */
function generateFirstTimeContent(): string[] {
  return [
    "  Hi. I'm Jumbo!",
    " ",
    "  Keep your coding agent on track. Just instruct them to register details of your",
    "  project with me as they surface in your interactions.  I'll collect everything, and",
    "  only serve them pertinent context details when starting work on new goals.",
    "  It's easy. Get started by feeding them this prompt:",
    " ",
    chalk.italic.gray('   "Hi. I\'d like you to track context details about my project using Jumbo."'),
    chalk.italic.gray('   "Please register any relevant information you discover as we work together."'),
    chalk.italic.gray('   "Type \'jumbo --help\' for available commands."'),
    " ",
  ];
}

/**
 * Explicit flag content: Full project status
 *
 * Shows goal counts and blockers. Project name and session status
 * are intentionally omitted as they're already displayed in the animated
 * banner's info line and provide no additional value here.
 */
function generateExplicitFlagContent(context: BannerDisplayContext): string[] {
  const lines: string[] = [];

  // Project not initialized
  if (!context.project) {
    lines.push("  Project not initialized.");
    lines.push(" ");
    lines.push("  Get started: " + chalk.cyan("jumbo project init"));
    lines.push(" ");
    return lines;
  }

  // Goal counts
  lines.push("  " + chalk.gray("Goals:"));
  lines.push(
    `    ${chalk.green(String(context.work.goals.active))} active  ` +
    `${chalk.blue(String(context.work.goals.planned))} planned  ` +
    `${chalk.red(String(context.work.goals.blocked))} blocked  ` +
    `${chalk.gray(String(context.work.goals.completed))} completed`
  );
  lines.push(" ");

  // Highlight blockers if any
  if (context.work.blockers.length > 0) {
    lines.push("  " + chalk.red.bold("⚠️  Blockers requiring attention:"));
    context.work.blockers.forEach((blocker) => {
      lines.push("    " + chalk.red("•") + " " + blocker.objective);
      if (blocker.note && blocker.note !== "No details provided") {
        lines.push("      " + chalk.gray(blocker.note));
      }
    });
    lines.push(" ");
  }

  // Next steps suggestion
  if (context.work.goals.active === 0 && context.work.goals.planned > 0) {
    lines.push("  " + chalk.gray("💡 Ready to start work? Try:"));
    lines.push("     " + chalk.cyan("jumbo goal start --goal-id <id>"));
    lines.push(" ");
  }

  return lines;
}

/**
 * Returning user content: Contextual guidance based on project state
 */
function generateReturningUserContent(context: BannerDisplayContext): string[] {
  const lines: string[] = [];

  // Project not initialized
  if (!context.project) {
    lines.push("  Get started: " + chalk.cyan("jumbo project init"));
    lines.push(" ");
    lines.push("  Type " + chalk.cyan("jumbo --help") + " for available commands");
    lines.push(" ");
    return lines;
  }

  // Project initialized - show concise status
  lines.push("  " + chalk.gray("Project: ") + chalk.white(context.project.name));

  // Session status (concise)
  if (context.work.session && context.work.session.status === "active") {
    lines.push("  " + chalk.gray("Session: ") + context.work.session.focus + " " + chalk.green("(active)"));
  } else if (context.work.session && context.work.session.status === "paused") {
    lines.push("  " + chalk.gray("Session paused. Resume with: ") + chalk.cyan("jumbo session resume"));
  } else {
    lines.push("  " + chalk.gray("Start session: ") + chalk.cyan('jumbo session start --focus "Your focus"'));
  }

  lines.push(" ");

  // Quick goal summary
  if (context.work.goals.active > 0) {
    lines.push(
      `  ${chalk.green(String(context.work.goals.active))} active goal${context.work.goals.active > 1 ? "s" : ""}` +
      (context.work.goals.blocked > 0 ? ` | ${chalk.red(String(context.work.goals.blocked))} blocked` : "")
    );
  } else if (context.work.goals.planned > 0) {
    lines.push(`  ${chalk.blue(String(context.work.goals.planned))} planned goal${context.work.goals.planned > 1 ? "s" : ""} ready to start`);
  } else {
    lines.push("  " + chalk.gray("No goals yet. Add one with: ") + chalk.cyan("jumbo goal add"));
  }

  lines.push(" ");

  // Help hint
  lines.push("  " + chalk.gray("Type ") + chalk.cyan("jumbo --help") + chalk.gray(" for all commands"));
  lines.push(" ");

  return lines;
}
