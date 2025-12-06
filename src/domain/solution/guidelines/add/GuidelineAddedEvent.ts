/**
 * GuidelineAdded Event
 *
 * Emitted when a new guideline is added to the project.
 * Guidelines define execution rules for testing, coding style, process, etc.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { GuidelineCategoryValue } from "../Constants.js";

export interface GuidelineAdded extends BaseEvent {
  readonly type: "GuidelineAdded";
  readonly payload: {
    readonly category: GuidelineCategoryValue;
    readonly title: string;
    readonly description: string;
    readonly rationale: string;
    readonly enforcement: string;
    readonly examples: string[];
  };
}
