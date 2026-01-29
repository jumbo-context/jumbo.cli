/**
 * WorkerId - Branded type for worker identity
 *
 * Represents a unique identifier for a worker (LLM agent session).
 * Each terminal/IDE session gets a unique workerId that persists
 * for the lifetime of that session.
 *
 * This is a branded type to ensure type safety and prevent
 * accidental mixing with regular strings.
 */
export type WorkerId = string & { readonly __brand: "WorkerId" };

/**
 * Creates a WorkerId from a string value.
 *
 * @param value - The string value to convert to a WorkerId
 * @returns The branded WorkerId
 */
export function createWorkerId(value: string): WorkerId {
  return value as WorkerId;
}
