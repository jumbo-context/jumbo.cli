/**
 * Tests for LocalInfrastructureModule
 *
 * Verifies the self-disposing lifecycle management and interface exposure.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import { LocalInfrastructureModule } from "../../../src/infrastructure/local/LocalInfrastructureModule";

describe("LocalInfrastructureModule", () => {
  let tmpDir: string;
  let module: LocalInfrastructureModule | null = null;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-jumbo-local-"));
  });

  afterEach(async () => {
    // Module cleans itself up via signal handlers, but for tests
    // we need to manually close the connection since the process doesn't exit
    if (module) {
      const db = module.getConnection();
      if (db && db.open) {
        db.pragma("wal_checkpoint(TRUNCATE)");
        db.close();
      }
      module = null;
    }
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(tmpDir);
  });

  describe("Construction (RAII)", () => {
    it("creates database connection on construction", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const db = module.getConnection();
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
    });

    it("creates database file at specified path", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const dbPath = path.join(tmpDir, "jumbo.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("initializes event store", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const eventStore = module.getEventStore();
      expect(eventStore).toBeDefined();
    });

    it("creates root directory if it does not exist", () => {
      const nonExistentDir = path.join(tmpDir, "nested", "dir");
      module = new LocalInfrastructureModule(nonExistentDir);

      expect(fs.existsSync(nonExistentDir)).toBe(true);
    });
  });

  describe("Factory Methods", () => {
    it("getConnectionManager returns IDbConnectionManager interface", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const connectionManager = module.getConnectionManager();

      // Verify interface contract
      expect(connectionManager.getConnection).toBeDefined();
      expect(typeof connectionManager.getConnection).toBe("function");

      // Verify it works
      const db = connectionManager.getConnection();
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
    });

    it("getConnection returns Database instance", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const db = module.getConnection();

      // Verify Database instance
      expect(db).toBeDefined();
      expect(db.open).toBe(true);

      // Verify it can execute queries
      const result = db.prepare("SELECT 1 as test").get() as { test: number };
      expect(result.test).toBe(1);
    });

    it("getEventStore returns IEventStore interface", async () => {
      module = new LocalInfrastructureModule(tmpDir);

      const eventStore = module.getEventStore();

      // Verify interface contract
      expect(eventStore.append).toBeDefined();
      expect(eventStore.readStream).toBeDefined();
      expect(eventStore.getAllEvents).toBeDefined();

      // Verify it works
      const testEvent = {
        type: "TestEvent",
        aggregateId: "test_123",
        timestamp: new Date().toISOString(),
        version: 1,
        payload: { data: "test" },
      };

      const result = await eventStore.append(testEvent);
      expect(result.nextSeq).toBe(1);

      const events = await eventStore.readStream("test_123");
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("TestEvent");
    });

    it("getConnectionManager and getConnection return same underlying connection", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const db1 = module.getConnection();
      const db2 = module.getConnectionManager().getConnection();

      expect(db1).toBe(db2);
    });

    it("getEventBus returns IEventBus interface", async () => {
      module = new LocalInfrastructureModule(tmpDir);

      const eventBus = module.getEventBus();

      // Verify interface contract
      expect(eventBus.subscribe).toBeDefined();
      expect(eventBus.publish).toBeDefined();
      expect(typeof eventBus.subscribe).toBe("function");
      expect(typeof eventBus.publish).toBe("function");

      // Verify it works with a simple pub/sub test
      let handlerCalled = false;
      eventBus.subscribe("TestEvent", {
        handle: async () => {
          handlerCalled = true;
        },
      });

      await eventBus.publish({
        type: "TestEvent",
        aggregateId: "test_123",
        timestamp: new Date().toISOString(),
        version: 1,
      });

      expect(handlerCalled).toBe(true);
    });

    it("getClock returns IClock interface", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const clock = module.getClock();

      // Verify interface contract
      expect(clock.nowIso).toBeDefined();
      expect(typeof clock.nowIso).toBe("function");

      // Verify it works
      const timestamp = clock.nowIso();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("getEventBus returns same instance across multiple calls", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const bus1 = module.getEventBus();
      const bus2 = module.getEventBus();

      expect(bus1).toBe(bus2);
    });

    it("getClock returns same instance across multiple calls", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const clock1 = module.getClock();
      const clock2 = module.getClock();

      expect(clock1).toBe(clock2);
    });
  });

  describe("Database Configuration", () => {
    it("enables WAL mode", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const db = module.getConnection();
      const journalMode = db.pragma("journal_mode", { simple: true });

      expect(journalMode).toBe("wal");
    });

    it("runs migrations for new database", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const db = module.getConnection();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as Array<{ name: string }>;

      const tableNames = tables.map((t) => t.name);

      // Verify migration tables were created
      expect(tableNames).toContain("session_views");
      expect(tableNames).toContain("goal_views");
    });
  });

  describe("Signal Handler Registration", () => {
    it("registers exit handler", () => {
      const exitSpy = jest.spyOn(process, "on");

      module = new LocalInfrastructureModule(tmpDir);

      const exitCalls = exitSpy.mock.calls.filter(
        (call) => call[0] === "exit"
      );
      expect(exitCalls.length).toBeGreaterThan(0);

      exitSpy.mockRestore();
    });

    it("registers SIGINT handler", () => {
      const sigintSpy = jest.spyOn(process, "on");

      module = new LocalInfrastructureModule(tmpDir);

      const sigintCalls = sigintSpy.mock.calls.filter(
        (call) => call[0] === "SIGINT"
      );
      expect(sigintCalls.length).toBeGreaterThan(0);

      sigintSpy.mockRestore();
    });

    it("registers SIGTERM handler", () => {
      const sigtermSpy = jest.spyOn(process, "on");

      module = new LocalInfrastructureModule(tmpDir);

      const sigtermCalls = sigtermSpy.mock.calls.filter(
        (call) => call[0] === "SIGTERM"
      );
      expect(sigtermCalls.length).toBeGreaterThan(0);

      sigtermSpy.mockRestore();
    });

    it("only registers signal handlers once per module", () => {
      const onSpy = jest.spyOn(process, "on");
      const initialCallCount = onSpy.mock.calls.length;

      module = new LocalInfrastructureModule(tmpDir);
      const afterFirstModule = onSpy.mock.calls.length;

      // Access methods that might trigger re-registration
      module.getConnection();
      module.getEventStore();
      module.getConnectionManager();

      const afterAccess = onSpy.mock.calls.length;

      // No new handlers should be registered
      expect(afterAccess).toBe(afterFirstModule);

      onSpy.mockRestore();
    });
  });

  describe("No Public dispose()", () => {
    it("does not expose dispose method on LocalInfrastructureModule", () => {
      module = new LocalInfrastructureModule(tmpDir);

      // TypeScript will catch this at compile time, but verify at runtime too
      expect((module as any).dispose).toBeUndefined();
    });

    it("cleanup method is private (TypeScript enforced)", () => {
      module = new LocalInfrastructureModule(tmpDir);

      // The cleanup method exists internally but is TypeScript private.
      // This test verifies the method exists for signal handler use
      // but is not part of the public TypeScript API.
      // Note: JavaScript doesn't enforce private at runtime, but TypeScript
      // ensures no external code can call it without using 'as any'.
      const moduleAny = module as any;
      expect(typeof moduleAny.cleanup).toBe("function");

      // The key guarantee is that LocalInfrastructureModule's public type
      // does not include cleanup() - this is enforced by TypeScript at compile time.
      // External modules importing LocalInfrastructureModule will not see cleanup()
      // in their type definitions.
    });
  });

  describe("Infrastructure Isolation", () => {
    it("returns same connection instance across multiple calls", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const db1 = module.getConnection();
      const db2 = module.getConnection();
      const db3 = module.getConnectionManager().getConnection();

      expect(db1).toBe(db2);
      expect(db2).toBe(db3);
    });

    it("returns same event store instance across multiple calls", () => {
      module = new LocalInfrastructureModule(tmpDir);

      const store1 = module.getEventStore();
      const store2 = module.getEventStore();

      expect(store1).toBe(store2);
    });
  });
});
