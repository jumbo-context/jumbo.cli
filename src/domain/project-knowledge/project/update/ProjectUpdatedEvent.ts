/**
 * ProjectUpdated Event
 *
 * Emitted when a project's details are updated.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface ProjectUpdated extends BaseEvent {
  readonly type: "ProjectUpdated";
  readonly payload: {
    readonly purpose?: string | null;
    readonly boundaries?: string[];
  };
}
