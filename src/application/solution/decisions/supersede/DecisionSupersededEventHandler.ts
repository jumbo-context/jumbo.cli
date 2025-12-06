import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { DecisionSuperseded } from "../../../../domain/solution/decisions/supersede/DecisionSupersededEvent.js";
import { IDecisionSupersededProjector } from "./IDecisionSupersededProjector.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionSuperseded events.
 * Subscribes to events via event bus.
 */
export class DecisionSupersededEventHandler implements IEventHandler {
  constructor(private readonly projector: IDecisionSupersededProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionSupersededEvent = event as DecisionSuperseded;
    await this.projector.applyDecisionSuperseded(decisionSupersededEvent);
  }
}
