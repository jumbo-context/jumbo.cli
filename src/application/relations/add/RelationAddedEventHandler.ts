import { IEventHandler } from "../../shared/messaging/IEventHandler.js";
import { BaseEvent } from "../../../domain/shared/BaseEvent.js";
import { RelationAdded } from "../../../domain/relations/add/RelationAddedEvent.js";
import { IRelationAddedProjector } from "./IRelationAddedProjector.js";

/**
 * Event handler for RelationAdded event.
 *
 * Application layer handler that orchestrates projection updates
 * when a relation is added. Subscribes to RelationAdded via event bus.
 */
export class RelationAddedEventHandler implements IEventHandler {
  constructor(private readonly projector: IRelationAddedProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const relationAddedEvent = event as RelationAdded;
    await this.projector.applyRelationAdded(relationAddedEvent);
  }
}
