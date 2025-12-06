import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GuidelineUpdatedEvent to the event store.
 * Used by UpdateGuidelineCommandHandler to persist domain events.
 */
export interface IGuidelineUpdatedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
