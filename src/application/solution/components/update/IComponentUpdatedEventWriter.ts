import { ComponentUpdated } from "../../../../domain/solution/components/update/ComponentUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IComponentUpdatedEventWriter {
  append(event: ComponentUpdated): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
