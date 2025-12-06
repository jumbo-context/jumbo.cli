import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ValuePropositionAdded } from "../../../../domain/project-knowledge/value-propositions/add/ValuePropositionAddedEvent.js";
import { IValuePropositionAddedProjector } from "./IValuePropositionAddedProjector.js";

/**
 * Event handler for ValuePropositionAdded event.
 *
 * Application layer handler that orchestrates projection updates
 * when a value proposition is added. Subscribes to ValuePropositionAdded via event bus.
 */
export class ValuePropositionAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IValuePropositionAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const valuePropositionAddedEvent = event as ValuePropositionAdded;
    await this.projector.applyValuePropositionAdded(valuePropositionAddedEvent);
  }
}
