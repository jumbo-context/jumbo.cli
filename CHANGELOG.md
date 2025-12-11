# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
