/**
 * AudiencePainUpdated Event
 *
 * Emitted when an audience pain point's details are updated.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface AudiencePainUpdated extends BaseEvent {
  readonly type: "AudiencePainUpdated";
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
  };
}
