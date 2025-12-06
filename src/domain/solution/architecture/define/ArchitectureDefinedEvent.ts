/**
 * ArchitectureDefined Event
 *
 * Emitted when architecture is defined.
 * This is the first event in the Architecture aggregate's lifecycle.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface DataStore {
  readonly name: string;
  readonly type: string;
  readonly purpose: string;
}

export interface ArchitectureDefined extends BaseEvent {
  readonly type: "ArchitectureDefined";
  readonly payload: {
    readonly description: string;
    readonly organization: string;
    readonly patterns: string[];
    readonly principles: string[];
    readonly dataFlow: string | null;
    readonly dataStores: DataStore[];
    readonly stack: string[];
  };
}
