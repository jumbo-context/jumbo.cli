/**
 * Single Star Pulse Animation
 *
 * Uses cursor positioning to update ONLY one character without redrawing the frame
 */

import chalk from "chalk";
import { getStaticStarrySky, StarrySkyConfig } from "./DotGridBackground.js";

/**
 * ANSI escape codes for cursor positioning
 */
const ANSI = {
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  // Move cursor to specific position (1-indexed)
  moveTo: (row: number, col: number) => `\x1b[${row};${col}H`,
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Apply brightness multiplier to RGB color
 */
function brightenColor(
  color: [number, number, number],
  brightness: number
): [number, number, number] {
  const r = Math.min(255, Math.round(color[0] * brightness));
  const g = Math.min(255, Math.round(color[1] * brightness));
  const b = Math.min(255, Math.round(color[2] * brightness));
  return [r, g, b];
}

/**
 * Configuration for single star pulse animation
 */
export interface SingleStarPulseConfig extends StarrySkyConfig {
  /** Frame delay in milliseconds */
  frameDelay?: number;

  /** Number of frames in one pulse cycle */
  frameCount?: number;

  /** Row of the pulsing star (1-indexed) */
  pulseRow?: number;

  /** Column of the pulsing star (1-indexed) */
  pulseCol?: number;

  /** Base color of the pulsing star */
  pulseColor?: [number, number, number];

  /** Star character */
  starChar?: string;
}

/**
 * Play a single star pulse animation
 *
 * Displays static starfield, then updates only ONE character position
 *
 * Simple version: pulses a star at a specified position
 */
export async function playSingleStarPulse(config: SingleStarPulseConfig): Promise<void> {
  if (!process.stdout.isTTY) {
    // Non-TTY: just show static starfield
    const starfield = getStaticStarrySky(config);
    console.log(starfield.join("\n"));
    return;
  }

  const frameDelay = config.frameDelay ?? 200;
  const frameCount = config.frameCount ?? 120;
  const starChar = config.starChar ?? "·";

  // Use provided position or default to middle of screen
  const pulseRow = config.pulseRow ?? 10;
  const pulseCol = config.pulseCol ?? 40;
  const pulseColor = config.pulseColor ?? [70, 100, 140];

  try {
    // Hide cursor
    process.stdout.write(ANSI.hideCursor);

    // Clear screen and display static starfield ONCE
    console.clear();
    const starfield = getStaticStarrySky(config);
    console.log(starfield.join("\n"));

    // Animate ONLY the one star by updating its position
    for (let i = 0; i < frameCount; i++) {
      // Calculate pulse brightness
      const time = (i / frameCount) * Math.PI * 2;
      const wave = Math.sin(time);
      const brightness = 0.95 + (wave + 1) * 0.05; // 95% to 105%

      // Get pulsed color
      const color = brightenColor(pulseColor, brightness);
      const pulsedChar = chalk.rgb(color[0], color[1], color[2])(starChar);

      // Move cursor to star position (add 3 to row to account for header text)
      // and update ONLY that character
      process.stdout.write(ANSI.moveTo(pulseRow + 3, pulseCol) + pulsedChar);

      // Wait for next frame
      await sleep(frameDelay);
    }

    // Move cursor to bottom and show it
    const endRow = config.height + 5;
    process.stdout.write(ANSI.moveTo(endRow, 1));

  } finally {
    // Always show cursor again
    process.stdout.write(ANSI.showCursor);
    console.log("\n");
  }
}
