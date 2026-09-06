import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CodexConfigurer } from "../../../../../../src/infrastructure/context/project/init/CodexConfigurer.js";
import { Codex01534HookContract } from "./fixtures/Codex01534HookContract.js";

const projectRoot = fileURLToPath(new URL("../../../../../../", import.meta.url));
const compiledCli = path.join(projectRoot, "dist", "cli.js");

describe("work.pause Codex 0.153.4 output contract (compiled CLI)", () => {
  let fixtureRoot: string;
  let env: NodeJS.ProcessEnv;
  let pauseArgs: string[];
  let startupArgs: string[];
  let resumeArgs: string[];

  function invoke(args: string[], worker = "owner") {
    return spawnSync(process.execPath, [compiledCli, ...args], {
      cwd: fixtureRoot,
      env: { ...env, VSCODE_IPC_HOOK_CLI: `${fixtureRoot}-${worker}` },
      encoding: "utf8",
      // Real pipes exist before StyleConfig is imported in each fresh process.
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  function succeed(args: string[]) {
    const result = invoke(args);
    if (result.status !== 0) throw new Error(`${args.join(" ")}: ${result.stderr}`);
    return result;
  }

  function readGoal(goalId: string) {
    const result = succeed(["goal", "show", "--id", goalId]);
    return (JSON.parse(result.stdout) as {
      goal: { goalId: string; status: string; claimedBy: string; version: number };
    }).goal;
  }

  function createActiveGoal() {
    succeed(["goal", "add", "--title", "Hook fixture", "--objective", "Preserve fixture work", "--criteria", "Pause and resume"]);
    const { goals } = JSON.parse(succeed(["goals", "list"]).stdout) as {
      goals: { goalId: string; status: string }[];
    };
    const goal = goals.find(goal => goal.status === "defined");
    if (!goal) throw new Error("Fixture goal was not created");
    for (const command of ["refine", "commit", "start"]) {
      succeed(["goal", command, "--id", goal.goalId]);
    }
    return readGoal(goal.goalId);
  }

  beforeAll(async () => {
    if (!(await fs.pathExists(compiledCli))) {
      throw new Error("Run npm run build before the compiled CLI contract tests.");
    }
    fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-codex-pause-contract-"));
    // Never mutate the parent environment or its stdout property descriptors.
    env = { ...process.env, NO_COLOR: "1", JUMBO_TELEMETRY_DISABLED: "1" };
    delete env.FORCE_COLOR;
    delete env.JUMBO_FORMAT;
    succeed(["project", "init", "--non-interactive", "--yolo", "--name", "Hook contract fixture"]);
    await new CodexConfigurer(path.join(fixtureRoot, "templates")).configure(fixtureRoot);
    const { hooks } = await fs.readJson(path.join(fixtureRoot, ".codex", "hooks.json"));
    const args = (command: string): string[] => command.split(" ").slice(1);
    pauseArgs = args(hooks.PreCompact[0].hooks[0].command);
    startupArgs = args(hooks.SessionStart.find((group: { matcher: string }) => group.matcher === "startup").hooks[0].command);
    resumeArgs = args(hooks.SessionStart.find((group: { matcher: string }) => group.matcher === "compact").hooks[0].command);
  }, 30_000);

  afterAll(async () => {
    if (fixtureRoot) await fs.remove(fixtureRoot);
  });

  it("reproduces the legacy successful pause rejection, then accepts the managed hook and delivers resume context", () => {
    const active = createActiveGoal();
    const legacy = succeed(["work", "pause", "--format", "text"]);
    expect(legacy.stdout).toMatch(/^\[OK\] Work paused/); // The reported wire-level failure trigger.
    expect(legacy.stderr).toBe("");
    expect(Codex01534HookContract.interpret("PreCompact", legacy).status).toBe("failed");
    expect(readGoal(active.goalId)).toMatchObject({
      status: "paused", claimedBy: active.claimedBy, version: active.version + 1,
    });

    const resumed = succeed(resumeArgs);
    const resumeContract = Codex01534HookContract.interpret("SessionStart", resumed);
    expect(resumed.stderr).toBe("");
    expect(resumeContract.status).toBe("completed");
    expect(resumeContract.context.join("\n")).toContain(active.goalId);
    expect(readGoal(active.goalId)).toMatchObject({ status: "doing", claimedBy: active.claimedBy });

    const paused = succeed(pauseArgs);
    expect(paused.stdout.trim()).not.toBe("");
    expect(paused.stderr).toBe("");
    expect(Codex01534HookContract.interpret("PreCompact", paused)).toEqual({ status: "completed", context: [] });
    expect(readGoal(active.goalId)).toMatchObject({ status: "paused", claimedBy: active.claimedBy });

    const noActiveGoal = succeed(pauseArgs);
    expect(noActiveGoal.stdout).toBe("");
    expect(noActiveGoal.stderr).toBe("");
    expect(Codex01534HookContract.interpret("PreCompact", noActiveGoal).status).toBe("completed");
  }, 30_000);

  it("preserves another worker's active goal and default non-TTY JSON output", () => {
    const active = createActiveGoal();
    const otherWorker = invoke(pauseArgs, "other-worker");
    expect(otherWorker.status).toBe(0);
    expect(otherWorker.stdout).toBe("");
    expect(otherWorker.stderr).toBe("");
    expect(readGoal(active.goalId)).toEqual(active);

    const ordinary = succeed(["work", "pause"]);
    expect(ordinary.stderr).toBe("");
    expect(JSON.parse(ordinary.stdout)).toMatchObject({ goalId: active.goalId, status: "paused", reason: "WorkPaused" });
    // Valid Jumbo JSON is not a valid Codex hook-control envelope.
    expect(Codex01534HookContract.interpret("PreCompact", ordinary).status).toBe("failed");
  }, 30_000);

  it("delivers startup text as SessionStart context", () => {
    const startup = succeed(startupArgs);
    const interpreted = Codex01534HookContract.interpret("SessionStart", startup);
    expect(startup.stderr).toBe("");
    expect(interpreted.status).toBe("completed");
    expect(interpreted.context).toEqual([startup.stdout.trim()]);
    expect(interpreted.context[0]).toContain("jumbo");
    expect(interpreted.context[0].length).toBeGreaterThan(0);
  }, 15_000);

  it("keeps actual pause failures on stderr with exit 1 in managed quiet text mode", () => {
    const pauseModule = pathToFileURL(path.join(projectRoot, "dist/presentation/cli/commands/work/pause/work.pause.js")).href;
    const rendererModule = pathToFileURL(path.join(projectRoot, "dist/presentation/cli/rendering/Renderer.js")).href;
    // Exercise the real compiled command/renderers with a failing application boundary.
    // Failure injection avoids corrupting fixture persistence or relying on OS permissions.
    const script = `
      const { workPause } = await import(${JSON.stringify(pauseModule)});
      const { Renderer } = await import(${JSON.stringify(rendererModule)});
      Renderer.configure({ format: "text", verbosity: "quiet" });
      await workPause({}, {
        pauseWorkController: { handle: async () => { throw new Error("Fixture storage unavailable"); } },
        logger: { debug() {}, info() {}, error() {}, async flush() {} }
      });
    `;
    const failure = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: fixtureRoot, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    expect(failure.status).toBe(1);
    expect(failure.stdout).toBe("");
    expect(failure.stderr).toContain("Fixture storage unavailable");
    expect(Codex01534HookContract.interpret("PreCompact", failure)).toMatchObject({
      status: "failed", error: expect.stringContaining("Fixture storage unavailable"),
    });
  });
});

describe("Codex 0.153.4 fixture boundary cases", () => {
  it.each([
    ["", "completed"],
    ["Work paused\n", "completed"],
    ["  [OK] Work paused\n", "failed"],
    ["[]", "failed"],
    ['{"unexpected":true}', "failed"],
    ['{"continue":"true"}', "failed"],
    ['{"systemMessage":123}', "failed"],
    ['{"continue":true}', "completed"],
    ['{"continue":false}', "stopped"],
  ])("interprets %j as %s", (stdout, status) => {
    expect(Codex01534HookContract.interpret("PreCompact", { stdout, stderr: "", status: 0 }).status).toBe(status);
  });
});
