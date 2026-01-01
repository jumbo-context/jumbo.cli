<p style="width:100%; background-color:#F4D078; padding:9px 9px" align="center">
  This project is in beta. Non-backward compatible changes could be introduced. Please post issues if you discover anything and contributions are welcome.
</p>

<p align="center">
  <img src="jumbo-logo.svg" alt="Jumbo" width="200">
</p>

<h1 align="center">Jumbo - Memory for Coding Agents</h1>

<p align="center">
  Use Jumbo. <br>
  Focus on goals, not context.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#faqs">FAQs</a>
</p>

---

## Can we address the elephant in the room?

Face it, working with coding agents is not ALL fun.  
One step back for every two forward is not a productivity boost.  
It's a hassle.

Context engineering alleviates the pain, but has you focused on the wrong things.


## How does Jumbo help?

Jumbo is a CLI tool that gives your coding agent memory like an... well, <span style="font-size: 1.5rem;">🐘</span>. <br>
It keeps your agent on track, and you focused on what you want to build.

- **Tracks project details**  
Important aspects of you project are stored, retrievable, and mutable.  
<sub>(see below)</sub>

- **Delivers optimized context**  
Agents receive the context they need to work aligned with YOUR criteria.

- **Portable**  
Switch models, or move from CLI to IDE, without interruption. Jumbo stays with you project and knows exactly where you left off.

- **Extends context windows**  
Optimal context delivery lets agents work longer.

- **Automatic**  
Hooks into your agent session and orchestrates the flow. It just works.

- **Full control**  
Jumbo's memories are yours. Stay in control and manage your data directly from the terminal.

- **Private**  
All data stays local. Nothing leaves your machine.

- **Fast**  
No network calls. No lag. Works instantaneously.  


## What's in the trunk?  
Jumbo models memories as the following aggregates:

- **Project**  
What you are building and who it's for.
- **Architecture**  
Your solution design, structure and patterns applied.
- **Components**  
The parts comprising your solution and their roles.
- **Dependencies**  
What your project relies on.
- **Decisions**  
A history of why you chose what you chose.
- **Guidelines**  
The preferences, best practices, and the standards you adhere to.
- **Invariants**  
The rules you simply won't compromise on.
- **Goals**  
What you're working on—now, next and later.
- **Sessions**  
The state of the project.
- **Context Packets**  
Optimized context packets delivered to your AI agents.


---

## Quick Start

```bash
# Install globally
npm install -g jumbo-cli

# Initialize in your project
jumbo project init
```

That's it. Fire up your coding agent. Work flows. Memories stick. Momentum builds.

---

## Initializing a Project

Run `jumbo init` in your project root. This creates a `.jumbo/` directory with:

- **Event store** — Append-only log of all project-knowledge
- **FSDB** — Read-optimized views for fast querying
- **Hook configuration** — Integration points for your AI tools

### Hook Integration

Hooks for popular AI agents are configured for session start, your agent receives a tiny project status—recently completed, active, and planned goals. When you start a goal, a comprehensive context packet is delivered with the details necessary for your agent to execute the implementation.

---

## Usage

Jumbo organizes knowledge into a few key concepts:

### Goals

Track what you're working on:

```bash
jumbo goal add --objective "Implement user auth"
jumbo goal start --goal-id <id>
jumbo goal complete --goal-id <id>
```

### Decisions

Capture architectural decisions your agent must respect:

```bash
jumbo decision add --title "CQRS for all data access" --rationale "Separate read/write models for scalability and clarity"
```

### Invariants

Define non-negotiable rules—the lines your agent cannot cross:

```bash
jumbo invariant add --category "Architecture" --description "Common Closure Principle: classes that change together live together. No scattering related logic across modules."
```

### Components

Track system components:

```bash
jumbo component add --name "AuthService" --description "Handles user authentication"
```

### Full Command Reference

```
PROJECT
  audience add/remove/update    Manage target audiences
  project init/update           Initialize and configure
  value add/remove/update       Value propositions

WORK
  goal add/start/complete       Track goals and progress
  goal block/unblock            Handle blockers
  session start/end/pause       Manage work sessions

SOLUTION
  architecture define/update    System architecture
  component add/update/remove   System components
  decision add/reverse          Architectural decisions
  dependency add/remove         Component dependencies
  guideline add/remove          Execution guidelines
  invariant add/remove          Non-negotiable rules
```

Run `jumbo --help` for the complete list.

---

## Dependencies

Jumbo is built with:

| Package | Purpose |
|---------|---------|
| better-sqlite3 | Local event store and projections |
| commander | CLI framework |
| chalk | Terminal styling |
| yaml | Context serialization |
| inversify | Dependency injection |
| ulid | Time-sortable unique IDs |

---

## FAQs

**How does jumbo integrate with my AI agent?**

Through hooks. Your agent calls `jumbo session start` at the beginning of a session, and `jumbo` injects relevant project context. A richer context packet is delivered to the agent when it starts work on a goal. New insights are captured in the natural flow of your agent conversations.

**What if I change agents or models?**

Change agents and models at will. `jumbo` just picks up where you left off.

**What coding agents does jumbo work with?**

`jumbo` has been battle tested with Claude Code CLI, Gemini CLI, and Copilot CLI. More to be verified soon...

**What IDEs are supported?**

Theoretically, any IDE with an integrated coding agent should work. VS Code running GitHub Copilot has been tested and works well with all supported models. Cursor to be verified soon...

**Where is data stored?**

Locally, in `.jumbo/` within your project. Nothing leaves your machine unless you want it to.

**Can I control what data Jumbo captures?**  

Absolutely. You control how you want your agent to interact with Jumbo. Stay in-the-loop by approving each command, or run with pre-approved Jumbo commands for an automated experience.

**Is Jumbo going to hijack my agent?**  

Not at all. Jumbo prescribes an opinionated workflow that you can always bypass. It works alongside your agent to enhance its capabilities.  

**Why not just use markdown files?**  

Jumbo goes beyond static markdown files. It's an immutable event stream—capturing your entire project history, always current and auditable. You stay in your flow, never repeat yourself—only add new information when you need to. Markdown is a snapshot in time, Jumbo is your project's living memory.

**Is there documentation?**
It's on it's way...  
In the meantime, the CLI will guide you in getting started. In addition, the help command <code>jumbo --help</code> provides a comprehensive overview of all available commands and options with examples.

**Can I share context across a team?**

Not yet. A teams version is coming soon.

If you're feeling bold, you can try committing `.jumbo/` directory to your repository—not recommended though. Without very tight coordination you're bound to encounter problems. `jumbo` uses Event Sourcing under the hood, working asynchronously will definitely result in out-of-sequence events. 

<!-- **Why not just use comments or docs?**

You can do that, but the amount of context window consumed while your agent crawls your repo for background information leaves little context budget for executing the task precisely. You risk auto-compression and the agent going awry. gure out how to execute a given task, leaves little   They also don't capture vital lessons learned in the context of your 'conversations'  Jumbo is dynamic—it knows what you're working on *right now* and surfaces relevant context automatically. Jumbo let's you focus on what you want to achieve, the background just comes automatically.

**Does this replace documentation?**

Yes. Jumbo makes documentation obsolete. Jumbo captures working memories: project knowledge, architecture details, coding patterns, invariant, decisions, goals, blockers, session data and relations between all of it. It's richer than documentation, never outdated, served up to the your coding agent when it needs it, and available to you when you want it. -->

---

## License

[AGPL-3.0](LICENSE)

---

<p align="center">
  Built for developers who are tired of repeating themselves.
</p>
