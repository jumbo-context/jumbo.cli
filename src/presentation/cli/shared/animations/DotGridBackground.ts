/**
 * Dot Grid Background with Gradient Shimmer
 *
 * Creates an ASCII dot grid with animated color gradient for banner backgrounds.
 * Uses ANSI RGB colors for smooth gradient transitions.
 */

import chalk from "chalk";

/**
 * Configuration for dot grid background
 */
export interface DotGridConfig {
  /** Width of the grid in characters */
  width: number;

  /** Height of the grid in lines */
  height: number;

  /** Dot character to use (default: '·') */
  dotChar?: string;

  /** Base color for dots (dim) */
  baseColor?: [number, number, number];

  /** Shimmer highlight color (bright) */
  shimmerColor?: [number, number, number];

  /** Number of animation frames */
  frameCount?: number;

  /** Spacing between dots (1 = every char, 2 = every other char) */
  spacing?: number;

  /** Width of the shimmer band in characters */
  shimmerBandWidth?: number;
}

/**
 * Default colors for shimmer effect
 */
const DEFAULT_BASE_COLOR: [number, number, number] = [40, 60, 80];      // Dim blue-gray
const DEFAULT_SHIMMER_COLOR: [number, number, number] = [0, 255, 255];  // Bright cyan

/**
 * Check if a point (x, y) is within the diagonal shimmer band
 */
function isInShimmerBand(
  x: number,
  y: number,
  bandCenter: number,
  bandWidth: number,
  height: number
): boolean {
  // Create a diagonal band that moves from left to right
  // The band position is based on x coordinate, with y adding diagonal offset
  const diagonalOffset = (y / height) * bandWidth;
  const bandStart = bandCenter - bandWidth / 2 + diagonalOffset;
  const bandEnd = bandCenter + bandWidth / 2 + diagonalOffset;

  return x >= bandStart && x <= bandEnd;
}

/**
 * Generate a single frame of the dot grid
 */
function generateDotGridFrame(
  config: Required<DotGridConfig>,
  bandCenter: number
): string[] {
  const { width, height, dotChar, baseColor, shimmerColor, spacing, shimmerBandWidth } = config;
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";

    for (let x = 0; x < width; x++) {
      // Only place dots at spacing intervals
      if (x % spacing === 0 && y % spacing === 0) {
        // Check if this dot is in the shimmer band
        const inBand = isInShimmerBand(x, y, bandCenter, shimmerBandWidth, height);

        // Use shimmer color if in band, otherwise use base color
        const [r, g, b] = inBand ? shimmerColor : baseColor;

        // Apply color to dot
        line += chalk.rgb(r, g, b)(dotChar);
      } else {
        line += " ";
      }
    }

    lines.push(line);
  }

  return lines;
}

/**
 * Create shimmer animation frames for dot grid background
 */
export function createDotGridShimmerFrames(config: DotGridConfig): string[][] {
  const fullConfig: Required<DotGridConfig> = {
    width: config.width,
    height: config.height,
    dotChar: config.dotChar ?? "∙",
    baseColor: config.baseColor ?? DEFAULT_BASE_COLOR,
    shimmerColor: config.shimmerColor ?? DEFAULT_SHIMMER_COLOR,
    frameCount: config.frameCount ?? 30,
    spacing: config.spacing ?? 1,
    shimmerBandWidth: config.shimmerBandWidth ?? 20,
  };

  const frames: string[][] = [];
  const { width, shimmerBandWidth } = fullConfig;

  // Band sweeps from left (off-screen) to right (off-screen)
  const startPos = -shimmerBandWidth;
  const endPos = width + shimmerBandWidth;
  const totalDistance = endPos - startPos;

  // Generate frames with band moving left to right
  for (let i = 0; i < fullConfig.frameCount; i++) {
    const progress = i / (fullConfig.frameCount - 1); // 0 to 1
    const bandCenter = startPos + (totalDistance * progress);
    const frame = generateDotGridFrame(fullConfig, bandCenter);
    frames.push(frame);
  }

  return frames;
}

