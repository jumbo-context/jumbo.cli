import * as fs from "fs-extra";
import * as path from "path";
import {
  bootstrap,
  ApplicationContainer,
} from "../../src/presentation/cli/composition/bootstrap.js";
import { BaseEvent } from "../../src/domain/shared/BaseEvent.js";

describe("Infrastructure Wiring Integration", () => {
  let tmpDir: string;
  let container: ApplicationContainer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-integration-"));
    container = bootstrap(tmpDir);
  });

  afterEach(async () => {
    // LocalInfrastructureModule handles cleanup via signal handlers in production.
    // For tests, we need to manually close the db connection since the process doesn't exit.
    const db = container.db;
    if (db && db.open) {
      db.pragma("wal_checkpoint(TRUNCATE)");
      db.close();
    }
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(tmpDir);
  });

  it("bootstrap creates all components", () => {
    expect(container.eventBus).toBeDefined();
    expect(container.eventStore).toBeDefined();
    expect(container.clock).toBeDefined();
    expect(container.db).toBeDefined();
  });

  it("appending to event store persists to file system", async () => {
    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    };

    // Explicit append (command handler pattern)
    await container.eventStore.append(event);

    // Verify event file created (seq added by FsEventStore)
    const filePath = path.join(
      tmpDir,
      "events",
      "test-1",
      "000001.TestEvent.json"
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("event persisted and readable from store", async () => {
    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    };

    // Explicit append (command handler pattern)
    await container.eventStore.append(event);

    // Read back from store (seq is stripped - pure domain event returned)
    const storedEvents = await container.eventStore.readStream("test-1");
    expect(storedEvents).toHaveLength(1);
    expect(storedEvents[0]).not.toHaveProperty("seq"); // Infrastructure metadata stripped
    expect(storedEvents[0].type).toBe("TestEvent");

    // But file on disk contains seq for ordering (infrastructure concern)
    const filePath = path.join(
      tmpDir,
      "events",
      "test-1",
      "000001.TestEvent.json"
    );
    const fileContent = JSON.parse(await fs.readFile(filePath, "utf-8"));
    expect(fileContent.seq).toBe(1);
  });

  it("can read back multiple stored events", async () => {
    const event1: BaseEvent = {
      type: "Event1",
      aggregateId: "test-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    };

    const event2: BaseEvent = {
      type: "Event2",
      aggregateId: "test-1",
      version: 2,
      timestamp: container.clock.nowIso(),
    };

    // Explicit append (command handler pattern)
    await container.eventStore.append(event1);
    await container.eventStore.append(event2);

    // Events returned without seq (pure domain events)
    const storedEvents = await container.eventStore.readStream("test-1");
    expect(storedEvents).toHaveLength(2);
    expect(storedEvents[0].type).toBe("Event1");
    expect(storedEvents[1].type).toBe("Event2");
    expect(storedEvents[0]).not.toHaveProperty("seq");
    expect(storedEvents[1]).not.toHaveProperty("seq");
  });

  it("database connection is established", () => {
    // Verify we can execute a query
    const result = container.db.prepare("SELECT 1 as test").get();
    expect(result).toEqual({ test: 1 });
  });

  it("clock returns ISO8601 timestamps", () => {
    const timestamp = container.clock.nowIso();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("events from different aggregates are isolated", async () => {
    // Explicit append (command handler pattern)
    await container.eventStore.append({
      type: "Event1",
      aggregateId: "aggregate-1",
      version: 1,
      timestamp: container.clock.nowIso(),
    });

    await container.eventStore.append({
      type: "Event2",
      aggregateId: "aggregate-2",
      version: 1,
      timestamp: container.clock.nowIso(),
    });

    const stream1 = await container.eventStore.readStream("aggregate-1");
    const stream2 = await container.eventStore.readStream("aggregate-2");

    expect(stream1).toHaveLength(1);
    expect(stream2).toHaveLength(1);
    expect(stream1[0].aggregateId).toBe("aggregate-1");
    expect(stream2[0].aggregateId).toBe("aggregate-2");
  });

  it("getAllEvents returns events from all streams", async () => {
    // Explicit append (command handler pattern)
    await container.eventStore.append({
      type: "Event1",
      aggregateId: "aggregate-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    await container.eventStore.append({
      type: "Event2",
      aggregateId: "aggregate-2",
      version: 1,
      timestamp: "2025-01-01T01:00:00.000Z",
    });

    const allEvents = await container.eventStore.getAllEvents();
    expect(allEvents).toHaveLength(2);
    // Should be sorted by timestamp
    expect(allEvents[0].timestamp).toBe("2025-01-01T00:00:00.000Z");
    expect(allEvents[1].timestamp).toBe("2025-01-01T01:00:00.000Z");
  });
});
