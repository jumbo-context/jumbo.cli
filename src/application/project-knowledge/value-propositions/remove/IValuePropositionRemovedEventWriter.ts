/**
 * Port interface for writing ValuePropositionRemoved events.
 * Infrastructure layer will implement this with FsEventStore.
 */

import { ValuePropositionRemoved } from "../../../../domain/project-knowledge/value-propositions/remove/ValuePropositionRemovedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IValuePropositionRemovedEventWriter {
  /**
   * Appends a ValuePropositionRemoved event to the event store.
   */
  append(event: ValuePropositionRemoved): Promise<AppendResult>;

  /**
   * Reads all events for a value proposition aggregate.
   */
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
