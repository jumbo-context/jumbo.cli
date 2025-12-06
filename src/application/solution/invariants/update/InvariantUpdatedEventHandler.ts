import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { InvariantUpdated } from "../../../../domain/solution/invariants/update/InvariantUpdatedEvent.js";
import { IInvariantUpdatedProjector } from "./IInvariantUpdatedProjector.js";

/**
 * Event handler for InvariantUpdatedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when an invariant is updated. Subscribes to InvariantUpdatedEvent via event bus.
 */
export class InvariantUpdatedEventHandler implements IEventHandler {
  constructor(private readonly projector: IInvariantUpdatedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const invariantUpdatedEvent = event as InvariantUpdated;
    await this.projector.applyInvariantUpdated(invariantUpdatedEvent);
  }
}
