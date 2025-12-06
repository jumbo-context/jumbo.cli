import { ValidationRule, ValidationResult } from "../../../shared/validation/ValidationRule.js";
import { ArchitectureErrorMessages, ArchitectureLimits, formatErrorMessage } from "../Constants.js";

export class DataFlowMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = ArchitectureLimits.DATA_FLOW_MAX_LENGTH) {}

  validate(dataFlow: string): ValidationResult {
    const isValid = dataFlow.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(ArchitectureErrorMessages.DATA_FLOW_TOO_LONG, { max: this.maxLength })],
    };
  }
}

export const DATA_FLOW_RULES = [
  new DataFlowMaxLengthRule(),
];
