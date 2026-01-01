/**
 * SqliteGoalStartedProjector - SQLite projector for GoalStartedEvent.
 *
 * Implements IGoalStartedProjector for projecting goal started events
 * to the SQLite read model, and IGoalReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalStartedProjector } from "../../../../application/work/goals/start/IGoalStartedProjector.js";
import { IGoalReader } from "../../../../application/work/goals/start/IGoalReader.js";
import { GoalStartedEvent } from "../../../../domain/work/goals/start/GoalStartedEvent.js";
import { GoalView } from "../../../../application/work/goals/GoalView.js";

export class SqliteGoalStartedProjector
  implements IGoalStartedProjector, IGoalReader
{
  constructor(private db: Database) {}

  async applyGoalStarted(event: GoalStartedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.version,
      event.timestamp,
      event.aggregateId
    );
  }

  async findById(goalId: string): Promise<GoalView | null> {
    const row = this.db
      .prepare("SELECT * FROM goal_views WHERE goalId = ?")
      .get(goalId);
    return row ? this.mapRowToView(row as any) : null;
  }

  private mapRowToView(row: any): GoalView {
    return {
      goalId: row.goalId,
      objective: row.objective,
      successCriteria: JSON.parse(row.successCriteria || "[]"),
      scopeIn: JSON.parse(row.scopeIn || "[]"),
      scopeOut: JSON.parse(row.scopeOut || "[]"),
      boundaries: JSON.parse(row.boundaries || "[]"),
      status: row.status,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      note: row.note || undefined,
      nextGoalId: row.nextGoalId || undefined,
    };
  }
}
