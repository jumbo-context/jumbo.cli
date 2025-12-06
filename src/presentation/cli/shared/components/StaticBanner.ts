/**
 * Jumbo CLI Banner
 *
 * Generates banner lines for rendering by the Renderer.
 * Centers ASCII art + taglines to the current terminal width.
 * Supports both static and animated versions.
 */

import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { centerText } from "../rendering/StyleConfig.js";
import { playAnimation, createFadeInFrames, createElephantWalkFrames } from "../animations/FrameAnimator.js";

function termWidth(): number {
  return process.stdout.isTTY ? process.stdout.columns : 80;
}

function fullWidthLine(width: number, style: (s: string) => string): string {
  return style("_".repeat(width));
}

// AnchorColors: blue(0, 72, 182), green(1, 173, 97), light-green(124, 197, 62), yellow(255, 210, 61), orange(249, 124, 37), red (232, 44, 49)
export function getBannerLines(): string[] {
  const elephant = getElephantLines();
  const jumboRaw = getJumboTextLines();

  // Color the elephant blue (starting color)
  const elephantColored = elephant.map(line => chalk.rgb(0, 72, 182).inverse(line));

  // Color the JUMBO text gray
  const jumboColored = jumboRaw.map(line => chalk.rgb(200, 200, 200)(line));

  // Combine side by side with 5 spaces gap
  const spacer = " ".repeat(5);
  const combined: string[] = [];
  for (let i = 0; i < elephantColored.length; i++) {
    const elephantLine = elephantColored[i];
    const jumboLine = i < jumboColored.length ? jumboColored[i] : "";
    combined.push(elephantLine + spacer + jumboLine);
  }

  const taglines = [
    chalk.gray("AI memory like an elephant."),
    chalk.gray("Context engineering platform for LLM coding agents"),
  ];

  const width = termWidth();
  const hrTop = fullWidthLine(1, chalk.gray);
  const hrBottom = fullWidthLine(width, chalk.gray);

  // Static banner lines
  const lines: string[] = [];
  lines.push(hrTop);
  lines.push(""); // spacer
  lines.push(...combined);
  lines.push(""); // spacer
  lines.push(...taglines);
  lines.push(hrBottom);

  return lines;
}

/**
 * Get raw elephant ASCII lines (without color/centering)
 */
function getElephantLines(): string[] {
  return [
    "██████████▓▒▒▒▒▒▒▒▒▒▓█████████",
    "██▓▒▒▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▓██",
    "█▓▒▒▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▓█",
    "█▓▒▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▒▓█",
    "█▓▒▒▒▓▓▒▒▒█▒▒▒▒▒▒▒▒█▒▒▒▓▓▒▒▒▓█",
    "███▓▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▓███",
    "████▓▓▒▒▓▓▒▓▒▒▒▒▒▒▓▒▓▓▒▒▓▓████",
    "████▓▒▒▒▒▒▒▓▓▒▒▒▒▓▓▒▒▒▒▒▒▓████",
    "███▓▒▒▒▒▒▒▒▒▓▒▒▒▒▓▓▓▒▒▒▒▒▒▓███",
    "███▓▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒▓▒▒▒▒▒▓███",
    "███▓▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▒▒▒▒▒▒▓███",
    "████▓▒▒▒▒▒▒▒▓████▓▒▒▒▒▒▒▒▓████",
    "█████▓▒▒▒▒▒▓███████▓▒▒▒▒▓█████",
    "██████████████████████████████",
  ];
}

/**
 * Get raw JUMBO text ASCII lines (without color)
 */
function getJumboTextLines(): string[] {
  return [
    "                                                               ",
    "        ███ ███    ███ ████      ████ ████████   █████████     ",
    "        ███░███░   ███░█████    █████░███░░░███ ███░░░░░███    ",
    "        ███░███░   ███░███░██  ██░███░████████░░███░    ███░   ",
    "   ███  ███░███░   ███░███░ ████░░███░███░░░███ ███░    ███░   ",
    "    ██████░░ ████████░░███░  ██░░ ███░████████░░ █████████░░   ",
    "     ░░░░░░   ░░░░░░░░  ░░░   ░░   ░░░ ░░░░░░░░   ░░░░░░░░░    ",
    "                                  AI memory like an elephant   ", // Colored grey via chalk.rgb(200,200,200)
    "                                                               ",
  ];
}

