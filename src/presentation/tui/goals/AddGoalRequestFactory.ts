/**
 * AddGoalRequestFactory - Assembles an AddGoalRequest from GoalAuthoringValues.
 *
 * Normalizes optional authoring fields at the presentation-application
 * boundary. Scope arrays are copied without parsing so item content and order
 * stay intact. Shared by the App overlay and GoalsScreen submission paths so
 * the two cannot drift.
 */

import type { AddGoalRequest } from "../../../application/context/goals/add/AddGoalRequest.js";
import type { GoalAuthoringValues } from "./GoalAuthoringFlow.js";

export const AddGoalRequestFactory = {
  create(values: GoalAuthoringValues): AddGoalRequest {
    return {
      title: values.title,
      objective: values.objective,
      successCriteria: [...values.successCriteria],
      scopeIn: optionalArray(values.scopeIn),
      scopeOut: optionalArray(values.scopeOut),
      nextGoalId: optionalText(values.nextGoal),
      previousGoalId: optionalText(values.previousGoal),
      prerequisiteGoals: optionalList(values.prerequisiteGoals),
      branch: optionalText(values.branch),
      worktree: optionalText(values.worktree),
    };
  },
} as const;

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalList(value: string): string[] | undefined {
  const values = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return values.length > 0 ? values : undefined;
}

function optionalArray(values: readonly string[]): string[] | undefined {
  return values.length > 0 ? [...values] : undefined;
}
