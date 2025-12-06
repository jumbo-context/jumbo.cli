import { ValidationRule, ValidationResult } from "../../../shared/validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import { GoalStatus, GoalErrorMessages, formatErrorMessage } from "../Constants.js";

/**
 * Validates that a goal can be blocked from its current status.
 * A goal can only be blocked if it's in 'to-do' or 'doing' status.
 * Cannot block a goal that is already blocked or completed.
 */
export class CanBlockRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Valid statuses to block from: TODO, DOING
    // Invalid statuses: BLOCKED (already blocked), COMPLETED (can't block completed)
    const validStatuses: string[] = [GoalStatus.TODO, GoalStatus.DOING];
    const isValid = validStatuses.includes(state.status);

    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(
            GoalErrorMessages.CANNOT_BLOCK_IN_STATUS,
            { status: state.status }
          )],
    };
  }
}

/**
 * Validates that a goal can be unblocked from its current status.
 * A goal can only be unblocked if it's in 'blocked' status.
 * Cannot unblock a goal that is not blocked.
 */
export class CanUnblockRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Can only unblock from BLOCKED status
    const isValid = state.status === GoalStatus.BLOCKED;

    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(
            GoalErrorMessages.CANNOT_UNBLOCK_IN_STATUS,
            { status: state.status }
          )],
    };
  }
}
