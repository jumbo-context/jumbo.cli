/**
 * AudienceRemoved Event
 *
 * Emitted when an audience is removed from the project.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface AudienceRemoved extends BaseEvent {
  readonly type: "AudienceRemoved";
  readonly payload: {
    readonly name: string; // Captured for event history
    readonly removedReason?: string; // Optional: why it was removed
  };
}
