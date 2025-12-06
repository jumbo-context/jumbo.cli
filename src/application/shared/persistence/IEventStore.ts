import { BaseEvent } from "../../../domain/shared/BaseEvent";

export interface IEventStore {
  append(event: BaseEvent & Record<string, any>): Promise<AppendResult>;
  readStream(streamId: string): Promise<BaseEvent[]>;
  getAllEvents(): Promise<BaseEvent[]>;
}

export interface AppendResult {
  nextSeq: number;
}
