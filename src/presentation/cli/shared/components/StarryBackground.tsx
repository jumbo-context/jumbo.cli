import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import chalk from "chalk";

/**
 * Represents a single star
 */
interface Star {
	x: number;
	y: number;
	baseColor: [number, number, number];
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
	const baseHues = [
		[60, 80, 120], // Dim blue
		[50, 90, 130], // Slightly brighter blue
		[70, 100, 140], // Cyan-ish
		[80, 80, 100], // Neutral blue-gray
		[50, 70, 110], // Deep blue
	];

	const base = baseHues[Math.floor(random() * baseHues.length)];

	const r = Math.max(0, Math.min(255, base[0] + (random() - 0.5) * 20));
	const g = Math.max(0, Math.min(255, base[1] + (random() - 0.5) * 20));
	const b = Math.max(0, Math.min(255, base[2] + (random() - 0.5) * 20));

	return [Math.round(r), Math.round(g), Math.round(b)];
}

/**
 * Generate random star positions
 */
function generateStars(
	width: number,
	height: number,
	starCount: number,
	seed: number
): Star[] {
	const random = seededRandom(seed);
	const stars: Star[] = [];

	for (let i = 0; i < starCount; i++) {
		stars.push({
			x: Math.floor(random() * width),
			y: Math.floor(random() * height),
			baseColor: generateStarColor(random),
		});
	}

	return stars;
}

/**
 * Props for StarryBackground component
 */
interface StarryBackgroundProps {
	width: number;
	height: number;
	starCount?: number;
	seed?: number;
	pulseEnabled?: boolean;
	pulseStarIndex?: number;
}

/**
 * Starry Background Component
 *
 * Renders a field of stars with optional pulsing animation on one star
 */
export const StarryBackground: React.FC<StarryBackgroundProps> = ({
	width,
	height,
	starCount = Math.floor((width * height) / 15),
	seed = 42,
	pulseEnabled = true,
	pulseStarIndex,
}) => {
	// Generate stars once
	const [stars] = useState(() => generateStars(width, height, starCount, seed));

	// Pick which star pulses (middle star by default)
	const [pulsingStar] = useState(
		pulseStarIndex ?? Math.floor(stars.length / 2)
	);

	// Track pulse brightness (1.0 = normal)
	const [pulseBrightness, setPulseBrightness] = useState(1.0);

	// Animate the pulse
	useEffect(() => {
		if (!pulseEnabled) return;

		const startTime = Date.now();
		const pulseDuration = 24000; // 24 seconds for one complete cycle

		const interval = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const progress = (elapsed % pulseDuration) / pulseDuration;

			// Sine wave from 0.95 to 1.05
			const wave = Math.sin(progress * Math.PI * 2);
			const brightness = 0.95 + (wave + 1) * 0.05;

			setPulseBrightness(brightness);
		}, 200); // Update every 200ms

		return () => clearInterval(interval);
	}, [pulseEnabled]);

	// Create a 2D canvas
	const canvas: string[][] = Array(height)
		.fill(null)
		.map(() => Array(width).fill(" "));

	// Draw each star
	stars.forEach((star, index) => {
		if (star.x >= 0 && star.x < width && star.y >= 0 && star.y < height) {
			const isPulsingstar = index === pulsingStar;
			const brightness = isPulsingstar ? pulseBrightness : 1.0;

			const r = Math.min(255, Math.round(star.baseColor[0] * brightness));
			const g = Math.min(255, Math.round(star.baseColor[1] * brightness));
			const b = Math.min(255, Math.round(star.baseColor[2] * brightness));

			canvas[star.y][star.x] = chalk.rgb(r, g, b)("·");
		}
	});

	// Convert canvas to lines
	const lines = canvas.map((row) => row.join(""));

	return (
		<Box flexDirection="column">
			{lines.map((line, i) => (
				<Text key={i}>{line}</Text>
			))}
		</Box>
	);
};
