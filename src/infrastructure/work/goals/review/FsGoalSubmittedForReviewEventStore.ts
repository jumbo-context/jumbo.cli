/**
 * FsGoalSubmittedForReviewEventStore - File system event store for GoalSubmittedForReviewEvent.
 *
 * Implements IGoalSubmittedForReviewEventWriter and IGoalSubmittedForReviewEventReader for
 * persisting and reading goal submitted for review events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IGoalSubmittedForReviewEventWriter } from "../../../../application/work/goals/review/IGoalSubmittedForReviewEventWriter.js";
import { IGoalSubmittedForReviewEventReader } from "../../../../application/work/goals/review/IGoalSubmittedForReviewEventReader.js";

export class FsGoalSubmittedForReviewEventStore
  extends FsEventStore
  implements IGoalSubmittedForReviewEventWriter, IGoalSubmittedForReviewEventReader
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
