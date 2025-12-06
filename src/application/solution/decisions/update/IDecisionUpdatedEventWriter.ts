/**
 * Port interface for writing DecisionUpdated events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionUpdated } from "../../../../domain/solution/decisions/update/DecisionUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IDecisionUpdatedEventWriter {
  /**
   * Appends a DecisionUpdated event to the event store.
   */
  append(event: DecisionUpdated): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
