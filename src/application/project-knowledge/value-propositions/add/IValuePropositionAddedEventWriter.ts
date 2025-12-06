/**
 * Port interface for writing ValuePropositionAdded events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { ValuePropositionAdded } from "../../../../domain/project-knowledge/value-propositions/add/ValuePropositionAddedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IValuePropositionAddedEventWriter {
  /**
   * Appends a ValuePropositionAdded event to the event store.
   */
  append(event: ValuePropositionAdded): Promise<AppendResult>;

  /**
   * Reads all events for a value proposition aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
