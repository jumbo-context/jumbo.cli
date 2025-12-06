import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { DecisionUpdated } from "../../../../domain/solution/decisions/update/DecisionUpdatedEvent.js";
import { IDecisionUpdatedProjector } from "./IDecisionUpdatedProjector.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionUpdated events.
 * Subscribes to events via event bus.
 */
export class DecisionUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDecisionUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionUpdatedEvent = event as DecisionUpdated;
    await this.projector.applyDecisionUpdated(decisionUpdatedEvent);
  }
}
