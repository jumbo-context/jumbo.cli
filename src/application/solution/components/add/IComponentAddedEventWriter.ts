import { ComponentAdded } from "../../../../domain/solution/components/add/ComponentAddedEvent.js";
import { ComponentUpdated } from "../../../../domain/solution/components/update/ComponentUpdatedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IComponentAddedEventWriter {
  append(event: ComponentAdded | ComponentUpdated): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
