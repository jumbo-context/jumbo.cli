import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { DecisionReversed } from "../../../../domain/solution/decisions/reverse/DecisionReversedEvent.js";
import { IDecisionReversedProjector } from "./IDecisionReversedProjector.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionReversed events.
 * Subscribes to events via event bus.
 */
export class DecisionReversedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDecisionReversedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionReversedEvent = event as DecisionReversed;
    await this.projector.applyDecisionReversed(decisionReversedEvent);
  }
}
