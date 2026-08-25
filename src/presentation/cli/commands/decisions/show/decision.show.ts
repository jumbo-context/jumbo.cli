import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { DecisionShowOutputBuilder } from "./DecisionShowOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Display the complete architectural decision record",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <decisionId>",
      description: "ID of the decision to show",
    },
  ],
  examples: [
    {
      command: "jumbo decision show --id dec_abc123",
      description: "Show the complete decision record",
    },
    {
      command: "jumbo decision show --id dec_abc123 --format json",
      description: "Show the complete decision record as JSON",
    },
  ],
  related: ["decisions list", "decisions search", "decision update"],
  requiresProject: true,
};

export async function decisionShow(
  options: { id: string },
  container: IApplicationContainer
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new DecisionShowOutputBuilder();

  try {
    const { decision } = await container.showDecisionController.handle({
      decisionId: options.id,
    });

    if (renderer.getConfig().format === "text") {
      renderer.info(outputBuilder.build(decision).toHumanReadable());
      return;
    }

    const dataSection = outputBuilder
      .buildStructuredOutput(decision)
      .getSections()
      .find((section) => section.type === "data");

    if (dataSection) {
      renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output = error instanceof Error && error.message === `Decision not found: ${options.id}`
      ? outputBuilder.buildNotFoundError(options.id)
      : outputBuilder.buildFailureError(error instanceof Error ? error : String(error));

    renderer.error(output.toHumanReadable());
    process.exitCode = 1;
  }
}
