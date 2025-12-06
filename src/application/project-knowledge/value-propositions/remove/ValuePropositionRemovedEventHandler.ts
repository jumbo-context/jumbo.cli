import { IEventHandler } from "../../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/shared/BaseEvent.js";
import { ValuePropositionRemoved } from "../../../../domain/project-knowledge/value-propositions/remove/ValuePropositionRemovedEvent.js";
import { IValuePropositionRemovedProjector } from "./IValuePropositionRemovedProjector.js";

/**
 * Event handler for ValuePropositionRemoved event.
 *
 * Application layer handler that orchestrates projection updates
 * when a value proposition is removed. Subscribes to ValuePropositionRemoved via event bus.
 */
export class ValuePropositionRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IValuePropositionRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const valuePropositionRemovedEvent = event as ValuePropositionRemoved;
    await this.projector.applyValuePropositionRemoved(valuePropositionRemovedEvent);
  }
}
