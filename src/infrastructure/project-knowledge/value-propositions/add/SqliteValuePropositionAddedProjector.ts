/**
 * SqliteValuePropositionAddedProjector - SQLite projector for ValuePropositionAdded event.
 *
 * Implements IValuePropositionAddedProjector for projecting value proposition add events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IValuePropositionAddedProjector } from "../../../../application/project-knowledge/value-propositions/add/IValuePropositionAddedProjector.js";
import { ValuePropositionAdded } from "../../../../domain/project-knowledge/value-propositions/add/ValuePropositionAddedEvent.js";

export class SqliteValuePropositionAddedProjector implements IValuePropositionAddedProjector {
  constructor(private db: Database) {}

  async applyValuePropositionAdded(event: ValuePropositionAdded): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO value_proposition_views (
        valuePropositionId, title, description, benefit,
        measurableOutcome, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.title,
      event.payload.description,
      event.payload.benefit,
      event.payload.measurableOutcome,
      event.version,
      event.timestamp,
      event.timestamp
    );
  }
}
