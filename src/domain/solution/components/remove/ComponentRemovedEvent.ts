/**
 * ComponentRemoved Event
 *
 * Emitted when a component is removed from the system.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { ComponentStatusValue } from "../Constants.js";

export interface ComponentRemoved extends BaseEvent {
  readonly type: "ComponentRemoved";
  readonly payload: {
    readonly status: ComponentStatusValue;
  };
}
