/**
 * GuidelineUpdated Event
 *
 * Emitted when a guideline is updated.
 * Supports partial updates - only provided fields are changed.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";
import { GuidelineCategoryValue } from "../Constants.js";

export interface GuidelineUpdated extends BaseEvent {
  readonly type: "GuidelineUpdated";
  readonly payload: {
    readonly category?: GuidelineCategoryValue;
    readonly title?: string;
    readonly description?: string;
    readonly rationale?: string;
    readonly enforcement?: string;
    readonly examples?: string[];
  };
}