/**
 * Get a static (non-animated) dot grid background
 */
export function getStaticDotGrid(config: DotGridConfig): string[] {
  const fullConfig: Required<DotGridConfig> = {
    width: config.width,
    height: config.height,
    dotChar: config.dotChar ?? "∙",
    baseColor: config.baseColor ?? DEFAULT_BASE_COLOR,
    shimmerColor: config.shimmerColor ?? DEFAULT_SHIMMER_COLOR,
    frameCount: config.frameCount ?? 1,
    spacing: config.spacing ?? 1,
    shimmerBandWidth: config.shimmerBandWidth ?? 20,
  };

  // Static grid with no shimmer band visible (band center off-screen)
  return generateDotGridFrame(fullConfig, -fullConfig.shimmerBandWidth * 2);
}

// ============================================================================
// STARRY SKY BACKGROUND
// ============================================================================

/**
 * Configuration for starry sky background
 */
export interface StarrySkyConfig {
  /** Width of the canvas in characters */
  width: number;

  /** Height of the canvas in lines */
  height: number;

  /** Number of stars to generate */
  starCount?: number;

  /** Star character to use (default: '·') */
  starChar?: string;

  /** Number of animation frames */
  frameCount?: number;

  /** Random seed for reproducible star positions */
  seed?: number;
}

/**
 * Represents a single star
 */
interface Star {
  x: number;
  y: number;
  baseColor: [number, number, number];
  twinklePhase: number;  // Offset for twinkling animation
  twinkleSpeed: number;  // How fast this star twinkles
}

/**
 * Seeded random number generator for reproducible star positions
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Generate a subtle color variation around a base color
 */
function generateStarColor(random: () => number): [number, number, number] {
  // Base colors in the blue/cyan/white spectrum
  const baseHues = [
    [60, 80, 120],    // Dim blue
    [50, 90, 130],    // Slightly brighter blue
    [70, 100, 140],   // Cyan-ish
    [80, 80, 100],    // Neutral blue-gray
    [50, 70, 110],    // Deep blue
  ];

  // Pick a random base hue
  const base = baseHues[Math.floor(random() * baseHues.length)];

  // Add slight variation (±10 in each channel)
  const r = Math.max(0, Math.min(255, base[0] + (random() - 0.5) * 20));
  const g = Math.max(0, Math.min(255, base[1] + (random() - 0.5) * 20));
  const b = Math.max(0, Math.min(255, base[2] + (random() - 0.5) * 20));

  return [Math.round(r), Math.round(g), Math.round(b)];
}

/**
 * Generate random star positions and properties
 */
function generateStars(config: Required<StarrySkyConfig>): Star[] {
  const { width, height, starCount, seed } = config;
  const random = seededRandom(seed);
  const stars: Star[] = [];

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.floor(random() * width),
      y: Math.floor(random() * height),
      baseColor: generateStarColor(random),
      twinklePhase: random() * Math.PI * 2,  // Random starting phase
      twinkleSpeed: 0.05 + random() * 4.95,  // Vary speed between 0.05x and 5x (very wide range)
    });
  }

  return stars;
}

/**
 * Calculate brightness multiplier for a star at a given time
 * Uses a sine wave for smooth twinkling
 */
