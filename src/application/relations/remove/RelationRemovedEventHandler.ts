import { IEventHandler } from "../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../domain/shared/BaseEvent.js";
import { RelationRemoved } from "../../../domain/relations/remove/RelationRemovedEvent.js";
import { IRelationRemovedProjector } from "./IRelationRemovedProjector.js";

/**
 * Event handler for RelationRemoved event.
 *
 * Application layer handler that orchestrates projection updates
 * when a relation is removed. Subscribes to RelationRemoved via event bus.
 */
export class RelationRemovedEventHandler implements IEventHandler {
  constructor(private readonly projector: IRelationRemovedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const relationRemovedEvent = event as RelationRemoved;
    await this.projector.applyRelationRemoved(relationRemovedEvent);
  }
}
