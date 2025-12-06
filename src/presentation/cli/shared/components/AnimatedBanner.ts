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
 * Show animated banner (fade-in effect)
 * Only plays in TTY mode, falls back to static in pipes/non-TTY
 *
 * @param content - Content lines to display after animation
 * @param projectName - Optional project name to display in info box
 */
export async function showAnimatedBanner(content: string[], projectName: string | null = null): Promise<void> {
  // Use the elephant walk animation for the animated banner
  await showElephantWalkBanner(content, projectName);
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

function getSmallElephantLines(): string[] {
  return [
    "███████▓▒▒▒▒▒▒▒▒▓██████",
    "█▓▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▓█",
    "▓▒▒▓▒▒▒█▒▒▒▒▒▒▒█▒▒▒▓▒▒▓",
    "▓▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▓",
    "██▓▓▒▓▓▒▓▒▒▒▒▒▓▒▓▓▒▓▓██",
    "█▓▒▒▒▒▒▒▒▓▒▒▒▓▓▒▒▒▒▒▒▓█",
    "█▓▒▒▒▒▒▒▒▒▓▓▒▒▒▓▒▒▒▒▒▓█",
    "█▓▒▒▒▒▒▒▒▒▒▒▓▓▓▒▒▒▒▒▒▓█",
    "██▓▒▒▒▒▒▒▓███▓▒▒▒▒▒▒▓██",
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
 * Get raw JUMBO text ASCII lines (without color)
 */
function getInfoLines(projectName: string | null): string[] {
  const statusText = projectName
    ? ` Context project: ${projectName}`
    : ' Get started: jumbo project init';
  const statusTextPlain = stripAnsi(statusText);
  const statusTextPadding = (56 - statusTextPlain.length);

  return [
    "        ███ ███    ███ ████      ████ ████████   █████████     ",
    "        ███░███░   ███░█████    █████░███░░░███ ███░░░░░███    ",
    "        ███░███░   ███░███░██  ██░███░████████░░███░    ███░   ",
    "   ███  ███░███░   ███░███░ ████░░███░███░░░███ ███░    ███░   ",
    "    ██████░░ ████████░░███░  ██░░ ███░████████░░ █████████░░   ",
    "     ░░░░░░   ░░░░░░░░  ░░░   ░░   ░░░ ░░░░░░░░   ░░░░░░░░░    ",
    "                                  AI memory like an elephant   ", // Colored grey via chalk.rgb(200,200,200)
    "                                                               ",
    "   ╭─ v.0.1.0-alpha.1 ──────────────────────────────────────╮  ",
    "   │                                                        │  ",
    "   │" + chalk.rgb(255, 210, 61)(statusTextPlain) + " ".repeat(statusTextPadding) + "│", // Colored yellow via chalk.rgb(255, 210, 61)
    "   │                                                        │  ",
    "   ╰────────────────────────────────────────────────────────╯  ",
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
  spacing: number = 5,
  projectName: string | null = null
): string[] {
  const elephant = elephantLines;
  const jumboRaw = getInfoLines(projectName);

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
 * Show animated elephant walk banner
 * Elephant walks from left to right and back, transitioning through colors
 *
 * @param content - Content lines to display after animation completes
 * @param projectName - Optional project name to display in info box
 */
export async function showElephantWalkBanner(content: string[], projectName: string | null = null): Promise<void> {
  if (!process.stdout.isTTY) {
    // Fall back to static banner in non-TTY mode
    console.error("This should not have been called by a non-TTY process.");
    return;
  }

  const width = termWidth();
  const elephant = getElephantLines();
  const elephantWidth = Math.max(...elephant.map(line => line.length));
  const maxOffset = Math.max(0, width - elephantWidth);

  // Generate frames going right (blue -> red gradient)
  const stepCount = maxOffset;
  const anchorColors = [
    { r: 0, g: 72, b: 182 },      // blue
    { r: 1, g: 173, b: 97 },      // green
    { r: 124, g: 197, b: 62 },    // light-green
    { r: 255, g: 210, b: 61 },    // yellow
    { r: 249, g: 124, b: 37 },    // orange
    { r: 232, g: 44, b: 49 },     // red
  ];

  // Forward journey frames
  const forwardFrames: string[][] = [];
  for (let step = 0; step < stepCount; step++) {
    const spaces = " ".repeat(step);
    const progress = step / Math.max(1, stepCount - 1);

    // Interpolate color
    const segmentCount = anchorColors.length - 1;
    const segmentLength = 1 / segmentCount;
    const segmentIndex = Math.min(Math.floor(progress / segmentLength), segmentCount - 1);
    const segmentProgress = (progress - segmentIndex * segmentLength) / segmentLength;

    const color1 = anchorColors[segmentIndex];
    const color2 = anchorColors[segmentIndex + 1];
    const r = Math.round(color1.r + (color2.r - color1.r) * segmentProgress);
    const g = Math.round(color1.g + (color2.g - color1.g) * segmentProgress);
    const b = Math.round(color1.b + (color2.b - color1.b) * segmentProgress);

    // Just elephant, no JUMBO text during forward journey
    forwardFrames.push(elephant.map(line => spaces + chalk.rgb(r, g, b).inverse(line)));
  }

  // Return journey frames (reverse of forward, back to blue)
  const returnFrames = forwardFrames.slice().reverse();

  // JUMBO text reveal frames (after elephant returns to origin)
  const revealSteps = 30;
  const finalElephant = elephant.map(line => chalk.rgb(0, 72, 182).inverse(line));
  const revealFrames: string[][] = [];

  // Use the projectName passed from caller for dynamic info box
  for (let step = 0; step <= revealSteps; step++) {
    const progress = step / revealSteps;
    const combined = combineSideBySide(finalElephant, progress, 5, projectName);
    revealFrames.push(combined);
  }

  const fullFrames = [...forwardFrames, ...returnFrames, ...revealFrames];

  const hrTop = fullWidthLine(1, chalk.gray);
  const hrBottom = fullWidthLine(width, chalk.gray);

  // During animation: show only elephant frames
  // After animation: add dynamic content to the final frame
  const completeFrames = fullFrames.map((elephantFrame, frameIndex) => {
    const isLastFrame = frameIndex === fullFrames.length - 1;

    return [
      "", // Spacer line
      "", // Spacer line
      ...elephantFrame,
      "", // Spacer line
      ...(isLastFrame ? content : []), // Only add content to the final frame
      "", // Spacer line
      "", // Spacer line
    ];
  });

  // Optimized animation playback
  if (process.stdout.isTTY) {
    // Hide cursor and clear screen once
    process.stdout.write('\x1b[?25l'); // Hide cursor
    console.clear();

    // Pre-compute all frame buffers as complete strings
    const frameBuffers = completeFrames.map(frame => frame.join('\n'));

    // Play animation with optimized rendering
    const forwardFrameCount = forwardFrames.length;
    const returnFrameCount = returnFrames.length;
    const walkFrameCount = forwardFrameCount + returnFrameCount;

    for (let i = 0; i < frameBuffers.length; i++) {
      const buffer = frameBuffers[i];
      const currentFrameHeight = completeFrames[i].length;

      process.stdout.write('\x1b[H'); // Move cursor to top
      process.stdout.write(buffer);

      // Different speeds: fast walk, slower reveal
      const isReveal = i >= walkFrameCount;
      const delay = isReveal ? 10 : 0.5;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Use the actual height of the last frame (which includes content)
    const finalFrameHeight = completeFrames[completeFrames.length - 1].length;
    process.stdout.write(`\x1b[${finalFrameHeight}H`); // Move to last line
    console.log(''); // Add newline at the end

    // Show cursor again
    process.stdout.write('\x1b[?25h'); // Show cursor
  }
}

