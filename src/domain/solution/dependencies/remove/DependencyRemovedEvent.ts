/**
 * DependencyRemoved Event
 *
 * Emitted when a dependency is removed from the project.
 * The dependency status transitions to 'removed'.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface DependencyRemoved extends BaseEvent {
  readonly type: "DependencyRemoved";
  readonly payload: {
    readonly reason: string | null;  // Optional: why it was removed
  };
}
