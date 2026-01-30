/**
 * Tests for CompleteGoalController QA turn gating
 */

import { CompleteGoalController } from "../../../../../src/application/work/goals/complete/CompleteGoalController";
import { CompleteGoalCommandHandler } from "../../../../../src/application/work/goals/complete/CompleteGoalCommandHandler";
import { GetGoalContextQueryHandler } from "../../../../../src/application/work/goals/get-context/GetGoalContextQueryHandler";
import { IGoalCompleteReader } from "../../../../../src/application/work/goals/complete/IGoalCompleteReader";
import { ReviewTurnTracker } from "../../../../../src/application/work/goals/complete/ReviewTurnTracker";
import { IGoalReviewedEventWriter } from "../../../../../src/application/work/goals/complete/IGoalReviewedEventWriter";
import { IGoalReviewedEventReader } from "../../../../../src/application/work/goals/complete/IGoalReviewedEventReader";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus";
import { GoalErrorMessages, GoalStatus, formatErrorMessage } from "../../../../../src/domain/work/goals/Constants";
import { GoalView } from "../../../../../src/application/work/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../src/application/work/goals/claims/GoalClaimPolicy";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";

describe("CompleteGoalController", () => {
  let completeGoalCommandHandler: CompleteGoalCommandHandler;
  let getGoalContextQueryHandler: GetGoalContextQueryHandler;
  let goalReader: IGoalCompleteReader;
  let turnTracker: ReviewTurnTracker;
  let reviewEventWriter: IGoalReviewedEventWriter;
  let goalEventReader: IGoalReviewedEventReader;
  let eventBus: IEventBus;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    completeGoalCommandHandler = {
      execute: jest.fn(),
    } as unknown as CompleteGoalCommandHandler;

    getGoalContextQueryHandler = {
      execute: jest.fn(),
    } as unknown as GetGoalContextQueryHandler;

    goalReader = {
      findById: jest.fn(),
    };

    turnTracker = {
      getCommitGate: jest.fn(),
    } as unknown as ReviewTurnTracker;

    reviewEventWriter = {
      append: jest.fn(),
    };

    goalEventReader = {
      readStream: jest.fn(),
    };

    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn(),
    };

    // Mock claim policy - default to allowing claims (no existing claim)
    claimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
    } as unknown as GoalClaimPolicy;

    workerIdentityReader = {
      workerId: testWorkerId,
    };
  });

  it("blocks commit when no QA review has been recorded", async () => {
    (turnTracker.getCommitGate as jest.Mock).mockResolvedValue({
      current: 0,
      limit: 3,
      remaining: 3,
      canCommit: false,
    });

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      getGoalContextQueryHandler,
      goalReader,
      turnTracker,
      reviewEventWriter,
      goalEventReader,
      eventBus,
      claimPolicy,
      workerIdentityReader
    );

    const expectedMessage = formatErrorMessage(
      GoalErrorMessages.QA_REVIEW_REQUIRED,
      {
        goalId: "goal_123",
      }
    );

    await expect(
      controller.handle({ goalId: "goal_123", commit: true })
    ).rejects.toThrow(expectedMessage);

    expect(completeGoalCommandHandler.execute).not.toHaveBeenCalled();
  });

  it("allows commit after at least one QA review", async () => {
    (turnTracker.getCommitGate as jest.Mock).mockResolvedValue({
      current: 1,
      limit: 3,
      remaining: 2,
      canCommit: false,
    });

    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Complete the controller",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.COMPLETED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);
    (completeGoalCommandHandler.execute as jest.Mock).mockResolvedValue({ goalId: "goal_456" });

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      getGoalContextQueryHandler,
      goalReader,
      turnTracker,
      reviewEventWriter,
      goalEventReader,
      eventBus,
      claimPolicy,
      workerIdentityReader
    );

    const response = await controller.handle({ goalId: "goal_456", commit: true });

    expect(completeGoalCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_456" });
    expect(response.status).toBe(GoalStatus.COMPLETED);
    expect(response.goalId).toBe("goal_456");
  });

  it("does not record QA review when goal is not doing", async () => {
    (turnTracker.getCommitGate as jest.Mock).mockResolvedValue({
      current: 0,
      limit: 3,
      remaining: 3,
      canCommit: false,
    });

    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Not started goal",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);
    (getGoalContextQueryHandler.execute as jest.Mock).mockResolvedValue({
      goal: mockView,
      components: [],
      dependencies: [],
      decisions: [],
      invariants: [],
      guidelines: [],
      relations: [],
    });

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      getGoalContextQueryHandler,
      goalReader,
      turnTracker,
      reviewEventWriter,
      goalEventReader,
      eventBus,
      claimPolicy,
      workerIdentityReader
    );

    const response = await controller.handle({ goalId: "goal_789", commit: false });

    expect(response.status).toBe(GoalStatus.TODO);
    expect(reviewEventWriter.append).not.toHaveBeenCalled();
    expect(goalEventReader.readStream).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("rejects completion when goal is claimed by another worker", async () => {
    // Mock another worker's active claim
    const otherWorkerId = createWorkerId("other-worker-id");
    (claimPolicy.canClaim as jest.Mock).mockReturnValue({
      allowed: false,
      reason: "CLAIMED_BY_ANOTHER_WORKER",
      existingClaim: {
        goalId: "goal_123",
        claimedBy: otherWorkerId,
        claimedAt: "2025-01-15T09:00:00.000Z",
        claimExpiresAt: "2025-01-15T11:00:00.000Z",
      },
    });

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      getGoalContextQueryHandler,
      goalReader,
      turnTracker,
      reviewEventWriter,
      goalEventReader,
      eventBus,
      claimPolicy,
      workerIdentityReader
    );

    await expect(
      controller.handle({ goalId: "goal_123", commit: false })
    ).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );

    // Verify nothing else was called
    expect(turnTracker.getCommitGate).not.toHaveBeenCalled();
    expect(goalReader.findById).not.toHaveBeenCalled();
    expect(completeGoalCommandHandler.execute).not.toHaveBeenCalled();
  });
});
