/**
 * Port interface for writing DecisionReversed events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionReversed } from "../../../../domain/solution/decisions/reverse/DecisionReversedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IDecisionReversedEventWriter {
  /**
   * Appends a DecisionReversed event to the event store.
   */
  append(event: DecisionReversed): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
