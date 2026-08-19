import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { ShowDecisionController } from "../../../../../../src/application/context/decisions/show/ShowDecisionController.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { decisionShow, metadata } from "../../../../../../src/presentation/cli/commands/decisions/show/decision.show.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("decision.show command", () => {
  let handle: jest.MockedFunction<ShowDecisionController["handle"]>;
  let container: Partial<IApplicationContainer>;
  let stdout: jest.SpiedFunction<typeof console.log>;
  let stderr: jest.SpiedFunction<typeof console.error>;

  const decision: DecisionView = {
    decisionId: "dec_123",
    title: "Use event sourcing",
    context: "State changes need an audit trail.",
    rationale: "Events preserve intent.",
    alternatives: ["CRUD snapshots"],
    consequences: "Projection rebuilding is required.",
    status: "active",
    supersededBy: null,
    reversalReason: null,
    reversedAt: null,
    version: 2,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  };

  beforeEach(() => {
    handle = jest.fn();
    container = {
      showDecisionController: { handle } as unknown as ShowDecisionController,
    };
    stdout = jest.spyOn(console, "log").mockImplementation(() => undefined);
    stderr = jest.spyOn(console, "error").mockImplementation(() => undefined);
    process.exitCode = undefined;
  });

  afterEach(() => {
    Renderer.reset();
    process.exitCode = undefined;
    jest.restoreAllMocks();
  });

  it("declares required ID metadata, examples, and project scope", () => {
    expect(metadata.requiredOptions).toContainEqual(expect.objectContaining({
      flags: "-i, --id <decisionId>",
    }));
    expect(metadata.examples).toEqual(expect.arrayContaining([
      expect.objectContaining({ command: expect.stringContaining("decision show --id") }),
    ]));
    expect(metadata.requiresProject).toBe(true);
  });

  it("delegates and renders rich text when text format is selected", async () => {
    Renderer.configure({ format: "text" });
    handle.mockResolvedValue({ decision });

    await decisionShow({ id: "dec_123" }, container as IApplicationContainer);

    expect(handle).toHaveBeenCalledWith({ decisionId: "dec_123" });
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(stdout.mock.calls[0][0]).toContain(decision.context);
    expect(stderr).not.toHaveBeenCalled();
  });

  it("renders exactly one complete JSON object when JSON is selected", async () => {
    Renderer.configure({ format: "json" });
    handle.mockResolvedValue({ decision });

    await decisionShow({ id: "dec_123" }, container as IApplicationContainer);

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stdout.mock.calls[0][0]))).toEqual(decision);
    expect(stderr).not.toHaveBeenCalled();
  });

  it("defaults non-TTY output to JSON when no format is supplied", async () => {
    Renderer.reset();
    handle.mockResolvedValue({ decision });

    await decisionShow({ id: "dec_123" }, container as IApplicationContainer);

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stdout.mock.calls[0][0]))).toEqual(decision);
  });

  it("reports unknown IDs only on stderr and sets a non-zero exit code", async () => {
    Renderer.configure({ format: "json" });
    handle.mockRejectedValue(new Error("Decision not found: dec_missing"));

    await decisionShow({ id: "dec_missing" }, container as IApplicationContainer);

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stderr.mock.calls[0][0]))).toEqual(expect.objectContaining({
      error: expect.stringContaining("No decision exists with ID: dec_missing"),
    }));
    expect(process.exitCode).toBe(1);
  });

  it("routes unexpected failures through builder-owned error output", async () => {
    Renderer.configure({ format: "text" });
    handle.mockRejectedValue(new Error("reader failed"));

    await decisionShow({ id: "dec_123" }, container as IApplicationContainer);

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr.mock.calls[0][0]).toContain("Failed to show decision");
    expect(stderr.mock.calls[0][0]).toContain("reader failed");
    expect(process.exitCode).toBe(1);
  });
});
