import React from "react";
import { Box, Text } from "ink";
import chalk from "chalk";

/**
 * Props for DotGrid component
 */
interface DotGridProps {
	width: number;
	height: number;
	spacing?: number;
	dotChar?: string;
}

/**
 * Simple Dot Grid Background
 *
 * Clean, evenly-spaced dots with subtle gradient
 */
export const DotGrid: React.FC<DotGridProps> = ({
	width,
	height,
	spacing = 3,
	dotChar = "·",
}) => {
	const lines: string[] = [];

	for (let y = 0; y < height; y++) {
		let line = "";

		for (let x = 0; x < width; x++) {
			// Only place dots at spacing intervals
			if (x % spacing === 0 && y % spacing === 0) {
				// Subtle gradient from top (dim) to bottom (brighter)
				const gradientFactor = y / height; // 0 at top, 1 at bottom
				const r = Math.round(30 + gradientFactor * 30); // 30 to 60
				const g = Math.round(60 + gradientFactor * 40); // 60 to 100
				const b = Math.round(100 + gradientFactor * 40); // 100 to 140

				line += chalk.rgb(r, g, b)(dotChar);
			} else {
				line += " ";
			}
		}

		lines.push(line);
	}

	return (
		<Box flexDirection="column">
			{lines.map((line, i) => (
				<Text key={i}>{line}</Text>
			))}
		</Box>
	);
};
