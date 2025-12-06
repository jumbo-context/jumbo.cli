import { ComponentDeprecated } from "../../../../domain/solution/components/deprecate/ComponentDeprecatedEvent.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { AppendResult } from "../../../shared/persistence/IEventStore.js";

export interface IComponentDeprecatedEventWriter {
  append(event: ComponentDeprecated): Promise<AppendResult>;
  readStream(aggregateId: string): Promise<BaseEvent[]>;
}
