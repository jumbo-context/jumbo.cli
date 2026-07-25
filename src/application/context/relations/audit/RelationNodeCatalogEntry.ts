import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

export interface RelationNodeCatalogEntry {
  readonly entityType: EntityTypeValue;
  readonly entityId: string;
  readonly lifecycleState: string;
  readonly isCurrent: boolean;
}
