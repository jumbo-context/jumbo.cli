import { BaseAggregate, AggregateState } from "../../shared/BaseAggregate.js";
import { UUID } from "../../shared/BaseEvent.js";
import { ValidationRuleSet } from "../../shared/validation/ValidationRule.js";
import { GoalEvent, GoalAddedEvent, GoalStartedEvent, GoalUpdatedEvent, GoalBlockedEvent, GoalUnblockedEvent, GoalCompletedEvent, GoalResetEvent, GoalRemovedEvent } from "./EventIndex.js";
import { GoalEventType, GoalStatus, GoalStatusType, GoalErrorMessages } from "./Constants.js";
import { OBJECTIVE_RULES } from "./rules/ObjectiveRules.js";
import { SUCCESS_CRITERIA_RULES } from "./rules/SuccessCriteriaRules.js";
import { SCOPE_RULES } from "./rules/ScopeRules.js";
import { UPDATE_RULES } from "./rules/UpdateRules.js";
import { NOTE_RULES, OPTIONAL_NOTE_RULES } from "./rules/NoteRules.js";
import { CanBlockRule, CanUnblockRule } from "./rules/StateTransitionRules.js";
import {
  EmbeddedInvariant,
  EmbeddedGuideline,
  EmbeddedDependency,
  EmbeddedComponent,
  EmbeddedArchitecture,
} from "./EmbeddedContextTypes.js";

// Re-export embedded context types for consumers
export {
  EmbeddedInvariant,
  EmbeddedGuideline,
  EmbeddedDependency,
  EmbeddedComponent,
  EmbeddedArchitecture,
} from "./EmbeddedContextTypes.js";

// Domain state: business properties + aggregate metadata
export interface GoalState extends AggregateState {
  id: UUID;
  objective: string;
  successCriteria: string[];
  scopeIn: string[];
  scopeOut: string[];
  boundaries: string[];
  status: GoalStatusType;
  version: number;
  note?: string;  // Optional: populated when blocked or completed
  // Embedded context fields - populated during goal creation with --interactive
  relevantInvariants?: EmbeddedInvariant[];
  relevantGuidelines?: EmbeddedGuideline[];
  relevantDependencies?: EmbeddedDependency[];
  relevantComponents?: EmbeddedComponent[];
  architecture?: EmbeddedArchitecture;
  filesToBeCreated?: string[];
  filesToBeChanged?: string[];
}