function getStarBrightness(star: Star, time: number): number {
  // Sine wave oscillates between -1 and 1
  const wave = Math.sin(time * star.twinkleSpeed + star.twinklePhase);

  // Map from [-1, 1] to [0.85, 1.15] for extremely subtle brightness variation
  // Stars barely change - just a gentle individual shimmer
  return 0.85 + (wave + 1) * 0.15;
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
 * Generate a single frame of the starry sky
 */
function generateStarrySkyFrame(
  config: Required<StarrySkyConfig>,
  stars: Star[],
  time: number
): string[] {
  const { width, height, starChar } = config;

  // Create empty canvas
  const canvas: string[][] = Array(height).fill(null).map(() => Array(width).fill(" "));

  // Draw each star
  for (const star of stars) {
    if (star.x >= 0 && star.x < width && star.y >= 0 && star.y < height) {
      const brightness = getStarBrightness(star, time);
      const color = brightenColor(star.baseColor, brightness);
      canvas[star.y][star.x] = chalk.rgb(color[0], color[1], color[2])(starChar);
    }
  }

  // Convert canvas to lines
  return canvas.map(row => row.join(""));
}

/**
 * Create twinkling starry sky animation frames
 */
export function createStarrySkyFrames(config: StarrySkyConfig): string[][] {
  const fullConfig: Required<StarrySkyConfig> = {
    width: config.width,
    height: config.height,
    starCount: config.starCount ?? Math.floor((config.width * config.height) / 20), // ~5% coverage
    starChar: config.starChar ?? "·",
    frameCount: config.frameCount ?? 60,
    seed: config.seed ?? 12345,
  };

  // Generate star positions (only once)
  const stars = generateStars(fullConfig);

  const frames: string[][] = [];

  // Generate frames with twinkling stars
  // Time progresses through MANY cycles (0 to 20π) so stars at different speeds
  // are at completely different phases - this prevents synchronized breathing
  for (let i = 0; i < fullConfig.frameCount; i++) {
    const time = (i / fullConfig.frameCount) * Math.PI * 20;  // 10 complete cycles
    const frame = generateStarrySkyFrame(fullConfig, stars, time);
    frames.push(frame);
  }

  return frames;
}

/**
 * Get a static (non-animated) starry sky background
 */
export function getStaticStarrySky(config: StarrySkyConfig): string[] {
  const fullConfig: Required<StarrySkyConfig> = {
    width: config.width,
    height: config.height,
    starCount: config.starCount ?? Math.floor((config.width * config.height) / 20),
    starChar: config.starChar ?? "·",
    frameCount: 1,
    seed: config.seed ?? 12345,
  };

  const stars = generateStars(fullConfig);
  return generateStarrySkyFrame(fullConfig, stars, 0);
}

/**
 * Create animation with just ONE star slowly pulsing
 * All other stars remain static
 *
 * This generates the static field ONCE, then only modifies ONE character per frame
 */
export function createSingleStarPulseFrames(config: StarrySkyConfig): string[][] {
  const fullConfig: Required<StarrySkyConfig> = {
    width: config.width,
    height: config.height,
    starCount: config.starCount ?? Math.floor((config.width * config.height) / 20),
    starChar: config.starChar ?? "·",
    frameCount: config.frameCount ?? 60,
    seed: config.seed ?? 12345,
  };

  // Generate star positions (only once)
  const stars = generateStars(fullConfig);

  // Generate the static base starfield ONCE
  const baseStarfield = generateStarrySkyFrame(fullConfig, stars, 0);

  // Pick one star to pulse (use middle star for consistency)
  const pulsingStarIndex = Math.floor(stars.length / 2);
  const pulsingstar = stars[pulsingStarIndex];

  const frames: string[][] = [];

  // Generate frames - only ONE character changes per frame
  for (let i = 0; i < fullConfig.frameCount; i++) {
    // Start with the static base (shallow copy is fine, we'll replace one line)
    const frame = [...baseStarfield];

    // Calculate pulse brightness for this frame
    const time = (i / fullConfig.frameCount) * Math.PI * 2;
    const wave = Math.sin(time);
    const brightness = 0.95 + (wave + 1) * 0.05; // 95% to 105%

    // Get the pulsed color for this star
    const color = brightenColor(pulsingstar.baseColor, brightness);
    const pulsedChar = chalk.rgb(color[0], color[1], color[2])(fullConfig.starChar);

    // Replace ONLY the one character at the pulsing star's position
    const lineArray = frame[pulsingstar.y].split('');
    lineArray[pulsingstar.x] = pulsedChar;
    frame[pulsingstar.y] = lineArray.join('');

    frames.push(frame);
  }

  return frames;
}
