import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

/**
 * Port interface for writing GuidelineRemovedEvent to the event store.
 * Used by RemoveGuidelineCommandHandler to persist domain events.
 */
export interface IGuidelineRemovedEventWriter {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
}
