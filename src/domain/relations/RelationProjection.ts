// Re-export from Relation.ts for backward compatibility
// TODO: Remove this file after all consumers are migrated to Relation.ts
export { Relation, RelationState, RelationEvent } from "./Relation.js";

// Provide backward-compatible RelationProjection alias
import { Relation } from "./Relation.js";
export const RelationProjection = {
  apply: Relation.apply,
  rehydrate: Relation.rehydrate,
};
