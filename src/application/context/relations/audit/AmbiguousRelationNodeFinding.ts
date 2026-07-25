import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

export interface AmbiguousRelationNodeFinding {
  readonly entityId: string;
  readonly entityTypes: readonly EntityTypeValue[];
}
