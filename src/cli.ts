#!/usr/bin/env node

/**
 * Jumbo CLI Entry Point
 *
 * Minimal entry point that uses the Host pattern for infrastructure lifecycle.
 * All composition and wiring is encapsulated in infrastructure layer.
 *
 * Flow:
 * 1. Get version (lightweight, no infrastructure)
 * 2. Determine if infrastructure is needed
 * 3. If needed: Host → HostBuilder → Container
 * 4. AppRunner handles routing and execution
 */

import path from "path";
import fs from "fs-extra";
import { Host } from "./infrastructure/host/Host.js";
import { AppRunner } from "./presentation/cli/AppRunner.js";
import { CliVersionReader } from "./infrastructure/cli-metadata/query/CliVersionReader.js";
import { IApplicationContainer } from "./application/host/IApplicationContainer.js";

/**
 * Determines if the invocation requires full infrastructure.
 *
 * Infrastructure is needed for:
 * - Banner command with existing project (to show project info)
 * - Command execution (except subcommand help)
 *
 * Infrastructure is NOT needed for:
 * - Root --help
 * - --version
 * - Banner command without existing project
 * - Subcommand --help
 */
async function needsInfrastructure(argv: string[]): Promise<boolean> {
  const jumboRoot = path.join(process.cwd(), ".jumbo");

  // Bare 'jumbo' command - needs infra only if project exists
  if (argv.length === 2) {
    return fs.pathExists(jumboRoot);
  }

  // Root --help or --version
  const isExplicitHelp = 
    (argv.includes("--help") || argv.includes("-h")) 
    && argv.length === 3;

  const isVersion = 
    argv.includes("--version") 
    || argv.includes("-v");

  if (isExplicitHelp || isVersion) {
    return false;
  }

  // Subcommand --help
  const isSubcommandHelp =
    (argv.includes("--help") || argv.includes("-h")) 
    && argv.length > 3;

  if (isSubcommandHelp) {
    return false;
  }

  // All other commands need infrastructure.
  // Commands like 'project init' need infrastructure even without
  // an existing .jumbo directory - the Host will create it.
  return true;
}

async function main(): Promise<void> {
  // Step 1: Get version (lightweight, no infrastructure needed)
  const versionReader = new CliVersionReader();
  const version = versionReader.getVersion().version;

  // Step 2: Determine if we need full infrastructure
  const argv = process.argv;
  const requiresInfra = await needsInfrastructure(argv);

  // Step 3: Build container if needed
  let container: IApplicationContainer | null = null;

  if (requiresInfra) {
    const jumboRoot = path.join(process.cwd(), ".jumbo");
    const host = new Host(jumboRoot);
    const builder = host.createBuilder();
    container = await builder.build();
  }

  // Step 4: Run the application
  const appRunner = new AppRunner(version, container);
  await appRunner.run();
}

main();
