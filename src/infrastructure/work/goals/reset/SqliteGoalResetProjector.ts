/**
 * SqliteGoalResetProjector - SQLite projector for GoalResetEvent.
 *
 * Implements IGoalResetProjector for projecting goal reset events
 * to the SQLite read model, and IGoalResetReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalResetProjector } from "../../../../application/work/goals/reset/IGoalResetProjector.js";
import { IGoalResetReader } from "../../../../application/work/goals/reset/IGoalResetReader.js";
import { GoalResetEvent } from "../../../../domain/work/goals/reset/GoalResetEvent.js";
import { GoalView } from "../../../../application/work/goals/GoalView.js";

export class SqliteGoalResetProjector
  implements IGoalResetProjector, IGoalResetReader
{
  constructor(private db: Database) {}

  async applyGoalReset(event: GoalResetEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          note = NULL,
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
