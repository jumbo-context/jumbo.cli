import { RelationNodeReference } from "../get/RelationNodeReference.js";

export interface DanglingRelationFinding {
  readonly relationId: string;
  readonly from: RelationNodeReference;
  readonly to: RelationNodeReference;
  readonly missingEndpoints: readonly RelationNodeReference[];
}
