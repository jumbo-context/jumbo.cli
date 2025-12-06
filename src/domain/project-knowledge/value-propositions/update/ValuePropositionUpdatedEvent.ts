import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a value proposition is updated.
 */
export interface ValuePropositionUpdated extends BaseEvent {
  readonly type: "ValuePropositionUpdated";
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
    readonly benefit?: string;
    readonly measurableOutcome?: string | null;
  };
}
