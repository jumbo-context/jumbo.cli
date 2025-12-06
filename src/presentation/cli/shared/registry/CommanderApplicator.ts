/**
 * Commander.js Applicator
 *
 * Applies framework-agnostic command metadata to Commander.js.
 * This is ONE adapter - future: InkApplicator for React TUI.
 */

import { Command } from "commander";
import chalk from "chalk";
import { RegisteredCommand } from "./CommandMetadata.js";
import { normalizePath, extractParts } from "./PathNormalizer.js";
import { Renderer } from "../rendering/Renderer.js";
import { ApplicationContainer } from "../../../../infrastructure/composition/bootstrap.js";

/**
 * Applies registered commands to Commander.js
 */
export class CommanderApplicator {
  private parentCommands: Map<string, Command> = new Map();
  private container?: ApplicationContainer;

  apply(program: Command, commands: RegisteredCommand[], container?: ApplicationContainer): void {
    this.container = container;
    const grouped = this.groupByParent(commands);

    for (const parent of grouped.keys()) {
      this.createParentCommand(program, parent);
    }

    for (const command of commands) {
      this.registerCommand(command);
    }
  }

  private groupByParent(commands: RegisteredCommand[]): Map<string, RegisteredCommand[]> {
    const grouped = new Map<string, RegisteredCommand[]>();
    for (const command of commands) {
      const { parent } = extractParts(command.path);
      if (!grouped.has(parent)) {
        grouped.set(parent, []);
      }
      grouped.get(parent)!.push(command);
    }
    return grouped;
  }

  private createParentCommand(program: Command, parent: string): Command {
    if (!this.parentCommands.has(parent)) {
      const cmd = program.command(parent).description(`Manage ${parent} operations`);
      this.parentCommands.set(parent, cmd);
    }
    return this.parentCommands.get(parent)!;
  }

  private registerCommand(registeredCommand: RegisteredCommand): void {
    const { parent, subcommand } = extractParts(registeredCommand.path);
    const parentCmd = this.parentCommands.get(parent)!;

    // Create command with hidden option if marked
    const commandOptions = registeredCommand.metadata.hidden ? { hidden: true } : {};
    const cmd = parentCmd.command(subcommand, commandOptions).description(registeredCommand.metadata.description);

    // Add options
    registeredCommand.metadata.requiredOptions?.forEach(opt => {
      if (opt.default !== undefined) {
        cmd.requiredOption(opt.flags, chalk.gray(opt.description), opt.default as any);
      } else {
        cmd.requiredOption(opt.flags, chalk.gray(opt.description));
      }
    });

    registeredCommand.metadata.options?.forEach(opt => {
      if (opt.default !== undefined) {
        cmd.option(opt.flags, chalk.gray(opt.description), opt.default as any);
      } else {
        cmd.option(opt.flags, chalk.gray(opt.description));
      }
    });

    // Add examples/related to help
    if (registeredCommand.metadata.examples) {
      cmd.addHelpText('after', '\n' + this.formatExamples(registeredCommand.metadata.examples));
    }

    if (registeredCommand.metadata.related?.length) {
      cmd.addHelpText('after', '\n' + this.formatRelated(registeredCommand.metadata.related));
    }

    // Action handler with error handling and container injection
    cmd.action(async (options) => {
      try {
        // Inject container as second parameter if available
        await registeredCommand.handler(options, this.container);
      } catch (error) {
        const renderer = Renderer.getInstance();
        renderer.error("Command failed", error instanceof Error ? error : String(error));
        process.exit(1);
      }
    });
  }

  private formatExamples(examples: Array<{ command: string; description: string }>): string {
    return 'Examples:\n' + examples.map(ex =>
      `  $ ${ex.command}\n    ${ex.description}\n`
    ).join('\n');
  }

  private formatRelated(related: string[]): string {
    return `Related commands:\n  ${related.map(cmd => `jumbo ${cmd}`).join('\n  ')}\n`;
  }
}
