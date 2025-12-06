/**
 * User Detection Utilities
 *
 * Detects first-time users vs returning users based on .jumbo directory.
 */

import fs from "fs-extra";
import path from "path";

/**
 * Check if this is the user's first time running Jumbo
 * (no .jumbo directory in current working directory)
 */
export async function isFirstTimeUser(): Promise<boolean> {
  const jumboRoot = path.join(process.cwd(), ".jumbo");
  return !(await fs.pathExists(jumboRoot));
}

/**
 * Check if user is in a Jumbo project (has .jumbo directory)
 */
export async function isJumboProject(): Promise<boolean> {
  const jumboRoot = path.join(process.cwd(), ".jumbo");
  return await fs.pathExists(jumboRoot);
}

/**
 * Check if we should show the flashy animated banner
 * - First-time users: YES (no .jumbo directory)
 * - Returning users: NO (show static banner)
 * - Agent mode (non-TTY): NO (suppress banner entirely)
 */
export async function shouldShowAnimatedBanner(): Promise<boolean> {
  // Never animate in non-TTY mode
  if (!process.stdout.isTTY) {
    return false;
  }

  // Animate for first-time users
  return await isFirstTimeUser();
}

/**
 * Get the current project name if project is initialized
 * Returns null if project doesn't exist or hasn't been initialized
 */
export async function getProjectName(): Promise<string | null> {
  const jumboRoot = path.join(process.cwd(), ".jumbo");

  // Quick check: does .jumbo directory exist?
  if (!(await fs.pathExists(jumboRoot))) {
    return null;
  }

  try {
    // Bootstrap infrastructure to access projection store
    const { bootstrap } = await import("../../../../infrastructure/composition/bootstrap.js");
    const container = bootstrap(jumboRoot);

    try {
      // Get project from projection store
      const projectView = await container.projectContextReader.getProject();

      // Return project name if found
      return projectView?.name ?? null;
    } finally {
      // Clean up database connection
      await container.dbConnectionManager.dispose();
    }
  } catch (error) {
    // If any error occurs (db not found, table doesn't exist, etc.), return null
    return null;
  }
}
