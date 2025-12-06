import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { GuidelineUpdated } from "../../../../domain/solution/guidelines/update/GuidelineUpdatedEvent.js";
import { IGuidelineUpdatedProjector } from "./IGuidelineUpdatedProjector.js";

/**
 * Event handler for GuidelineUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a guideline is updated. Subscribes to GuidelineUpdatedEvent via event bus.
 */
export class GuidelineUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IGuidelineUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const guidelineUpdatedEvent = event as GuidelineUpdated;
    await this.projector.applyGuidelineUpdated(guidelineUpdatedEvent);
  }
}
