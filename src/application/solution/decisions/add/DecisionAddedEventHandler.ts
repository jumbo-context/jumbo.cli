import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { DecisionAdded } from "../../../../domain/solution/decisions/add/DecisionAddedEvent.js";
import { IDecisionAddedProjector } from "./IDecisionAddedProjector.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionAdded events.
 * Subscribes to events via event bus.
 */
export class DecisionAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IDecisionAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionAddedEvent = event as DecisionAdded;
    await this.projector.applyDecisionAdded(decisionAddedEvent);
  }
}
