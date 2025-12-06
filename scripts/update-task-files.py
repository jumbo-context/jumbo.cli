#!/usr/bin/env python3
"""
Script to update task files with new CLI command registration pattern.
Updates TASK-03.md through TASK-41.md with metadata export pattern.
"""

import re
import os
from pathlib import Path

# Task files configuration: maps task numbers to command details
TASK_CONFIG = {
    4: {"cmd": "goal.block", "desc": "Mark a goal as blocked with reason", "req_opts": [{"flags": "--goal-id <goalId>", "desc": "ID of the goal to block"}, {"flags": "--note <reason>", "desc": "Reason why the goal is blocked"}], "opt_opts": [], "examples": [{"cmd": "jumbo goal block --goal-id goal_abc123 --note \"Waiting for API credentials\"", "desc": "Block a goal with a reason"}], "related": ["goal unblock", "goal start", "goal add"], "params": "options: {\n  goalId: string;\n  note: string;\n}"},
    5: {"cmd": "goal.unblock", "desc": "Unblock a goal and resume work", "req_opts": [{"flags": "--goal-id <goalId>", "desc": "ID of the goal to unblock"}], "opt_opts": [{"flags": "--note <resolution>", "desc": "Optional resolution note"}], "examples": [{"cmd": "jumbo goal unblock --goal-id goal_abc123", "desc": "Unblock a goal"}], "related": ["goal block", "goal start", "goal complete"], "params": "options: {\n  goalId: string;\n  note?: string;\n}"},
    6: {"cmd": "goal.complete", "desc": "Mark a goal as completed", "req_opts": [{"flags": "--goal-id <goalId>", "desc": "ID of the goal to complete"}], "opt_opts": [], "examples": [{"cmd": "jumbo goal complete --goal-id goal_abc123", "desc": "Complete a goal"}], "related": ["goal add", "goal start", "goal block"], "params": "options: { goalId: string }"},
    # Add more task configurations as needed
}

def create_metadata_section(config):
    """Generate metadata export code"""
    req_opts_str = ""
    if config.get("req_opts"):
        req_opts_str = "  requiredOptions: [\n"
        for opt in config["req_opts"]:
            req_opts_str += f'    {{\n      flags: "{opt["flags"]}",\n      description: "{opt["desc"]}"\n    }},\n'
        req_opts_str = req_opts_str.rstrip(',\n') + '\n  ],\n'

    opt_opts_str = ""
    if config.get("opt_opts"):
        opt_opts_str = "  options: [\n"
        for opt in config["opt_opts"]:
            opt_opts_str += f'    {{\n      flags: "{opt["flags"]}",\n      description: "{opt["desc"]}"\n    }},\n'
        opt_opts_str = opt_opts_str.rstrip(',\n') + '\n  ],\n'

    examples_str = ""
    if config.get("examples"):
        examples_str = "  examples: [\n"
        for ex in config["examples"]:
            examples_str += f'    {{\n      command: "{ex["cmd"]}",\n      description: "{ex["desc"]}"\n    }},\n'
        examples_str = examples_str.rstrip(',\n') + '\n  ],\n'

    related_str = ""
    if config.get("related"):
        related_items = '", "'.join(config["related"])
        related_str = f'  related: ["{related_items}"]\n'

    return f'''/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {{
  description: "{config["desc"]}",
{req_opts_str}{opt_opts_str}{examples_str}{related_str}}};'''

def update_imports(old_code):
    """Update imports to include CommandMetadata and fix imports"""
    # Add CommandMetadata import if not present
    if "CommandMetadata" not in old_code:
        # Find first import and add after path import
        if 'import path from "path";' in old_code:
            old_code = old_code.replace(
                'import path from "path";',
                'import path from "path";\nimport fs from "fs-extra";\nimport { CommandMetadata } from "../../registry/CommandMetadata.js";'
            )
        elif 'from "path"' in old_code:
            # Add after any path import
            old_code = re.sub(
                r'(import .* from "path";)',
                r'\1\nimport fs from "fs-extra";\nimport { CommandMetadata } from "../../registry/CommandMetadata.js";',
                old_code,
                count=1
            )

    # Replace GoalEventHandler with GoalProjectionHandler
    old_code = old_code.replace("GoalEventHandler", "GoalProjectionHandler")
    old_code = old_code.replace("/handlers/GoalProjectionHandler.js", "/handlers/GoalProjectionHandler.js")

    # Remove Command import if present
    old_code = re.sub(r'import \{ Command \} from "commander";\n', '', old_code)

    return old_code

def create_function_handler(func_name, params, config):
    """Generate the command handler function"""
    cmd_parts = config["cmd"].split(".")
    handler_name = f"{cmd_parts[0].title()}{cmd_parts[1].title()}Handler"
    command_name = f"{cmd_parts[0].title()}{cmd_parts[1].title()}Command"
    projection_handler = "GoalProjectionHandler" if "goal" in config["cmd"] else "EventHandler"

    return f'''/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function {func_name}({params}) {{
  const jumboRoot = path.join(process.cwd(), ".jumbo");

  // Check if project is initialized
  if (!(await fs.pathExists(jumboRoot))) {{
    console.error("❌ Project not initialized. Run 'jumbo project init' first.");
    process.exit(1);
  }}

  try {{
    // 1. Create infrastructure implementations
    const eventBus = new InProcessEventBus();
    const eventStore = new {cmd_parts[0].title()}EventStore(jumboRoot);
    const db = SqliteConnectionManager.getConnection(jumboRoot);
    const projectionStore = new Sqlite{cmd_parts[0].title()}ProjectionStore(db);

    // 2. Create application handlers
    const projectionHandler = new {projection_handler}(projectionStore);
    const commandHandler = new {handler_name}(eventStore, eventBus);

    // 3. Wire subscriptions (subscribe to all goal events)
    eventBus.subscribe('GoalAddedEvent', projectionHandler);
    eventBus.subscribe('GoalStartedEvent', projectionHandler);
    eventBus.subscribe('GoalUpdatedEvent', projectionHandler);
    eventBus.subscribe('GoalBlockedEvent', projectionHandler);
    eventBus.subscribe('GoalUnblockedEvent', projectionHandler);
    eventBus.subscribe('GoalCompletedEvent', projectionHandler);

    // 4. Execute command
    const command: {command_name} = /* build command from options */;

    await commandHandler.execute(command);

    // Success output
    console.log(`✅ Success message`);
  }} catch (error) {{
    if (error instanceof Error) {{
      console.error(`❌ Failed: ${{error.message}}`);
    }} else {{
      console.error(`❌ Failed: ${{String(error)}}`);
    }}
    process.exit(1);
  }} finally {{
    // Close database connection
    SqliteConnectionManager.close();
  }}
}}'''

def main():
    """Main update logic"""
    base_path = Path("C:/projects/jumbo/alt/docs/work/phase-2")

    for task_num in range(4, 42):  # Tasks 4-41 (3 already done)
        task_file = base_path / f"Task-{task_num:02d}.md"

        if not task_file.exists():
            print(f"Skipping {task_file.name} - file not found")
            continue

        print(f"Processing {task_file.name}...")

        # For now, just report which files would be updated
        # Full implementation would read, transform, and write
        print(f"  Would update CLI command section")

if __name__ == "__main__":
    main()
