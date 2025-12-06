/**
 * FsGoalAddedEventStore - File system event store for GoalAddedEvent.
 *
 * Implements IGoalAddedEventWriter for persisting goal addition events.
 * Extends the base FsEventStore implementation.
 */

import { FsEventStore } from "../../../shared/persistence/FsEventStore.js";
import { IGoalAddedEventWriter } from "../../../../application/work/goals/add/IGoalAddedEventWriter.js";

export class FsGoalAddedEventStore
  extends FsEventStore
  implements IGoalAddedEventWriter
{
  constructor(rootDir: string) {
    super(rootDir);
  }
}
