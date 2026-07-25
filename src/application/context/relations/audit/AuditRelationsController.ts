import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { AuditRelationsRequest } from "./AuditRelationsRequest.js";
import { IRelationNodeCatalog } from "./IRelationNodeCatalog.js";
import { RelationAuditPolicy } from "./RelationAuditPolicy.js";
import { RelationAuditResult } from "./RelationAuditResult.js";

export class AuditRelationsController {
  constructor(
    private readonly nodeCatalog: IRelationNodeCatalog,
    private readonly relationReader: IRelationViewReader,
    private readonly policy: RelationAuditPolicy,
  ) {}

  async handle(request: AuditRelationsRequest): Promise<RelationAuditResult> {
    const [nodes, relations] = await Promise.all([
      this.nodeCatalog.findAll(),
      this.relationReader.findAll({ status: "all" }),
    ]);
    return this.policy.audit(nodes, relations, request);
  }
}
