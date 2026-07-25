import { RelationNodeCatalogEntry } from "./RelationNodeCatalogEntry.js";

export interface IRelationNodeCatalog {
  findAll(): Promise<RelationNodeCatalogEntry[]>;
}
