/**
 * Read model for Goal aggregate.
 * Represents the materialized view stored in SQLite.
 */
export interface GoalView {
  readonly goalId: string;
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn: string[];
  readonly scopeOut: string[];
  readonly boundaries: string[];
  readonly status: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly note?: string;  // Optional: populated when blocked or completed
}
