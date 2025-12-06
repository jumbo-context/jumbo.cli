/**
 * ComponentDeprecated Event
 *
 * Emitted when a component is marked as deprecated.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { ComponentStatusValue } from "../Constants.js";

export interface ComponentDeprecated extends BaseEvent {
  readonly type: "ComponentDeprecated";
  readonly payload: {
    readonly reason: string | null;
    readonly status: ComponentStatusValue;
  };
}
