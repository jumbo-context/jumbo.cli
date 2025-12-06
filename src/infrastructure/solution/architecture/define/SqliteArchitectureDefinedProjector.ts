/**
 * SqliteArchitectureDefinedProjector - SQLite projector for ArchitectureDefined event.
 */

import { Database } from "better-sqlite3";
import { IArchitectureDefinedProjector } from "../../../../application/solution/architecture/define/IArchitectureDefinedProjector.js";
import { IArchitectureDefineReader } from "../../../../application/solution/architecture/define/IArchitectureDefineReader.js";
import { ArchitectureDefined } from "../../../../domain/solution/architecture/define/ArchitectureDefinedEvent.js";
import { ArchitectureView } from "../../../../application/solution/architecture/ArchitectureView.js";

export class SqliteArchitectureDefinedProjector implements IArchitectureDefinedProjector, IArchitectureDefineReader {
  constructor(private db: Database) {}

  async applyArchitectureDefined(event: ArchitectureDefined): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO architecture_views (
        architectureId, description, organization, patterns, principles,
        dataFlow, dataStores, stack, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.description,
      event.payload.organization,
      JSON.stringify(event.payload.patterns),
      JSON.stringify(event.payload.principles),
      event.payload.dataFlow,
      JSON.stringify(event.payload.dataStores),
      JSON.stringify(event.payload.stack),
      event.version,
      event.timestamp,
      event.timestamp
    );
  }

  async findById(id: string): Promise<ArchitectureView | null> {
    const row = this.db.prepare('SELECT * FROM architecture_views WHERE architectureId = ?').get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): ArchitectureView {
    return {
      architectureId: row.architectureId as string,
      description: row.description as string,
      organization: row.organization as string,
      patterns: JSON.parse((row.patterns as string) || '[]'),
      principles: JSON.parse((row.principles as string) || '[]'),
      dataFlow: (row.dataFlow as string) ?? null,
      dataStores: JSON.parse((row.dataStores as string) || '[]'),
      stack: JSON.parse((row.stack as string) || '[]'),
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
