/**
 * AudiencePainAdded Event
 *
 * Emitted when an audience pain point is added to the project.
 * This is the first event in the AudiencePain aggregate's lifecycle.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface AudiencePainAdded extends BaseEvent {
  readonly type: "AudiencePainAdded";
  readonly payload: {
    readonly title: string;
    readonly description: string;
  };
}
