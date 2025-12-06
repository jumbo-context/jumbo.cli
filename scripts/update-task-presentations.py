#!/usr/bin/env python3
"""
Script to help update task file presentation layers to new CLI pattern.
Extracts presentation layer sections from task files for manual review and update.
"""

import re
from pathlib import Path

# Task metadata: task number -> (command name, handler type, events to subscribe)
TASK_METADATA = {
    # Decision commands (11-14)
    11: ("decision.add", "Decision", ["DecisionAdded", "DecisionUpdated", "DecisionReversed", "DecisionSuperseded"]),
    12: ("decision.update", "Decision", ["DecisionAdded", "DecisionUpdated", "DecisionReversed", "DecisionSuperseded"]),
    13: ("decision.reverse", "Decision", ["DecisionAdded", "DecisionUpdated", "DecisionReversed", "DecisionSuperseded"]),
    14: ("decision.supersede", "Decision", ["DecisionAdded", "DecisionUpdated", "DecisionReversed", "DecisionSuperseded"]),

    # Architecture commands (15-16)
    15: ("architecture.define", "Architecture", ["ArchitectureDefined", "ArchitectureUpdated"]),
    16: ("architecture.update", "Architecture", ["ArchitectureDefined", "ArchitectureUpdated"]),

    # Invariant commands (17-19)
    17: ("invariant.add", "Invariant", ["InvariantAdded", "InvariantUpdated", "InvariantRemoved"]),
    18: ("invariant.update", "Invariant", ["InvariantAdded", "InvariantUpdated", "InvariantRemoved"]),
    19: ("invariant.remove", "Invariant", ["InvariantAdded", "InvariantUpdated", "InvariantRemoved"]),

    # Guideline commands (20-22)
    20: ("guideline.add", "Guideline", ["GuidelineAdded", "GuidelineUpdated", "GuidelineRemoved"]),
    21: ("guideline.update", "Guideline", ["GuidelineAdded", "GuidelineUpdated", "GuidelineRemoved"]),
    22: ("guideline.remove", "Guideline", ["GuidelineAdded", "GuidelineUpdated", "GuidelineRemoved"]),

    # Dependency commands (23-25)
    23: ("dependency.add", "Dependency", ["DependencyAdded", "DependencyUpdated", "DependencyRemoved"]),
    24: ("dependency.update", "Dependency", ["DependencyAdded", "DependencyUpdated", "DependencyRemoved"]),
    25: ("dependency.remove", "Dependency", ["DependencyAdded", "DependencyUpdated", "DependencyRemoved"]),

    # Component commands (26-29)
    26: ("component.add", "Component", ["ComponentAdded", "ComponentUpdated", "ComponentDeprecated", "ComponentRemoved"]),
    27: ("component.update", "Component", ["ComponentAdded", "ComponentUpdated", "ComponentDeprecated", "ComponentRemoved"]),
    28: ("component.deprecate", "Component", ["ComponentAdded", "ComponentUpdated", "ComponentDeprecated", "ComponentRemoved"]),
    29: ("component.remove", "Component", ["ComponentAdded", "ComponentUpdated", "ComponentDeprecated", "ComponentRemoved"]),

    # Project commands (30)
    30: ("project.update", "Project", ["ProjectInitialized", "ProjectUpdated"]),

    # Audience commands (31-33)
    31: ("audience.add", "Audience", ["AudienceAdded", "AudienceUpdated", "AudienceRemoved"]),
    32: ("audience.update", "Audience", ["AudienceAdded", "AudienceUpdated", "AudienceRemoved"]),
    33: ("audience.remove", "Audience", ["AudienceAdded", "AudienceUpdated", "AudienceRemoved"]),

    # Audience Pain commands (34-36)
    34: ("audiencePain.add", "AudiencePain", ["AudiencePainAdded", "AudiencePainUpdated", "AudiencePainResolved"]),
    35: ("audiencePain.update", "AudiencePain", ["AudiencePainAdded", "AudiencePainUpdated", "AudiencePainResolved"]),
    36: ("audiencePain.resolve", "AudiencePain", ["AudiencePainAdded", "AudiencePainUpdated", "AudiencePainResolved"]),

    # Value Proposition commands (37-39)
    37: ("value.add", "ValueProposition", ["ValuePropositionAdded", "ValuePropositionUpdated", "ValuePropositionRemoved"]),
    38: ("value.update", "ValueProposition", ["ValuePropositionAdded", "ValuePropositionUpdated", "ValuePropositionRemoved"]),
    39: ("value.remove", "ValueProposition", ["ValuePropositionAdded", "ValuePropositionUpdated", "ValuePropositionRemoved"]),

    # Relation commands (40-41)
    40: ("relation.add", "Relation", ["RelationAdded", "RelationRemoved"]),
    41: ("relation.remove", "Relation", ["RelationAdded", "RelationRemoved"]),
}

def main():
    docs_dir = Path("C:/projects/jumbo/alt/docs/work/phase-2")

    print("=" * 80)
    print("TASK FILE PRESENTATION LAYER EXTRACTION")
    print("=" * 80)
    print()

    for task_num in sorted(TASK_METADATA.keys()):
        task_file = docs_dir / f"Task-{task_num:02d}.md"
        if not task_file.exists():
            print(f"⚠️  TASK-{task_num:02d}.md not found")
            continue

        cmd_name, handler_type, events = TASK_METADATA[task_num]

        print(f"\n📄 TASK-{task_num:02d}: {cmd_name}")
        print(f"   Handler: {handler_type}ProjectionHandler")
        print(f"   Events: {', '.join(events)}")
        print(f"   File: {task_file.name}")

if __name__ == "__main__":
    main()