export class Goal extends BaseAggregate<GoalState, GoalEvent> {
  private constructor(state: GoalState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: GoalState, event: GoalEvent): void {
    switch (event.type) {
      case GoalEventType.ADDED: {
        const e = event as GoalAddedEvent;
        state.objective = e.payload.objective;
        state.successCriteria = e.payload.successCriteria;
        state.scopeIn = e.payload.scopeIn;
        state.scopeOut = e.payload.scopeOut;
        state.boundaries = e.payload.boundaries;
        state.status = e.payload.status;
        // Embedded context fields (optional - populated with --interactive)
        if (e.payload.relevantInvariants !== undefined) {
          state.relevantInvariants = e.payload.relevantInvariants;
        }
        if (e.payload.relevantGuidelines !== undefined) {
          state.relevantGuidelines = e.payload.relevantGuidelines;
        }
        if (e.payload.relevantDependencies !== undefined) {
          state.relevantDependencies = e.payload.relevantDependencies;
        }
        if (e.payload.relevantComponents !== undefined) {
          state.relevantComponents = e.payload.relevantComponents;
        }
        if (e.payload.architecture !== undefined) {
          state.architecture = e.payload.architecture;
        }
        if (e.payload.filesToBeCreated !== undefined) {
          state.filesToBeCreated = e.payload.filesToBeCreated;
        }
        if (e.payload.filesToBeChanged !== undefined) {
          state.filesToBeChanged = e.payload.filesToBeChanged;
        }
        state.version = e.version;
        break;
      }

      case GoalEventType.STARTED: {
        const e = event as GoalStartedEvent;
        state.status = e.payload.status;  // "doing"
        state.version = e.version;
        break;
      }

      case GoalEventType.UPDATED: {
        const e = event as GoalUpdatedEvent;
        // Only update provided fields (partial update pattern)
        if (e.payload.objective !== undefined) {
          state.objective = e.payload.objective;
        }
        if (e.payload.successCriteria !== undefined) {
          state.successCriteria = e.payload.successCriteria;
        }
        if (e.payload.scopeIn !== undefined) {
          state.scopeIn = e.payload.scopeIn;
        }
        if (e.payload.scopeOut !== undefined) {
          state.scopeOut = e.payload.scopeOut;
        }
        if (e.payload.boundaries !== undefined) {
          state.boundaries = e.payload.boundaries;
        }
        // Embedded context fields (partial update support)
        if (e.payload.relevantInvariants !== undefined) {
          state.relevantInvariants = e.payload.relevantInvariants;
        }
        if (e.payload.relevantGuidelines !== undefined) {
          state.relevantGuidelines = e.payload.relevantGuidelines;
        }
        if (e.payload.relevantDependencies !== undefined) {
          state.relevantDependencies = e.payload.relevantDependencies;
        }
        if (e.payload.relevantComponents !== undefined) {
          state.relevantComponents = e.payload.relevantComponents;
        }
        if (e.payload.architecture !== undefined) {
          state.architecture = e.payload.architecture;
        }
        if (e.payload.filesToBeCreated !== undefined) {
          state.filesToBeCreated = e.payload.filesToBeCreated;
        }
        if (e.payload.filesToBeChanged !== undefined) {
          state.filesToBeChanged = e.payload.filesToBeChanged;
        }
        state.version = e.version;
        break;
      }

      case GoalEventType.BLOCKED: {
        const e = event as GoalBlockedEvent;
        state.status = e.payload.status;  // 'blocked'
        state.note = e.payload.note;       // Reason for blocking
        state.version = e.version;
        break;
      }

      case GoalEventType.UNBLOCKED: {
        const e = event as GoalUnblockedEvent;
        state.status = e.payload.status;  // 'doing'
        state.note = e.payload.note;       // Optional resolution note
        state.version = e.version;
        break;
      }

      case GoalEventType.COMPLETED: {
        const e = event as GoalCompletedEvent;
        state.status = e.payload.status;  // 'completed'
        state.version = e.version;
        break;
      }

      case GoalEventType.RESET: {
        const e = event as GoalResetEvent;
        state.status = e.payload.status;  // 'to-do'
        state.note = undefined;            // Clear any notes from previous states
        state.version = e.version;
        break;
      }

      case GoalEventType.REMOVED: {
        const e = event as GoalRemovedEvent;
        // Goal is removed - mark in state for filtering in queries
        state.version = e.version;
        break;
      }
    }
  }

  static create(id: UUID): Goal {
    const state: GoalState = {
      id,
      objective: "",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.TODO,
      version: 0,
    };
    return new Goal(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Goal from event store.
   */
  static rehydrate(id: UUID, history: GoalEvent[]): Goal {
    const state: GoalState = {
      id,
      objective: "",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      boundaries: [],
      status: GoalStatus.TODO,
      version: 0,
    };

    for (const event of history) {
      Goal.apply(state, event);
    }

    return new Goal(state);
  }

  add(
    objective: string,
    successCriteria: string[],
    scopeIn?: string[],
    scopeOut?: string[],
    boundaries?: string[],
    embeddedContext?: {
      relevantInvariants?: EmbeddedInvariant[];
      relevantGuidelines?: EmbeddedGuideline[];
      relevantDependencies?: EmbeddedDependency[];
      relevantComponents?: EmbeddedComponent[];
      architecture?: EmbeddedArchitecture;
      filesToBeCreated?: string[];
      filesToBeChanged?: string[];
    }
  ): GoalAddedEvent {
    // State validation: goal can only be defined once (version must be 0)
    if (this.state.version > 0) {
      throw new Error('Goal has already been defined');
    }

    // Input validation using rules
    ValidationRuleSet.ensure(objective, OBJECTIVE_RULES);
    ValidationRuleSet.ensure(successCriteria, SUCCESS_CRITERIA_RULES);
    if (scopeIn) ValidationRuleSet.ensure(scopeIn, SCOPE_RULES);
    if (scopeOut) ValidationRuleSet.ensure(scopeOut, SCOPE_RULES);
    if (boundaries) ValidationRuleSet.ensure(boundaries, SCOPE_RULES);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.ADDED,
      {
        objective,
        successCriteria,
        scopeIn: scopeIn || [],
        scopeOut: scopeOut || [],
        boundaries: boundaries || [],
        status: GoalStatus.TODO,
        // Embedded context fields (optional)
        ...(embeddedContext?.relevantInvariants && { relevantInvariants: embeddedContext.relevantInvariants }),
        ...(embeddedContext?.relevantGuidelines && { relevantGuidelines: embeddedContext.relevantGuidelines }),
        ...(embeddedContext?.relevantDependencies && { relevantDependencies: embeddedContext.relevantDependencies }),
        ...(embeddedContext?.relevantComponents && { relevantComponents: embeddedContext.relevantComponents }),
        ...(embeddedContext?.architecture && { architecture: embeddedContext.architecture }),
        ...(embeddedContext?.filesToBeCreated && { filesToBeCreated: embeddedContext.filesToBeCreated }),
        ...(embeddedContext?.filesToBeChanged && { filesToBeChanged: embeddedContext.filesToBeChanged }),
      },
      Goal.apply
    ) as GoalAddedEvent;
  }

  /**
   * Starts a defined goal (begins work).
   * Transitions status from "to-do" to "doing".
   *
   * @returns GoalStarted event
   * @throws Error if goal is blocked or completed
   */
  start(): GoalStartedEvent {
    // State validation: check current status
    if (this.state.status === GoalStatus.DOING) {
      // Idempotent: already doing is success
      // Still emit event for consistency
    }

    if (this.state.status === GoalStatus.BLOCKED) {
      throw new Error(GoalErrorMessages.CANNOT_START_BLOCKED);
    }

    if (this.state.status === GoalStatus.COMPLETED) {
      throw new Error(GoalErrorMessages.CANNOT_START_COMPLETED);
    }

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.STARTED,
      {
        status: GoalStatus.DOING
      },
      Goal.apply
    ) as GoalStartedEvent;
  }

