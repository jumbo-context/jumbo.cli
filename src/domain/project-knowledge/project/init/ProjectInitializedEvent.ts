/**
 * ProjectInitialized Event
 *
 * Emitted when a project is initialized.
 * This is the first event in the Project aggregate's lifecycle.
 */

import { BaseEvent } from "../../../shared/BaseEvent.js";

export interface ProjectInitialized extends BaseEvent {
  readonly type: "ProjectInitialized";
  readonly payload: {
    readonly name: string;
    readonly purpose: string | null;
    readonly boundaries: string[];
  };
}
