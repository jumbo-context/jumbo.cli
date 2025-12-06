/**
 * RemoveInvariant Command
 *
 * Command to remove an invariant from project knowledge.
 */

import { UUID } from "../../../../domain/shared/BaseEvent.js";

export interface RemoveInvariantCommand {
  readonly invariantId: UUID;
}
