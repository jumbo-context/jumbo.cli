import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

export interface InactiveOnlyRelationNodeFinding {
  readonly entityType: EntityTypeValue;
  readonly entityId: string;
  readonly lifecycleState: string;
  readonly relationIds: readonly string[];
}
