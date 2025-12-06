/**
 * SqliteSessionResumedProjector - SQLite projector for SessionResumed event.
 *
 * Implements ISessionResumedProjector for projecting session resume events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { ISessionResumedProjector } from "../../../../application/work/sessions/resume/ISessionResumedProjector.js";
import { SessionResumed } from "../../../../domain/work/sessions/resume/SessionResumedEvent.js";
import { SessionStatus } from "../../../../domain/work/sessions/Constants.js";

export class SqliteSessionResumedProjector implements ISessionResumedProjector {
  constructor(private db: Database) {}

  async applySessionResumed(event: SessionResumed): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE session_views
      SET status = ?,
          updatedAt = ?,
          version = ?
      WHERE sessionId = ?
    `);

    stmt.run(
      SessionStatus.ACTIVE,
      event.timestamp,
      event.version,
      event.aggregateId
    );
  }
}
