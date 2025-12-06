/**
 * Tests for RelationRemovedEventHandler (projection handler)
 */

import { RelationRemovedEventHandler } from "../../../../src/application/relations/remove/RelationRemovedEventHandler";
import { IRelationRemovedProjector } from "../../../../src/application/relations/remove/IRelationRemovedProjector";
import { RelationRemoved } from "../../../../src/domain/relations/remove/RelationRemovedEvent";
import { RelationEventType, EntityType } from "../../../../src/domain/relations/Constants";

describe("RelationRemovedEventHandler", () => {
  let projector: IRelationRemovedProjector;
  let handler: RelationRemovedEventHandler;

  beforeEach(() => {
    // Mock projector
    projector = {
      applyRelationRemoved: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RelationRemovedEventHandler(projector);
  });

  it("should delegate RelationRemoved event to projector", async () => {
    // Arrange
    const event: RelationRemoved = {
      type: RelationEventType.REMOVED,
      aggregateId: "relation_123",
      version: 2,
      timestamp: new Date().toISOString(),
      payload: {
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal-1",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "component-1",
        relationType: "involves",
        reason: "Goal completed"
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyRelationRemoved).toHaveBeenCalledTimes(1);
    expect(projector.applyRelationRemoved).toHaveBeenCalledWith(event);
  });

  it("should handle RelationRemoved event without reason", async () => {
    // Arrange
    const event: RelationRemoved = {
      type: RelationEventType.REMOVED,
      aggregateId: "relation_456",
      version: 2,
      timestamp: new Date().toISOString(),
      payload: {
        fromEntityType: EntityType.COMPONENT,
        fromEntityId: "comp-1",
        toEntityType: EntityType.DEPENDENCY,
        toEntityId: "dep-1",
        relationType: "uses",
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyRelationRemoved).toHaveBeenCalledTimes(1);
    expect(projector.applyRelationRemoved).toHaveBeenCalledWith(event);
  });
});
