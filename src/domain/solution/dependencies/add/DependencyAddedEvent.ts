/**
 * DependencyAdded Event
 *
 * Emitted when a new dependency relationship is recorded.
 * This is the first event in the Dependency aggregate's lifecycle.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface DependencyAdded extends BaseEvent {
  readonly type: "DependencyAdded";
  readonly payload: {
    readonly consumerId: string;
    readonly providerId: string;
    readonly endpoint: string | null;
    readonly contract: string | null;
  };
}
