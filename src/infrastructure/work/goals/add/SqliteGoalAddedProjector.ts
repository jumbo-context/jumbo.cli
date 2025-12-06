/**
 * SqliteGoalAddedProjector - SQLite projector for GoalAddedEvent.
 *
 * Implements IGoalAddedProjector for projecting goal addition events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IGoalAddedProjector } from "../../../../application/work/goals/add/IGoalAddedProjector.js";
import { GoalAddedEvent } from "../../../../domain/work/goals/add/GoalAddedEvent.js";

export class SqliteGoalAddedProjector implements IGoalAddedProjector {
  constructor(private db: Database) {}

  async applyGoalAdded(event: GoalAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO goal_views (
        goalId, objective, successCriteria, scopeIn, scopeOut,
        boundaries, status, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.objective,
      JSON.stringify(event.payload.successCriteria),
      JSON.stringify(event.payload.scopeIn),
      JSON.stringify(event.payload.scopeOut),
      JSON.stringify(event.payload.boundaries),
      event.payload.status,
      event.version,
      event.timestamp,
      event.timestamp
    );
  }
}
