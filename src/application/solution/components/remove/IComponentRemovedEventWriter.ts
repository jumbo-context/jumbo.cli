import { ComponentRemoved } from "../../../../domain/solution/components/remove/ComponentRemovedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IComponentRemovedEventWriter {
  append(event: ComponentRemoved): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
