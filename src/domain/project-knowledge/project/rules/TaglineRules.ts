/**
 * Validation rules for project tagline field.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../../shared/validation/ValidationRule.js";
import {
  ProjectErrorMessages,
  ProjectLimits,
  formatErrorMessage,
} from "../Constants.js";

export class TaglineMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = ProjectLimits.TAGLINE_MAX_LENGTH
  ) {}

  validate(tagline: string): ValidationResult {
    const isValid = tagline.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ProjectErrorMessages.TAGLINE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const TAGLINE_RULES = [new TaglineMaxLengthRule()];
