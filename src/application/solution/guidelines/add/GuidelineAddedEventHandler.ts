import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { GuidelineAdded } from "../../../../domain/solution/guidelines/add/GuidelineAddedEvent.js";
import { IGuidelineAddedProjector } from "./IGuidelineAddedProjector.js";

/**
 * Event handler for GuidelineAddedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a new guideline is added. Subscribes to GuidelineAddedEvent via event bus.
 */
export class GuidelineAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGuidelineAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const guidelineAddedEvent = event as GuidelineAdded;
    await this.projector.applyGuidelineAdded(guidelineAddedEvent);
  }
}
