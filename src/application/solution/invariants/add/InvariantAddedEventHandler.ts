import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { InvariantAdded } from "../../../../domain/solution/invariants/add/InvariantAddedEvent.js";
import { IInvariantAddedProjector } from "./IInvariantAddedProjector.js";

/**
 * Event handler for InvariantAddedEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when an invariant is added. Subscribes to InvariantAddedEvent via event bus.
 */
export class InvariantAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IInvariantAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const invariantAddedEvent = event as InvariantAdded;
    await this.projector.applyInvariantAdded(invariantAddedEvent);
  }
}
