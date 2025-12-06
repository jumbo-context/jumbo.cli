import { BaseEvent } from "../../../shared/BaseEvent.js";

/**
 * Emitted when a new value proposition is added to the project.
 */
export interface ValuePropositionAdded extends BaseEvent {
  readonly type: "ValuePropositionAdded";
  readonly payload: {
    readonly title: string;
    readonly description: string;
    readonly benefit: string;
    readonly measurableOutcome: string | null;
  };
}