  /**
   * Updates goal properties. Only provided fields are updated.
   * @throws Error if goal is completed or no changes provided
   */
  update(
    objective?: string,
    successCriteria?: string[],
    scopeIn?: string[],
    scopeOut?: string[],
    boundaries?: string[],
    embeddedContext?: {
      relevantInvariants?: EmbeddedInvariant[];
      relevantGuidelines?: EmbeddedGuideline[];
      relevantDependencies?: EmbeddedDependency[];
      relevantComponents?: EmbeddedComponent[];
      architecture?: EmbeddedArchitecture;
      filesToBeCreated?: string[];
      filesToBeChanged?: string[];
    }
  ): GoalUpdatedEvent {
    // 1. State validation - cannot update completed goals
    if (this.state.status === GoalStatus.COMPLETED) {
      throw new Error(GoalErrorMessages.CANNOT_UPDATE_COMPLETED);
    }

    // 2. Check if any update is provided (including embedded context)
    const hasEmbeddedContextUpdate = embeddedContext && (
      embeddedContext.relevantInvariants !== undefined ||
      embeddedContext.relevantGuidelines !== undefined ||
      embeddedContext.relevantDependencies !== undefined ||
      embeddedContext.relevantComponents !== undefined ||
      embeddedContext.architecture !== undefined ||
      embeddedContext.filesToBeCreated !== undefined ||
      embeddedContext.filesToBeChanged !== undefined
    );

    // 3. Input validation using rules (validates at least one field and validates provided fields)
    // Skip UPDATE_RULES if only embedded context is being updated
    if (!hasEmbeddedContextUpdate) {
      ValidationRuleSet.ensure(
        { objective, successCriteria, scopeIn, scopeOut, boundaries },
        UPDATE_RULES
      );
    } else if (objective || successCriteria || scopeIn || scopeOut || boundaries) {
      // If both standard fields and embedded context provided, validate standard fields
      ValidationRuleSet.ensure(
        { objective, successCriteria, scopeIn, scopeOut, boundaries },
        UPDATE_RULES
      );
    }

    // 4. Create and return event
    return this.makeEvent(
      GoalEventType.UPDATED,
      {
        objective,
        successCriteria,
        scopeIn,
        scopeOut,
        boundaries,
        // Embedded context fields (optional)
        ...(embeddedContext?.relevantInvariants && { relevantInvariants: embeddedContext.relevantInvariants }),
        ...(embeddedContext?.relevantGuidelines && { relevantGuidelines: embeddedContext.relevantGuidelines }),
        ...(embeddedContext?.relevantDependencies && { relevantDependencies: embeddedContext.relevantDependencies }),
        ...(embeddedContext?.relevantComponents && { relevantComponents: embeddedContext.relevantComponents }),
        ...(embeddedContext?.architecture && { architecture: embeddedContext.architecture }),
        ...(embeddedContext?.filesToBeCreated && { filesToBeCreated: embeddedContext.filesToBeCreated }),
        ...(embeddedContext?.filesToBeChanged && { filesToBeChanged: embeddedContext.filesToBeChanged }),
      },
      Goal.apply
    ) as GoalUpdatedEvent;
  }

