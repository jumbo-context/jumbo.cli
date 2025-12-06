/**
 * DependencyUpdated Event
 *
 * Emitted when a dependency's properties are updated.
 * Supports partial updates (only changed fields in payload).
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { DependencyStatusType } from "../Constants.js";

export interface DependencyUpdated extends BaseEvent {
  readonly type: "DependencyUpdated";
  readonly payload: {
    readonly endpoint?: string | null;
    readonly contract?: string | null;
    readonly status?: DependencyStatusType;
  };
}
