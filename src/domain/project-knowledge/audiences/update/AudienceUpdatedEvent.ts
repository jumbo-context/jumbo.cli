/**
 * AudienceUpdated Event
 *
 * Emitted when an audience's properties are updated.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { AudiencePriorityType } from "../Constants.js";

export interface AudienceUpdated extends BaseEvent {
  readonly type: "AudienceUpdated";
  readonly payload: {
    readonly name?: string;
    readonly description?: string;
    readonly priority?: AudiencePriorityType;
  };
}
