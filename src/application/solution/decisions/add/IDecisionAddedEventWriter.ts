/**
 * Port interface for writing DecisionAdded events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { DecisionAdded } from "../../../../domain/solution/decisions/add/DecisionAddedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IDecisionAddedEventWriter {
  /**
   * Appends a DecisionAdded event to the event store.
   */
  append(event: DecisionAdded): Promise<AppendResult>;

  /**
   * Reads all events for a decision aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
