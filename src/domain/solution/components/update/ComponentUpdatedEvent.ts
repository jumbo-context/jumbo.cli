/**
 * ComponentUpdated Event
 *
 * Emitted when an existing component is updated.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { ComponentTypeValue } from "../Constants.js";

export interface ComponentUpdated extends BaseEvent {
  readonly type: "ComponentUpdated";
  readonly payload: {
    readonly description?: string;
    readonly responsibility?: string;
    readonly path?: string;
    readonly type?: ComponentTypeValue;
  };
}