/**
 * Combine elephant and JUMBO text side by side
 * @param elephantLines - Colored elephant ASCII lines
 * @param revealProgress - Progress of letter reveal from left to right (0-1)
 *                         0 = nothing visible, 1 = all visible
 * @param spacing - Number of spaces between elephant and text
 */
function combineSideBySide(
  elephantLines: string[],
  revealProgress: number = 1,
  spacing: number = 5
): string[] {
  const elephant = elephantLines;
  const jumboRaw = getJumboTextLines();

  // Smooth left-to-right curtain reveal
  const jumboText = jumboRaw.map((line, lineIndex) => {
    // Line 7 contains the embedded tagline - color it darker grey
    const isTagline = lineIndex === 7;
    const colorFn = isTagline ? chalk.rgb(200, 200, 200) : chalk.rgb(200, 200, 200);

    if (revealProgress >= 1) {
      // Full reveal - show everything
      return colorFn(line);
    } else if (revealProgress <= 0) {
      // Nothing visible
      return " ".repeat(line.length);
    } else {
      // Partial reveal - curtain opening from left to right
      const chars = line.split('');
      const maxCol = chars.length;
      const revealCol = Math.floor(maxCol * revealProgress);

      const revealed = chars.map((char, idx) => {
        // Show characters from left up to revealCol
        return idx < revealCol ? char : ' ';
      });

      return colorFn(revealed.join(''));
    }
  });

  const spacer = " ".repeat(spacing);
  const combined: string[] = [];

  // Elephant is 14 lines, JUMBO text is 8 lines
  // Align tops - pad jumbo text on top if needed, or start at same line
  for (let i = 0; i < elephant.length; i++) {
    const elephantLine = elephant[i];
    const jumboLine = i < jumboText.length ? jumboText[i] : "";
    combined.push(elephantLine + spacer + jumboLine);
  }

  return combined;
}

/**
 * Generate meta content line with project/welcome text and version
 */
function getMetaContentLine(projectName: string | null, width: number): string {
  const leftText = projectName
    ? chalk.bold.white(`Context project: ${projectName}`)
    : chalk.bold.white("Welcome to Jumbo!");
  const rightText = chalk.gray("CLI version: 0.1.0-alpha.1");
  const leftLength = stripAnsi(leftText).length;
  const rightLength = stripAnsi(rightText).length;
  const padding = Math.max(1, width - leftLength - rightLength);
  return leftText + " ".repeat(padding) + rightText;
}

/**
 * Create a bordered welcome box with help text
 */
function createWelcomeBox(projectName: string | null, width: number): string[] {
  const welcomeContent = [];
  const helpText = projectName
    ? "Type 'jumbo --help' for available commands"
    : "Get started: jumbo project init";
  const helpTextPlain = stripAnsi(helpText);
  const boxWidth = width;
  const innerWidth = boxWidth - 2; // Subtract the two border characters
  const textPadding = " ".repeat(Math.max(0, innerWidth - helpTextPlain.length - 2)); // Right padding

  welcomeContent.push(chalk.rgb(155, 233, 248)("╭" + "─".repeat(innerWidth) + "╮"));
  welcomeContent.push(chalk.rgb(155, 233, 248)("│ ") + " ".repeat(innerWidth - 2) + chalk.rgb(155, 233, 248)(" │"));
  welcomeContent.push(chalk.rgb(155, 233, 248)("│ ") + chalk.gray(helpText) + textPadding + chalk.rgb(155, 233, 248)(" │"));
  welcomeContent.push(chalk.rgb(155, 233, 248)("│ ") + " ".repeat(innerWidth - 2) + chalk.rgb(155, 233, 248)(" │"));
  welcomeContent.push(chalk.rgb(155, 233, 248)("╰" + "─".repeat(innerWidth) + "╯"));

  return welcomeContent;
}

/**
 * Show welcome message with dynamic content
 * Displays static banner with pre-generated content lines
 *
 * @param content - Content lines to display (pre-generated by BannerContentGenerator)
 */
export async function showWelcomeMessage(content: string[]): Promise<void> {
  const width = termWidth();

  // Welcome message
  const welcomeLines: string[] = [];

  welcomeLines.push(chalk.rgb(0, 72, 182).bold("Welcome to Jumbo - AI memory like an elephant!"));
  welcomeLines.push(chalk.gray("─".repeat(width)));
  welcomeLines.push(""); // Spacer
  welcomeLines.push(...content); // Use dynamic content passed by caller
  welcomeLines.push(""); // Spacer

  console.log(welcomeLines.join("\n"));
}

