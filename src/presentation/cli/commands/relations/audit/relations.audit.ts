import { AuditRelationsRequest } from "../../../../../application/context/relations/audit/AuditRelationsRequest.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import {
  EntityTypeValue,
  RelationAuditCheckValue,
} from "../../../../../domain/relations/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { RelationAuditOutputBuilder } from "./RelationAuditOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Audit relation graph coverage and disconnected context",
  category: "relations",
  options: [
    {
      flags: "-c, --check <checks...>",
      description: "Checks: dangling, isolated, inactive-only, ambiguous-id, summary (all by default)",
    },
    {
      flags: "--entity-type <type>",
      description: "Filter findings and summary data by relation endpoint entity type",
    },
  ],
  examples: [
    { command: "jumbo relations audit", description: "Run every relation graph audit check" },
    { command: "jumbo relations audit --check dangling isolated", description: "Find missing endpoints and isolated entities" },
    { command: "jumbo relations audit --check summary --entity-type component", description: "Summarize component graph coverage" },
    { command: "jumbo relations audit --format json", description: "Return the stable audit result as JSON" },
  ],
  related: ["relations list", "relations traverse", "relations path"],
  requiresProject: true,
};

export async function relationsAudit(
  options: { check?: string[] | string; entityType?: string },
  container: IApplicationContainer,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RelationAuditOutputBuilder();

  try {
    const checks = options.check
      ? (Array.isArray(options.check) ? options.check : [options.check]).map((check) => check.toLowerCase())
      : undefined;
    const request: AuditRelationsRequest = {
      checks: checks as RelationAuditCheckValue[] | undefined,
      entityType: options.entityType as EntityTypeValue | undefined,
    };
    const result = await container.auditRelationsController.handle(request);
    const output = renderer.getConfig().format === "text"
      ? outputBuilder.build(result)
      : outputBuilder.buildStructuredOutput(result);
    const dataSection = output.getSections().find((section) => section.type === "data");
    if (renderer.getConfig().format === "text") renderer.info(output.toHumanReadable());
    else if (dataSection) renderer.data(dataSection.content as RenderData);
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    if (renderer.getConfig().format === "text") renderer.error(output.toHumanReadable());
    else {
      const dataSection = output.getSections().find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
    process.exit(1);
  }
}
