import { ValidationRule, ValidationResult } from "../../../shared/validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import { GoalStatus, GoalErrorMessages, formatErrorMessage } from "../Constants.js";

/**
 * Validates that a goal can be added (defined for the first time).
 * A goal can only be added if its version is 0 (never been defined before).
 */
export class CanAddRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    const isValid = state.version === 0;
    return {
      isValid,
      errors: isValid ? [] : [GoalErrorMessages.ALREADY_DEFINED],
    };
  }
}

/**
 * Validates that a goal can be started (transition to 'doing' status).
 * A goal can be started if it's in 'to-do' or 'doing' (idempotent) status.
 * Cannot start a goal that is blocked or completed.
 */
export class CanStartRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.BLOCKED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_START_BLOCKED],
      };
    }

    if (state.status === GoalStatus.COMPLETED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_START_COMPLETED],
      };
    }

    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be completed.
 * A goal can only be completed if it has been started (in 'doing' or 'blocked' status).
 * Cannot complete a goal that hasn't been started or is already completed.
 */
export class CanCompleteRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.TODO) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.NOT_STARTED],
      };
    }

    if (state.status === GoalStatus.COMPLETED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.ALREADY_COMPLETED],
      };
    }

    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be reset (transition back to 'to-do' status).
 * A goal can be reset from 'doing' or 'completed' status.
 * Cannot reset a blocked goal (to preserve blocker context) or one already in 'to-do'.
 */
export class CanResetRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.BLOCKED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_RESET_BLOCKED],
      };
    }

    if (state.status === GoalStatus.TODO) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.ALREADY_TODO],
      };
    }

    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be updated.
 * A goal cannot be updated if it's completed.
 */
export class CanUpdateRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.COMPLETED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_UPDATE_COMPLETED],
      };
    }

    return { isValid: true, errors: [] };
  }
}

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
