/**
 * SqliteAudienceAddedProjector - SQLite projector for AudienceAdded event.
 *
 * Implements IAudienceAddedProjector for projecting audience add events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudienceAddedProjector } from "../../../../application/project-knowledge/audiences/add/IAudienceAddedProjector.js";
import { AudienceAdded } from "../../../../domain/project-knowledge/audiences/add/AudienceAddedEvent.js";

export class SqliteAudienceAddedProjector implements IAudienceAddedProjector {
  constructor(private db: Database) {}

  async applyAudienceAdded(event: AudienceAdded): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO audience_views (
        audienceId, name, description, priority, isRemoved,
        version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.name,
      event.payload.description,
      event.payload.priority,
      0, // isRemoved = false
      event.version,
      event.timestamp,
      event.timestamp
    );
  }
}
