/**
 * SqliteSessionPausedProjector - SQLite projector for SessionPaused event.
 *
 * Implements ISessionPausedProjector for projecting session pause events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { ISessionPausedProjector } from "../../../../application/work/sessions/pause/ISessionPausedProjector.js";
import { SessionPaused } from "../../../../domain/work/sessions/pause/SessionPausedEvent.js";
import { SessionStatus } from "../../../../domain/work/sessions/Constants.js";

export class SqliteSessionPausedProjector implements ISessionPausedProjector {
  constructor(private db: Database) {}

  async applySessionPaused(event: SessionPaused): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE session_views
      SET status = ?,
          updatedAt = ?,
          version = ?
      WHERE sessionId = ?
    `);

    stmt.run(
      SessionStatus.PAUSED,
      event.timestamp,
      event.version,
      event.aggregateId
    );
  }
}
