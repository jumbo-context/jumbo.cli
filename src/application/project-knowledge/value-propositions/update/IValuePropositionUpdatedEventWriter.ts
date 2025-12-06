/**
 * Port interface for writing ValuePropositionUpdated events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { ValuePropositionUpdated } from "../../../../domain/project-knowledge/value-propositions/update/ValuePropositionUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IValuePropositionUpdatedEventWriter {
  /**
   * Appends a ValuePropositionUpdated event to the event store.
   */
  append(event: ValuePropositionUpdated): Promise<AppendResult>;

  /**
   * Reads all events for a value proposition aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
