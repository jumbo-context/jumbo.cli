/**
 * AudiencePainResolved Event
 *
 * Emitted when an audience pain point is marked as resolved.
 * Indicates that the problem has been addressed.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface AudiencePainResolved extends BaseEvent {
  readonly type: "AudiencePainResolved";
  readonly payload: {
    readonly resolutionNotes?: string;
  };
}
