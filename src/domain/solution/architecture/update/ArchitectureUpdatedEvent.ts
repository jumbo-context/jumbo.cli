/**
 * ArchitectureUpdated Event
 *
 * Emitted when architecture details are updated.
 * Contains partial updates - undefined fields mean no change.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { DataStore } from "../define/ArchitectureDefinedEvent.js";

export interface ArchitectureUpdated extends BaseEvent {
  readonly type: "ArchitectureUpdated";
  readonly payload: {
    readonly description?: string;
    readonly organization?: string;
    readonly patterns?: string[];
    readonly principles?: string[];
    readonly dataFlow?: string | null;
    readonly dataStores?: DataStore[];
    readonly stack?: string[];
  };
}
