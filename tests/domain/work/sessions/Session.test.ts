/**
 * Tests for Session aggregate
 */

import { Session } from "../../../../src/domain/work/sessions/Session";
import {
  SessionEventType,
  SessionStatus,
  SessionErrorMessages,
} from "../../../../src/domain/work/sessions/Constants";

describe("Session Aggregate", () => {
  describe("start()", () => {
    it("should create SessionStarted event", () => {
      // Arrange
      const session = Session.create("session_123");

      // Act
      const event = session.start();

      // Assert
      expect(event.type).toBe(SessionEventType.STARTED);
      expect(event.aggregateId).toBe("session_123");
      expect(event.version).toBe(1);
      expect(event.payload).toEqual({});
      expect(event.timestamp).toBeDefined();
    });

    it("should apply event to aggregate state", () => {
      // Arrange
      const session = Session.create("session_123");

      // Act
      session.start();
      const state = session.snapshot;

      // Assert
      expect(state.focus).toBe(""); // Focus not set at start
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(1);
    });

    it("should throw error if session is already started", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();

      // Act & Assert
      expect(() => session.start()).toThrow(
        SessionErrorMessages.ALREADY_STARTED
      );
    });
  });

  describe("pause()", () => {
    it("should create SessionPaused event on active session", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();

      // Act
      const event = session.pause();

      // Assert
      expect(event.type).toBe(SessionEventType.PAUSED);
      expect(event.aggregateId).toBe("session_123");
      expect(event.version).toBe(2);
      expect(event.timestamp).toBeDefined();
    });

    it("should apply event to aggregate state", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();

      // Act
      session.pause();
      const state = session.snapshot;

      // Assert
      expect(state.status).toBe(SessionStatus.PAUSED);
      expect(state.version).toBe(2);
      expect(state.focus).toBe(""); // Focus not set at start
    });

    it("should be idempotent - can pause already paused session", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();
      session.pause();

      // Act - pause again
      const event = session.pause();

      // Assert
      expect(event.type).toBe(SessionEventType.PAUSED);
      expect(event.version).toBe(3);
      expect(session.snapshot.status).toBe(SessionStatus.PAUSED);
    });

    it("should throw error if session is ended", () => {
      // Arrange
      const session = Session.create("session_123");
      const startEvent = session.start();

      // End the session
      const endEvent = {
        type: SessionEventType.ENDED,
        aggregateId: "session_123",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          focus: "Completed feature implementation",
          summary: null,
        },
      } as any;

      const rehydrated = Session.rehydrate("session_123", [
        startEvent,
        endEvent,
      ]);

      // Act & Assert
      expect(() => rehydrated.pause()).toThrow("Cannot pause an ended session");
    });
  });

  describe("resume()", () => {
    it("should create SessionResumed event on paused session", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();
      session.pause();

      // Act
      const event = session.resume();

      // Assert
      expect(event.type).toBe(SessionEventType.RESUMED);
      expect(event.aggregateId).toBe("session_123");
      expect(event.version).toBe(3);
      expect(event.timestamp).toBeDefined();
    });

    it("should apply event to aggregate state", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();
      session.pause();

      // Act
      session.resume();
      const state = session.snapshot;

      // Assert
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(3);
      expect(state.focus).toBe(""); // Focus not set at start
    });

    it("should be idempotent - can resume already active session", () => {
      // Arrange
      const session = Session.create("session_123");
      session.start();

      // Act - resume active session
      const event = session.resume();

      // Assert
      expect(event.type).toBe(SessionEventType.RESUMED);
      expect(event.version).toBe(2);
      expect(session.snapshot.status).toBe(SessionStatus.ACTIVE);
    });

    it("should throw error if session is ended", () => {
      // Arrange
      const session = Session.create("session_123");
      const startEvent = session.start();

      // End the session
      const endEvent = {
        type: SessionEventType.ENDED,
        aggregateId: "session_123",
        version: 2,
        timestamp: new Date().toISOString(),
        payload: {
          focus: "Completed feature implementation",
          summary: null,
        },
      } as any;

      const rehydrated = Session.rehydrate("session_123", [
        startEvent,
        endEvent,
      ]);

      // Act & Assert
      expect(() => rehydrated.resume()).toThrow("Cannot resume an ended session");
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const session1 = Session.create("session_123");
      const event = session1.start();

      // Act
      const session2 = Session.rehydrate("session_123", [event]);
      const state = session2.snapshot;

      // Assert
      expect(state.id).toBe("session_123");
      expect(state.focus).toBe(""); // Focus not set at start
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(1);
    });

    it("should handle empty event history", () => {
      // Act
      const session = Session.rehydrate("session_123", []);
      const state = session.snapshot;

      // Assert
      expect(state.id).toBe("session_123");
      expect(state.focus).toBe("");
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(0);
    });

    it("should rebuild aggregate with pause event in history", () => {
      // Arrange
      const session1 = Session.create("session_123");
      const startEvent = session1.start();
      const pauseEvent = session1.pause();

      // Act
      const session2 = Session.rehydrate("session_123", [startEvent, pauseEvent]);
      const state = session2.snapshot;

      // Assert
      expect(state.id).toBe("session_123");
      expect(state.focus).toBe(""); // Focus not set at start
      expect(state.status).toBe(SessionStatus.PAUSED);
      expect(state.version).toBe(2);
    });

    it("should rebuild aggregate with full lifecycle: start -> pause -> resume", () => {
      // Arrange
      const session1 = Session.create("session_123");
      const startEvent = session1.start();
      const pauseEvent = session1.pause();
      const resumeEvent = session1.resume();

      // Act
      const session2 = Session.rehydrate("session_123", [startEvent, pauseEvent, resumeEvent]);
      const state = session2.snapshot;

      // Assert
      expect(state.id).toBe("session_123");
      expect(state.focus).toBe(""); // Focus not set at start
      expect(state.status).toBe(SessionStatus.ACTIVE);
      expect(state.version).toBe(3);
    });
  });
});
