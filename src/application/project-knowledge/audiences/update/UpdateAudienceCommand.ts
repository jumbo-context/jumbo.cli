/**
 * UpdateAudienceCommand
 *
 * Command to update an existing audience's properties.
 * Supports partial updates - only provide fields that need to change.
 */

import { UUID } from "../../../../domain/shared/BaseEvent.js";
import { AudiencePriorityType } from "../../../../domain/project-knowledge/audiences/Constants.js";

export interface UpdateAudienceCommand {
  readonly audienceId: UUID;
  readonly name?: string;
  readonly description?: string;
  readonly priority?: AudiencePriorityType;
}
