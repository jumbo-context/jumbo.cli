/**
 * SqliteAudiencePainResolvedProjector - SQLite projector for AudiencePainResolved event.
 *
 * Implements IAudiencePainResolvedProjector for projecting audience pain resolve events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudiencePainResolvedProjector } from "../../../../application/project-knowledge/audience-pains/resolve/IAudiencePainResolvedProjector.js";
import { AudiencePainResolved } from "../../../../domain/project-knowledge/audience-pains/resolve/AudiencePainResolvedEvent.js";
import { AudiencePainStatus } from "../../../../domain/project-knowledge/audience-pains/Constants.js";

export class SqliteAudiencePainResolvedProjector implements IAudiencePainResolvedProjector {
  constructor(private db: Database) {}

  async applyAudiencePainResolved(event: AudiencePainResolved): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE audience_pain_views
      SET status = ?,
          resolvedAt = ?,
          version = ?,
          updatedAt = ?
      WHERE painId = ?
    `);

    stmt.run(
      AudiencePainStatus.RESOLVED,
      event.timestamp,
      event.version,
      event.timestamp,
      event.aggregateId
    );
  }
}
