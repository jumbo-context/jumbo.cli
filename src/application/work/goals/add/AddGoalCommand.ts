/**
 * Command to define a new goal.
 * Represents the user's intent to create a goal aggregate.
 *
 * Note: goalId is NOT included - the handler owns ID generation
 * as part of orchestration (Clean Architecture principle).
 */
export interface AddGoalCommand {
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn?: string[];
  readonly scopeOut?: string[];
  readonly boundaries?: string[];
}
