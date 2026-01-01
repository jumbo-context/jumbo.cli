# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-beta.0] - 2026-01-01

### Changed

- **Package renamed**: Package renamed from `@jumbo-ctx/cli` to `jumbo-cli` (unscoped).
  Update your installation with `npm install -g jumbo-cli`.

- **Repository moved**: GitHub repository moved from `jumbo-ctx` to `jumbo-dot-tech`
  organization.

- **Animated banner**: Redesigned CLI banner with character-map-based animation frames
  for improved visual presentation.

- **Goal context format**: Improved goal context output format for better LLM clarity
  and parsing.

### Added

- **Goal chaining**: Goals can now be linked together in a chain. Use `--next-goal <goalId>`
  to set which goal should follow the new goal, or `--previous-goal <goalId>` to update
  an existing goal to point to the new goal as its successor.

- **Goal resume**: Resume work on a previously started goal with `jumbo goal resume`.

### Fixed

- **Help screen alignment**: Command descriptions now align at a fixed column position
  for consistent formatting across all command categories.

## [1.0.0-alpha.8] - 2025-12-18

### Fixed

- **Database rebuild now correctly projects all events**: Fixed a bug where historical
  events stored with short type names (e.g., `GoalCompleted`) were not being projected
  during `jumbo db rebuild`. Events are now properly matched to their handlers.

### Added

- **Event type migration script**: Added `scripts/migrations/001-normalize-event-types.js`
  to fix legacy events with missing `Event` suffix in their type field.

### Migration Required

If you used earlier alpha versions and have existing event data, run the migration
script before rebuilding your database:

```bash
# Preview changes (recommended first)
node scripts/migrations/001-normalize-event-types.js --dry-run

# Apply changes
node scripts/migrations/001-normalize-event-types.js

# Rebuild database
jumbo db rebuild --yes
```

## [1.0.0-alpha.7] - 2025-12-11

### Breaking Changes

- **Removed `tagline` from Project**: The `--tagline` option has been removed from
  `project init` and `project update` commands. Remove this option from any scripts
  or automation. The database column remains for backward compatibility but is no
  longer used.

- **Removed `dataFlow` from Architecture**: The `--data-flow` and `--clear-data-flow`
  options have been removed from `architecture define` and `architecture update` commands.
  Remove these options from any scripts or automation. Existing data migrates automatically.

### Removed

- `--tagline` option from `jumbo project init`
- `--tagline` option from `jumbo project update`
- `--data-flow` option from `jumbo architecture define`
- `--data-flow` and `--clear-data-flow` options from `jumbo architecture update`

## [1.0.0-alpha.6] - 2025-12-11

### Added

- Initial public release
- Context management for LLM coding agents
- Event-sourced architecture with CQRS
- Session and goal tracking
- Project knowledge capture (audiences, pains, value propositions)
- Solution documentation (architecture, components, decisions, invariants, guidelines)
- Relation mapping between entities
