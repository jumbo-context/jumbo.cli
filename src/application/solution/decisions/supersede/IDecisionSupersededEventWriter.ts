/**
 * Port interface for writing DecisionSuperseded events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionSuperseded } from "../../../../domain/solution/decisions/supersede/DecisionSupersededEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IDecisionSupersededEventWriter {
  /**
   * Appends a DecisionSuperseded event to the event store.
   */
  append(event: DecisionSuperseded): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
