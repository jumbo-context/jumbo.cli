/**
 * AudienceAdded Event
 *
 * Emitted when a target audience is added to the project.
 * This is the first event in the Audience aggregate's lifecycle.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { AudiencePriorityType } from "../Constants.js";

export interface AudienceAdded extends BaseEvent {
  readonly type: "AudienceAdded";
  readonly payload: {
    readonly name: string;
    readonly description: string;
    readonly priority: AudiencePriorityType;
  };
}
