import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import chalk from "chalk";

/**
 * Represents a node in the neural network
 */
interface Node {
	x: number;
	y: number;
	color: [number, number, number];
}

/**
 * Represents a connection between two nodes
 */
interface Connection {
	from: number; // Node index
	to: number;   // Node index
	strength: number; // 0-1, affects opacity
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
	let value = seed;
	return () => {
		value = (value * 9301 + 49297) % 233280;
		return value / 233280;
	};
}

/**
 * Generate node color (cyan/blue spectrum)
 */
function generateNodeColor(random: () => number): [number, number, number] {
	const baseHues = [
		[60, 140, 180],  // Cyan
		[50, 120, 170],  // Blue-cyan
		[70, 150, 190],  // Bright cyan
	];

	const base = baseHues[Math.floor(random() * baseHues.length)];
	const r = Math.max(0, Math.min(255, base[0] + (random() - 0.5) * 20));
	const g = Math.max(0, Math.min(255, base[1] + (random() - 0.5) * 20));
	const b = Math.max(0, Math.min(255, base[2] + (random() - 0.5) * 20));

	return [Math.round(r), Math.round(g), Math.round(b)];
}

/**
 * Calculate distance between two nodes
 */
function distance(n1: Node, n2: Node): number {
	const dx = n2.x - n1.x;
	const dy = n2.y - n1.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate nodes for neural network
 */
function generateNodes(
	width: number,
	height: number,
	nodeCount: number,
	seed: number
): Node[] {
	const random = seededRandom(seed);
	const nodes: Node[] = [];

	for (let i = 0; i < nodeCount; i++) {
		nodes.push({
			x: Math.floor(random() * width),
			y: Math.floor(random() * height),
			color: generateNodeColor(random),
		});
	}

	return nodes;
}

/**
 * Generate connections between nearby nodes
 */
function generateConnections(
	nodes: Node[],
	maxDistance: number,
	random: () => number
): Connection[] {
	const connections: Connection[] = [];

	for (let i = 0; i < nodes.length; i++) {
		for (let j = i + 1; j < nodes.length; j++) {
			const dist = distance(nodes[i], nodes[j]);

			if (dist < maxDistance) {
				// Closer nodes = stronger connection
				const strength = 1 - (dist / maxDistance);

				// Randomly skip some connections for variety
				if (random() > 0.3) {
					connections.push({ from: i, to: j, strength });
				}
			}
		}
	}

	return connections;
}

/**
 * Draw a simple line between two points
 */
function drawLine(
	canvas: string[][],
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	char: string
): void {
	// Simple line drawing (Bresenham's algorithm)
	const dx = Math.abs(x2 - x1);
	const dy = Math.abs(y2 - y1);
	const sx = x1 < x2 ? 1 : -1;
	const sy = y1 < y2 ? 1 : -1;
	let err = dx - dy;

	let x = x1;
	let y = y1;

	while (true) {
		if (y >= 0 && y < canvas.length && x >= 0 && x < canvas[0].length) {
			// Don't overwrite nodes
			if (canvas[y][x] === " ") {
				canvas[y][x] = char;
			}
		}

		if (x === x2 && y === y2) break;

		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			x += sx;
		}
		if (e2 < dx) {
			err += dx;
			y += sy;
		}
	}
}

/**
 * Props for NeuralNetworkBackground component
 */
interface NeuralNetworkBackgroundProps {
	width: number;
	height: number;
	nodeCount?: number;
	connectionDistance?: number;
	seed?: number;
	pulseEnabled?: boolean;
}

/**
 * Neural Network Background Component
 *
 * Renders nodes (neurons) connected by synapses
 */
export const NeuralNetworkBackground: React.FC<NeuralNetworkBackgroundProps> = ({
	width,
	height,
	nodeCount = 12,
	connectionDistance = 25,
	seed = 42,
	pulseEnabled = false,
}) => {
	// Generate nodes and connections once
	const [nodes] = useState(() => generateNodes(width, height, nodeCount, seed));
	const [connections] = useState(() => {
		const random = seededRandom(seed + 1000);
		return generateConnections(nodes, connectionDistance, random);
	});

	// Track pulse animation state
	const [pulsePhase, setPulsePhase] = useState(0);

	// Animate pulses along connections
	useEffect(() => {
		if (!pulseEnabled) return;

		const interval = setInterval(() => {
			setPulsePhase((prev) => (prev + 0.05) % 1);
		}, 200);

		return () => clearInterval(interval);
	}, [pulseEnabled]);

	// Create canvas
	const canvas: string[][] = Array(height)
		.fill(null)
		.map(() => Array(width).fill(" "));

	// Draw connections first (so nodes appear on top)
	connections.forEach((conn) => {
		const from = nodes[conn.from];
		const to = nodes[conn.to];

		// Dim color for connections
		const brightness = 0.3 + (conn.strength * 0.2);
		const r = Math.round(40 * brightness);
		const g = Math.round(80 * brightness);
		const b = Math.round(120 * brightness);

		const lineChar = chalk.rgb(r, g, b)("·");

		drawLine(canvas, from.x, from.y, to.x, to.y, lineChar);
	});

	// Draw nodes
	nodes.forEach((node) => {
		if (node.x >= 0 && node.x < width && node.y >= 0 && node.y < height) {
			const [r, g, b] = node.color;
			canvas[node.y][node.x] = chalk.rgb(r, g, b)("●");
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
