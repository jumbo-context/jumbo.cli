import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

export interface IsolatedRelationNodeFinding {
  readonly entityType: EntityTypeValue;
  readonly entityId: string;
  readonly lifecycleState: string;
}