  /**
   * Blocks a goal with a reason.
   * Transitions status from "to-do" or "doing" to "blocked".
   *
   * @param note - Reason why the goal is blocked
   * @returns GoalBlocked event
   * @throws Error if goal is already blocked or completed, or if note is invalid
   */
  block(note: string): GoalBlockedEvent {
    // 1. State validation: can only block from to-do or doing status
    ValidationRuleSet.ensure(this.state, [new CanBlockRule()]);

    // 2. Input validation: note must be provided and valid
    ValidationRuleSet.ensure(note, NOTE_RULES);

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.BLOCKED,
      {
        status: GoalStatus.BLOCKED,
        note,
      },
      Goal.apply
    ) as GoalBlockedEvent;
  }

  /**
   * Unblocks a goal and resumes work.
   * Transitions status from "blocked" to "doing".
   *
   * @param note - Optional resolution note explaining how the blocker was resolved
   * @returns GoalUnblocked event
   * @throws Error if goal is not blocked, or if note is invalid
   */
  unblock(note?: string): GoalUnblockedEvent {
    // 1. State validation: can only unblock from blocked status
    ValidationRuleSet.ensure(this.state, [new CanUnblockRule()]);

    // 2. Input validation: note is optional but must be valid if provided
    // Sanitize note (trim whitespace, convert empty string to undefined)
    const sanitizedNote = note && note.trim() !== '' ? note.trim() : undefined;

    if (sanitizedNote) {
      ValidationRuleSet.ensure(sanitizedNote, OPTIONAL_NOTE_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.UNBLOCKED,
      {
        status: GoalStatus.DOING,
        note: sanitizedNote,
      },
      Goal.apply
    ) as GoalUnblockedEvent;
  }

  /**
   * Marks the goal as completed. Goal must be in 'doing' or 'blocked' status.
   * @returns GoalCompleted event
   * @throws Error if goal is not yet started or already completed
   */
  complete(): GoalCompletedEvent {
    // State validation - must be in valid state to complete
    if (this.state.status === GoalStatus.TODO) {
      throw new Error(GoalErrorMessages.NOT_STARTED);
    }

    if (this.state.status === GoalStatus.COMPLETED) {
      throw new Error(GoalErrorMessages.ALREADY_COMPLETED);
    }

    // No additional input validation needed (no parameters)

    // Create and return event
    return this.makeEvent(
      GoalEventType.COMPLETED,
      {
        status: GoalStatus.COMPLETED
      },
      Goal.apply
    ) as GoalCompletedEvent;
  }

  /**
   * Resets a goal back to 'to-do' status.
   * Can transition from 'doing' or 'completed' status back to 'to-do'.
   * Blocked goals cannot be reset to preserve blocker context.
   * @returns GoalReset event
   * @throws Error if goal is blocked or already in 'to-do' status
   */
  reset(): GoalResetEvent {
    // State validation - cannot reset blocked goals (preserve blocker context)
    if (this.state.status === GoalStatus.BLOCKED) {
      throw new Error(GoalErrorMessages.CANNOT_RESET_BLOCKED);
    }

    // Idempotent - already in to-do is acceptable
    if (this.state.status === GoalStatus.TODO) {
      throw new Error(GoalErrorMessages.ALREADY_TODO);
    }

    // Create and return event
    return this.makeEvent(
      GoalEventType.RESET,
      {
        status: GoalStatus.TODO
      },
      Goal.apply
    ) as GoalResetEvent;
  }

  /**
   * Removes the goal from tracking.
   * The goal's history remains in the event store but will not appear in active queries.
   * @returns GoalRemoved event
   */
  remove(): GoalRemovedEvent {
    // No state validation needed - goals can be removed in any status

    // Create and return event
    return this.makeEvent(
      GoalEventType.REMOVED,
      {
        removedAt: new Date().toISOString()
      },
      Goal.apply
    ) as GoalRemovedEvent;
  }
}
