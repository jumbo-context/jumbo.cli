/**
 * Host Builder - Application Composition
 *
 * Creates the application container with all infrastructure wired.
 * All concrete type knowledge is encapsulated here.
 *
 * This class is responsible for:
 * - Creating all event stores (Fs implementations)
 * - Creating all projectors/readers (SQLite implementations)
 * - Wiring event handlers to event bus
 * - Returning container with interfaces only
 *
 * Key Design:
 * - ALL concrete imports are in this file (better-sqlite3, Sqlite*, Fs*)
 * - Returns IApplicationContainer (interfaces only)
 * - Presentation layer never sees concrete types
 */

import Database from "better-sqlite3";
import { IApplicationContainer } from "../../application/host/IApplicationContainer.js";
import { IEventStore } from "../../application/shared/persistence/IEventStore.js";
import { IEventBus } from "../../application/shared/messaging/IEventBus.js";
import { IClock } from "../../application/shared/system/IClock.js";
import { IDatabaseRebuildService } from "../../application/maintenance/db/rebuild/IDatabaseRebuildService.js";

// Infrastructure implementations
import { FsEventStore } from "../shared/persistence/FsEventStore.js";
import { InProcessEventBus } from "../shared/messaging/InProcessEventBus.js";
import { SystemClock } from "../shared/system/SystemClock.js";
// TEMPORARY: Use sequential rebuild service to avoid race conditions
// TODO: Swap back to LocalDatabaseRebuildService when Epic/Feature/Task redesign is complete
import { TemporarySequentialDatabaseRebuildService } from "../local/TemporarySequentialDatabaseRebuildService.js";

// Session Event Stores - decomposed by use case
import { FsSessionStartedEventStore } from "../work/sessions/start/FsSessionStartedEventStore.js";
import { FsSessionEndedEventStore } from "../work/sessions/end/FsSessionEndedEventStore.js";
// Goal Event Stores - decomposed by use case
import { FsGoalAddedEventStore } from "../work/goals/add/FsGoalAddedEventStore.js";
import { FsGoalStartedEventStore } from "../work/goals/start/FsGoalStartedEventStore.js";
import { FsGoalUpdatedEventStore } from "../work/goals/update/FsGoalUpdatedEventStore.js";
import { FsGoalBlockedEventStore } from "../work/goals/block/FsGoalBlockedEventStore.js";
import { FsGoalUnblockedEventStore } from "../work/goals/unblock/FsGoalUnblockedEventStore.js";
import { FsGoalPausedEventStore } from "../work/goals/pause/FsGoalPausedEventStore.js";
import { FsGoalResumedEventStore } from "../work/goals/resume/FsGoalResumedEventStore.js";
import { FsGoalCompletedEventStore } from "../work/goals/complete/FsGoalCompletedEventStore.js";
import { FsGoalReviewedEventStore } from "../work/goals/complete/FsGoalReviewedEventStore.js";
import { FsGoalResetEventStore } from "../work/goals/reset/FsGoalResetEventStore.js";
import { FsGoalRemovedEventStore } from "../work/goals/remove/FsGoalRemovedEventStore.js";
import { FsGoalProgressUpdatedEventStore } from "../work/goals/update-progress/FsGoalProgressUpdatedEventStore.js";
// Decision Event Stores - decomposed by use case
import { FsDecisionAddedEventStore } from "../solution/decisions/add/FsDecisionAddedEventStore.js";
import { FsDecisionUpdatedEventStore } from "../solution/decisions/update/FsDecisionUpdatedEventStore.js";
import { FsDecisionReversedEventStore } from "../solution/decisions/reverse/FsDecisionReversedEventStore.js";
import { FsDecisionSupersededEventStore } from "../solution/decisions/supersede/FsDecisionSupersededEventStore.js";
// Architecture Event Stores - decomposed by use case
import { FsArchitectureDefinedEventStore } from "../solution/architecture/define/FsArchitectureDefinedEventStore.js";
import { FsArchitectureUpdatedEventStore } from "../solution/architecture/update/FsArchitectureUpdatedEventStore.js";
// Component Event Stores - decomposed by use case
import { FsComponentAddedEventStore } from "../solution/components/add/FsComponentAddedEventStore.js";
import { FsComponentUpdatedEventStore } from "../solution/components/update/FsComponentUpdatedEventStore.js";
import { FsComponentDeprecatedEventStore } from "../solution/components/deprecate/FsComponentDeprecatedEventStore.js";
import { FsComponentRemovedEventStore } from "../solution/components/remove/FsComponentRemovedEventStore.js";
// Dependency Event Stores - decomposed by use case
import { FsDependencyAddedEventStore } from "../solution/dependencies/add/FsDependencyAddedEventStore.js";
import { FsDependencyUpdatedEventStore } from "../solution/dependencies/update/FsDependencyUpdatedEventStore.js";
import { FsDependencyRemovedEventStore } from "../solution/dependencies/remove/FsDependencyRemovedEventStore.js";
// Guideline Event Stores - decomposed by use case
import { FsGuidelineAddedEventStore } from "../solution/guidelines/add/FsGuidelineAddedEventStore.js";
import { FsGuidelineUpdatedEventStore } from "../solution/guidelines/update/FsGuidelineUpdatedEventStore.js";
import { FsGuidelineRemovedEventStore } from "../solution/guidelines/remove/FsGuidelineRemovedEventStore.js";
// Invariant Event Stores - decomposed by use case
import { FsInvariantAddedEventStore } from "../solution/invariants/add/FsInvariantAddedEventStore.js";
import { FsInvariantUpdatedEventStore } from "../solution/invariants/update/FsInvariantUpdatedEventStore.js";
import { FsInvariantRemovedEventStore } from "../solution/invariants/remove/FsInvariantRemovedEventStore.js";
// Project Event Stores - decomposed by use case
import { FsProjectInitializedEventStore } from "../project-knowledge/project/init/FsProjectInitializedEventStore.js";
import { FsProjectUpdatedEventStore } from "../project-knowledge/project/update/FsProjectUpdatedEventStore.js";
// Audience Event Stores - decomposed by use case
import { FsAudienceAddedEventStore } from "../project-knowledge/audiences/add/FsAudienceAddedEventStore.js";
import { FsAudienceUpdatedEventStore } from "../project-knowledge/audiences/update/FsAudienceUpdatedEventStore.js";
import { FsAudienceRemovedEventStore } from "../project-knowledge/audiences/remove/FsAudienceRemovedEventStore.js";
// AudiencePain Event Stores - decomposed by use case
import { FsAudiencePainAddedEventStore } from "../project-knowledge/audience-pains/add/FsAudiencePainAddedEventStore.js";
import { FsAudiencePainUpdatedEventStore } from "../project-knowledge/audience-pains/update/FsAudiencePainUpdatedEventStore.js";
import { FsAudiencePainResolvedEventStore } from "../project-knowledge/audience-pains/resolve/FsAudiencePainResolvedEventStore.js";
// ValueProposition Event Stores - decomposed by use case
import { FsValuePropositionAddedEventStore } from "../project-knowledge/value-propositions/add/FsValuePropositionAddedEventStore.js";
import { FsValuePropositionUpdatedEventStore } from "../project-knowledge/value-propositions/update/FsValuePropositionUpdatedEventStore.js";
import { FsValuePropositionRemovedEventStore } from "../project-knowledge/value-propositions/remove/FsValuePropositionRemovedEventStore.js";
// Relations Event Stores - decomposed by use case
import { FsRelationAddedEventStore } from "../relations/add/FsRelationAddedEventStore.js";
import { FsRelationRemovedEventStore } from "../relations/remove/FsRelationRemovedEventStore.js";

// Session Projection Stores - decomposed by use case
import { SqliteSessionStartedProjector } from "../work/sessions/start/SqliteSessionStartedProjector.js";
import { SqliteSessionEndedProjector } from "../work/sessions/end/SqliteSessionEndedProjector.js";
import { SqliteActiveSessionReader } from "../work/sessions/end/SqliteActiveSessionReader.js";
import { SqliteSessionListReader } from "../work/sessions/list/SqliteSessionListReader.js";
import { SqliteSessionSummaryProjectionStore } from "../work/sessions/get-context/SqliteSessionSummaryProjectionStore.js";
import { SqliteSessionSummaryReader } from "../work/sessions/get-context/SqliteSessionSummaryReader.js";
// Goal Projection Stores - decomposed by use case
import { SqliteGoalAddedProjector } from "../work/goals/add/SqliteGoalAddedProjector.js";
import { SqliteGoalStartedProjector } from "../work/goals/start/SqliteGoalStartedProjector.js";
import { SqliteGoalUpdatedProjector } from "../work/goals/update/SqliteGoalUpdatedProjector.js";
import { SqliteGoalBlockedProjector } from "../work/goals/block/SqliteGoalBlockedProjector.js";
import { SqliteGoalUnblockedProjector } from "../work/goals/unblock/SqliteGoalUnblockedProjector.js";
import { SqliteGoalPausedProjector } from "../work/goals/pause/SqliteGoalPausedProjector.js";
import { SqliteGoalResumedProjector } from "../work/goals/resume/SqliteGoalResumedProjector.js";
import { SqliteGoalCompletedProjector } from "../work/goals/complete/SqliteGoalCompletedProjector.js";
import { SqliteGoalResetProjector } from "../work/goals/reset/SqliteGoalResetProjector.js";
import { SqliteGoalRemovedProjector } from "../work/goals/remove/SqliteGoalRemovedProjector.js";
import { SqliteGoalProgressUpdatedProjector } from "../work/goals/update-progress/SqliteGoalProgressUpdatedProjector.js";
import { SqliteGoalContextReader } from "../work/goals/get-context/SqliteGoalContextReader.js";
import { SqliteGoalStatusReader } from "../work/goals/SqliteGoalStatusReader.js";
// Decision Projection Stores - decomposed by use case
import { SqliteDecisionAddedProjector } from "../solution/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../solution/decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../solution/decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionSupersededProjector } from "../solution/decisions/supersede/SqliteDecisionSupersededProjector.js";
import { SqliteDecisionContextReader } from "../solution/decisions/get-context/SqliteDecisionContextReader.js";
import { SqliteDecisionSessionReader } from "../solution/decisions/get-context/SqliteDecisionSessionReader.js";
import { SqliteDecisionListReader } from "../solution/decisions/list/SqliteDecisionListReader.js";
// Architecture Projection Stores - decomposed by use case
import { SqliteArchitectureDefinedProjector } from "../solution/architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../solution/architecture/update/SqliteArchitectureUpdatedProjector.js";
import { SqliteArchitectureReader } from "../solution/architecture/SqliteArchitectureReader.js";
// Component Projection Stores - decomposed by use case
import { SqliteComponentAddedProjector } from "../solution/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../solution/components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../solution/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../solution/components/remove/SqliteComponentRemovedProjector.js";
import { SqliteComponentContextReader } from "../solution/components/get-context/SqliteComponentContextReader.js";
import { SqliteComponentListReader } from "../solution/components/list/SqliteComponentListReader.js";
// Dependency Projection Stores - decomposed by use case
import { SqliteDependencyAddedProjector } from "../solution/dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../solution/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../solution/dependencies/remove/SqliteDependencyRemovedProjector.js";
import { SqliteDependencyContextReader } from "../solution/dependencies/get-context/SqliteDependencyContextReader.js";
import { SqliteDependencyListReader } from "../solution/dependencies/list/SqliteDependencyListReader.js";
// Guideline Projection Stores - decomposed by use case
import { SqliteGuidelineAddedProjector } from "../solution/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../solution/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../solution/guidelines/remove/SqliteGuidelineRemovedProjector.js";
import { SqliteGuidelineContextReader } from "../solution/guidelines/get-context/SqliteGuidelineContextReader.js";
import { SqliteGuidelineListReader } from "../solution/guidelines/list/SqliteGuidelineListReader.js";
// Invariant Projection Stores - decomposed by use case
import { SqliteInvariantAddedProjector } from "../solution/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../solution/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../solution/invariants/remove/SqliteInvariantRemovedProjector.js";
import { SqliteInvariantContextReader } from "../solution/invariants/get-context/SqliteInvariantContextReader.js";
import { SqliteInvariantListReader } from "../solution/invariants/list/SqliteInvariantListReader.js";
// Relations Projection Stores - decomposed by use case
import { SqliteRelationAddedProjector } from "../relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationRemovedProjector } from "../relations/remove/SqliteRelationRemovedProjector.js";
import { SqliteRelationListReader } from "../relations/list/SqliteRelationListReader.js";
// AudiencePain Projection Stores - decomposed by use case
import { SqliteAudiencePainAddedProjector } from "../project-knowledge/audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../project-knowledge/audience-pains/update/SqliteAudiencePainUpdatedProjector.js";
import { SqliteAudiencePainResolvedProjector } from "../project-knowledge/audience-pains/resolve/SqliteAudiencePainResolvedProjector.js";
// Audience Projection Stores - decomposed by use case
import { SqliteAudienceAddedProjector } from "../project-knowledge/audiences/add/SqliteAudienceAddedProjector.js";
import { SqliteAudienceUpdatedProjector } from "../project-knowledge/audiences/update/SqliteAudienceUpdatedProjector.js";
import { SqliteAudienceRemovedProjector } from "../project-knowledge/audiences/remove/SqliteAudienceRemovedProjector.js";
// ValueProposition Projection Stores - decomposed by use case
import { SqliteValuePropositionAddedProjector } from "../project-knowledge/value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../project-knowledge/value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { SqliteValuePropositionRemovedProjector } from "../project-knowledge/value-propositions/remove/SqliteValuePropositionRemovedProjector.js";
// Project Projection Stores - decomposed by use case
import { SqliteProjectInitializedProjector } from "../project-knowledge/project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../project-knowledge/project/update/SqliteProjectUpdatedProjector.js";
import { SqliteProjectContextReader } from "../project-knowledge/project/query/SqliteProjectContextReader.js";
// Project Services
import { AgentFileProtocol } from "../project-knowledge/project/init/AgentFileProtocol.js";
import { InitializationProtocol } from "../../application/project-knowledge/project/init/InitializationProtocol.js";
import { InitializeProjectCommandHandler } from "../../application/project-knowledge/project/init/InitializeProjectCommandHandler.js";
// Audience Context Reader
import { SqliteAudienceContextReader } from "../project-knowledge/audiences/query/SqliteAudienceContextReader.js";
// AudiencePain Context Reader
import { SqliteAudiencePainContextReader } from "../project-knowledge/audience-pains/query/SqliteAudiencePainContextReader.js";
// ValueProposition Context Reader
import { SqliteValuePropositionContextReader } from "../project-knowledge/value-propositions/query/SqliteValuePropositionContextReader.js";
// CLI Version Reader
import { CliVersionReader } from "../cli-metadata/query/CliVersionReader.js";
// Solution Context Reader
import { SqliteSolutionContextReader } from "../solution/SqliteSolutionContextReader.js";
// Settings Infrastructure
import { FsSettingsReader } from "../shared/settings/FsSettingsReader.js";
import { FsSettingsInitializer } from "../shared/settings/FsSettingsInitializer.js";

// Event Handlers (Projection Handlers)
import { SessionStartedEventHandler } from "../../application/work/sessions/start/SessionStartedEventHandler.js";
import { SessionEndedEventHandler } from "../../application/work/sessions/end/SessionEndedEventHandler.js";
import { SessionSummaryProjectionHandler } from "../../application/work/sessions/get-context/SessionSummaryProjectionHandler.js";
import { GoalAddedEventHandler } from "../../application/work/goals/add/GoalAddedEventHandler.js";
import { GoalStartedEventHandler } from "../../application/work/goals/start/GoalStartedEventHandler.js";
import { GoalUpdatedEventHandler } from "../../application/work/goals/update/GoalUpdatedEventHandler.js";
import { GoalBlockedEventHandler } from "../../application/work/goals/block/GoalBlockedEventHandler.js";
import { GoalUnblockedEventHandler } from "../../application/work/goals/unblock/GoalUnblockedEventHandler.js";
import { GoalPausedEventHandler } from "../../application/work/goals/pause/GoalPausedEventHandler.js";
import { GoalResumedEventHandler } from "../../application/work/goals/resume/GoalResumedEventHandler.js";
import { GoalCompletedEventHandler } from "../../application/work/goals/complete/GoalCompletedEventHandler.js";
import { GoalResetEventHandler } from "../../application/work/goals/reset/GoalResetEventHandler.js";
import { GoalRemovedEventHandler } from "../../application/work/goals/remove/GoalRemovedEventHandler.js";
import { GoalProgressUpdatedEventHandler } from "../../application/work/goals/update-progress/GoalProgressUpdatedEventHandler.js";
// Decision Event Handlers - decomposed by use case
import { DecisionAddedEventHandler } from "../../application/solution/decisions/add/DecisionAddedEventHandler.js";
import { DecisionUpdatedEventHandler } from "../../application/solution/decisions/update/DecisionUpdatedEventHandler.js";
import { DecisionReversedEventHandler } from "../../application/solution/decisions/reverse/DecisionReversedEventHandler.js";
import { DecisionSupersededEventHandler } from "../../application/solution/decisions/supersede/DecisionSupersededEventHandler.js";
// Architecture Event Handlers - decomposed by use case
import { ArchitectureDefinedEventHandler } from "../../application/solution/architecture/define/ArchitectureDefinedEventHandler.js";
import { ArchitectureUpdatedEventHandler } from "../../application/solution/architecture/update/ArchitectureUpdatedEventHandler.js";
// Component Event Handlers - decomposed by use case
import { ComponentAddedEventHandler } from "../../application/solution/components/add/ComponentAddedEventHandler.js";
import { ComponentUpdatedEventHandler } from "../../application/solution/components/update/ComponentUpdatedEventHandler.js";
import { ComponentDeprecatedEventHandler } from "../../application/solution/components/deprecate/ComponentDeprecatedEventHandler.js";
import { ComponentRemovedEventHandler } from "../../application/solution/components/remove/ComponentRemovedEventHandler.js";
// Dependency Event Handlers - decomposed by use case
import { DependencyAddedEventHandler } from "../../application/solution/dependencies/add/DependencyAddedEventHandler.js";
import { DependencyUpdatedEventHandler } from "../../application/solution/dependencies/update/DependencyUpdatedEventHandler.js";
import { DependencyRemovedEventHandler } from "../../application/solution/dependencies/remove/DependencyRemovedEventHandler.js";
// Guideline Event Handlers - decomposed by use case
import { GuidelineAddedEventHandler } from "../../application/solution/guidelines/add/GuidelineAddedEventHandler.js";
import { GuidelineUpdatedEventHandler } from "../../application/solution/guidelines/update/GuidelineUpdatedEventHandler.js";
import { GuidelineRemovedEventHandler } from "../../application/solution/guidelines/remove/GuidelineRemovedEventHandler.js";
// Invariant Event Handlers - decomposed by use case
import { InvariantAddedEventHandler } from "../../application/solution/invariants/add/InvariantAddedEventHandler.js";
import { InvariantUpdatedEventHandler } from "../../application/solution/invariants/update/InvariantUpdatedEventHandler.js";
import { InvariantRemovedEventHandler } from "../../application/solution/invariants/remove/InvariantRemovedEventHandler.js";
// Project Event Handlers - decomposed by use case
import { ProjectInitializedEventHandler } from "../../application/project-knowledge/project/init/ProjectInitializedEventHandler.js";
import { ProjectUpdatedEventHandler } from "../../application/project-knowledge/project/update/ProjectUpdatedEventHandler.js";
// AudiencePain Event Handlers - decomposed by use case
import { AudiencePainAddedEventHandler } from "../../application/project-knowledge/audience-pains/add/AudiencePainAddedEventHandler.js";
import { AudiencePainUpdatedEventHandler } from "../../application/project-knowledge/audience-pains/update/AudiencePainUpdatedEventHandler.js";
import { AudiencePainResolvedEventHandler } from "../../application/project-knowledge/audience-pains/resolve/AudiencePainResolvedEventHandler.js";
// Audience Event Handlers - decomposed by use case
import { AudienceAddedEventHandler } from "../../application/project-knowledge/audiences/add/AudienceAddedEventHandler.js";
import { AudienceUpdatedEventHandler } from "../../application/project-knowledge/audiences/update/AudienceUpdatedEventHandler.js";
import { AudienceRemovedEventHandler } from "../../application/project-knowledge/audiences/remove/AudienceRemovedEventHandler.js";
// ValueProposition Event Handlers - decomposed by use case
import { ValuePropositionAddedEventHandler } from "../../application/project-knowledge/value-propositions/add/ValuePropositionAddedEventHandler.js";
import { ValuePropositionUpdatedEventHandler } from "../../application/project-knowledge/value-propositions/update/ValuePropositionUpdatedEventHandler.js";
import { ValuePropositionRemovedEventHandler } from "../../application/project-knowledge/value-propositions/remove/ValuePropositionRemovedEventHandler.js";
// Relations Event Handlers - decomposed by use case
import { RelationAddedEventHandler } from "../../application/relations/add/RelationAddedEventHandler.js";
import { RelationRemovedEventHandler } from "../../application/relations/remove/RelationRemovedEventHandler.js";

// Goal Controllers
import { CompleteGoalController } from "../../application/work/goals/complete/CompleteGoalController.js";
import { CompleteGoalCommandHandler } from "../../application/work/goals/complete/CompleteGoalCommandHandler.js";
import { GetGoalContextQueryHandler } from "../../application/work/goals/get-context/GetGoalContextQueryHandler.js";
import { ReviewTurnTracker } from "../../application/work/goals/complete/ReviewTurnTracker.js";

// Solution Context
import { UnprimedBrownfieldQualifier } from "../../application/solution/UnprimedBrownfieldQualifier.js";

// Worker Identity
import { HostSessionKeyResolver } from "./session/HostSessionKeyResolver.js";
import { FsWorkerIdentityRegistry } from "./workers/FsWorkerIdentityRegistry.js";

// Goal Claims
import { FsGoalClaimStore } from "../work/goals/claims/FsGoalClaimStore.js";
import { GoalClaimPolicy } from "../../application/work/goals/claims/GoalClaimPolicy.js";

export class HostBuilder {
  private readonly rootDir: string;
  private readonly db: Database.Database;

  constructor(rootDir: string, db: Database.Database) {
    this.rootDir = rootDir;
    this.db = db;
  }

  /**
   * Builds the application container with all infrastructure wired.
   *
   * Creates all event stores, projectors, readers, and wires event handlers
   * to the event bus. Returns an IApplicationContainer with interfaces only.
   *
   * @returns Promise<IApplicationContainer> - Container with all services
   */
  async build(): Promise<IApplicationContainer> {
    // ============================================================
    // STEP 1: Get Core Infrastructure
    // ============================================================

    const eventStore = new FsEventStore(this.rootDir);
    const eventBus = new InProcessEventBus();
    const clock = new SystemClock();
    const cliVersionReader = new CliVersionReader();

    // Initialize settings file if it doesn't exist
    const settingsInitializer = new FsSettingsInitializer(this.rootDir);
    await settingsInitializer.ensureSettingsFileExists();

    const settingsReader = new FsSettingsReader(this.rootDir);

    // Create worker identity components
    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentityReader = new FsWorkerIdentityRegistry(
      this.rootDir,
      hostSessionKeyResolver
    );

    // Create goal claim components
    const goalClaimStore = new FsGoalClaimStore(this.rootDir);
    const goalClaimPolicy = new GoalClaimPolicy(goalClaimStore, clock);

    // Create database rebuild service
    // TEMPORARY: Uses sequential event bus to avoid race conditions during rebuild
    // TODO: Swap back to LocalDatabaseRebuildService when Epic/Feature/Task redesign is complete
    const databaseRebuildService = new TemporarySequentialDatabaseRebuildService(
      this.rootDir,
      this.db,
      eventStore
    );

    // ============================================================
    // STEP 2: Create Domain Event Stores
    // ============================================================

    // Work Category - Session Event Stores - decomposed by use case
    const sessionStartedEventStore = new FsSessionStartedEventStore(this.rootDir);
    const sessionEndedEventStore = new FsSessionEndedEventStore(this.rootDir);
    // Goal Event Stores - decomposed by use case
    const goalAddedEventStore = new FsGoalAddedEventStore(this.rootDir);
    const goalStartedEventStore = new FsGoalStartedEventStore(this.rootDir);
    const goalUpdatedEventStore = new FsGoalUpdatedEventStore(this.rootDir);
    const goalBlockedEventStore = new FsGoalBlockedEventStore(this.rootDir);
    const goalUnblockedEventStore = new FsGoalUnblockedEventStore(this.rootDir);
    const goalPausedEventStore = new FsGoalPausedEventStore(this.rootDir);
    const goalResumedEventStore = new FsGoalResumedEventStore(this.rootDir);
    const goalCompletedEventStore = new FsGoalCompletedEventStore(this.rootDir);
    const goalReviewedEventStore = new FsGoalReviewedEventStore(this.rootDir);
    const goalResetEventStore = new FsGoalResetEventStore(this.rootDir);
    const goalRemovedEventStore = new FsGoalRemovedEventStore(this.rootDir);
    const goalProgressUpdatedEventStore = new FsGoalProgressUpdatedEventStore(this.rootDir);

    // Solution Category
    // Architecture Event Stores - decomposed by use case
    const architectureDefinedEventStore = new FsArchitectureDefinedEventStore(this.rootDir);
    const architectureUpdatedEventStore = new FsArchitectureUpdatedEventStore(this.rootDir);
    // Component Event Stores - decomposed by use case
    const componentAddedEventStore = new FsComponentAddedEventStore(this.rootDir);
    const componentUpdatedEventStore = new FsComponentUpdatedEventStore(this.rootDir);
    const componentDeprecatedEventStore = new FsComponentDeprecatedEventStore(this.rootDir);
    const componentRemovedEventStore = new FsComponentRemovedEventStore(this.rootDir);
    // Dependency Event Stores - decomposed by use case
    const dependencyAddedEventStore = new FsDependencyAddedEventStore(this.rootDir);
    const dependencyUpdatedEventStore = new FsDependencyUpdatedEventStore(this.rootDir);
    const dependencyRemovedEventStore = new FsDependencyRemovedEventStore(this.rootDir);
    // Decision Event Stores - decomposed by use case
    const decisionAddedEventStore = new FsDecisionAddedEventStore(this.rootDir);
    const decisionUpdatedEventStore = new FsDecisionUpdatedEventStore(this.rootDir);
    const decisionReversedEventStore = new FsDecisionReversedEventStore(this.rootDir);
    const decisionSupersededEventStore = new FsDecisionSupersededEventStore(this.rootDir);
    // Guideline Event Stores - decomposed by use case
    const guidelineAddedEventStore = new FsGuidelineAddedEventStore(this.rootDir);
    const guidelineUpdatedEventStore = new FsGuidelineUpdatedEventStore(this.rootDir);
    const guidelineRemovedEventStore = new FsGuidelineRemovedEventStore(this.rootDir);
    // Invariant Event Stores - decomposed by use case
    const invariantAddedEventStore = new FsInvariantAddedEventStore(this.rootDir);
    const invariantUpdatedEventStore = new FsInvariantUpdatedEventStore(this.rootDir);
    const invariantRemovedEventStore = new FsInvariantRemovedEventStore(this.rootDir);

    // Project Knowledge Category
    // Project Event Stores - decomposed by use case
    const projectInitializedEventStore = new FsProjectInitializedEventStore(this.rootDir);
    const projectUpdatedEventStore = new FsProjectUpdatedEventStore(this.rootDir);
    // Project Services
    const agentFileProtocol = new AgentFileProtocol();
    // Audience Event Stores - decomposed by use case
    const audienceAddedEventStore = new FsAudienceAddedEventStore(this.rootDir);
    const audienceUpdatedEventStore = new FsAudienceUpdatedEventStore(this.rootDir);
    const audienceRemovedEventStore = new FsAudienceRemovedEventStore(this.rootDir);
    // AudiencePain Event Stores - decomposed by use case
    const audiencePainAddedEventStore = new FsAudiencePainAddedEventStore(this.rootDir);
    const audiencePainUpdatedEventStore = new FsAudiencePainUpdatedEventStore(this.rootDir);
    const audiencePainResolvedEventStore = new FsAudiencePainResolvedEventStore(this.rootDir);
    // ValueProposition Event Stores - decomposed by use case
    const valuePropositionAddedEventStore = new FsValuePropositionAddedEventStore(this.rootDir);
    const valuePropositionUpdatedEventStore = new FsValuePropositionUpdatedEventStore(this.rootDir);
    const valuePropositionRemovedEventStore = new FsValuePropositionRemovedEventStore(this.rootDir);

    // Relations Category - Event Stores - decomposed by use case
    const relationAddedEventStore = new FsRelationAddedEventStore(this.rootDir);
    const relationRemovedEventStore = new FsRelationRemovedEventStore(this.rootDir);

    // ============================================================
    // STEP 3: Create Projection Stores (Read Models)
    // ============================================================

    // Work Category - Session Projection Stores - decomposed by use case
    const sessionStartedProjector = new SqliteSessionStartedProjector(this.db);
    const sessionEndedProjector = new SqliteSessionEndedProjector(this.db);
    const activeSessionReader = new SqliteActiveSessionReader(this.db);
    const sessionSummaryProjectionStore = new SqliteSessionSummaryProjectionStore(this.db);
    const sessionSummaryReader = new SqliteSessionSummaryReader(this.db);
    const sessionListReader = new SqliteSessionListReader(this.db);
    // Goal Projection Stores - decomposed by use case
    const goalAddedProjector = new SqliteGoalAddedProjector(this.db);
    const goalStartedProjector = new SqliteGoalStartedProjector(this.db);
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(this.db);
    const goalBlockedProjector = new SqliteGoalBlockedProjector(this.db);
    const goalUnblockedProjector = new SqliteGoalUnblockedProjector(this.db);
    const goalPausedProjector = new SqliteGoalPausedProjector(this.db);
    const goalResumedProjector = new SqliteGoalResumedProjector(this.db);
    const goalCompletedProjector = new SqliteGoalCompletedProjector(this.db);
    const goalResetProjector = new SqliteGoalResetProjector(this.db);
    const goalRemovedProjector = new SqliteGoalRemovedProjector(this.db);
    const goalProgressUpdatedProjector = new SqliteGoalProgressUpdatedProjector(this.db);
    const goalContextReader = new SqliteGoalContextReader(this.db);
    const goalStatusReader = new SqliteGoalStatusReader(this.db);

    // Solution Category
    // Architecture Projection Stores - decomposed by use case
    const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(this.db);
    const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(this.db);
    const architectureReader = new SqliteArchitectureReader(this.db);
    const architectureViewer = architectureReader;
    // Component Projection Stores - decomposed by use case
    const componentAddedProjector = new SqliteComponentAddedProjector(this.db);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(this.db);
    const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(this.db);
    const componentRemovedProjector = new SqliteComponentRemovedProjector(this.db);
    const componentContextReader = new SqliteComponentContextReader(this.db);
    const componentListReader = new SqliteComponentListReader(this.db);
    // Dependency Projection Stores - decomposed by use case
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(this.db);
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(this.db);
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(this.db);
    const dependencyContextReader = new SqliteDependencyContextReader(this.db);
    const dependencyListReader = new SqliteDependencyListReader(this.db);
    // Decision Projection Stores - decomposed by use case
    const decisionAddedProjector = new SqliteDecisionAddedProjector(this.db);
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(this.db);
    const decisionReversedProjector = new SqliteDecisionReversedProjector(this.db);
    const decisionSupersededProjector = new SqliteDecisionSupersededProjector(this.db);
    const decisionContextReader = new SqliteDecisionContextReader(this.db);
    const decisionSessionReader = new SqliteDecisionSessionReader(this.db);
    const decisionListReader = new SqliteDecisionListReader(this.db);
    // Guideline Projection Stores - decomposed by use case
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(this.db);
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(this.db);
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(this.db);
    const guidelineContextReader = new SqliteGuidelineContextReader(this.db);
    const guidelineListReader = new SqliteGuidelineListReader(this.db);
    // Invariant Projection Stores - decomposed by use case
    const invariantAddedProjector = new SqliteInvariantAddedProjector(this.db);
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(this.db);
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(this.db);
    const invariantContextReader = new SqliteInvariantContextReader(this.db);
    const invariantListReader = new SqliteInvariantListReader(this.db);
    // Solution Context - cross-cutting reader and qualifier
    const solutionContextReader = new SqliteSolutionContextReader(this.db);
    const unprimedBrownfieldQualifier = new UnprimedBrownfieldQualifier(solutionContextReader);

    // Project Knowledge Category
    // Project Projection Stores - decomposed by use case
    const projectInitializedProjector = new SqliteProjectInitializedProjector(this.db);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(this.db);
    const projectContextReader = new SqliteProjectContextReader(this.db);
    // Audience Projection Stores - decomposed by use case
    const audienceAddedProjector = new SqliteAudienceAddedProjector(this.db);
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(this.db);
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(this.db);
    const audienceContextReader = new SqliteAudienceContextReader(this.db);
    // AudiencePain Projection Stores - decomposed by use case
    const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(this.db);
    const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(this.db);
    const audiencePainResolvedProjector = new SqliteAudiencePainResolvedProjector(this.db);
    const audiencePainContextReader = new SqliteAudiencePainContextReader(this.db);
    // ValueProposition Projection Stores - decomposed by use case
    const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(this.db);
    const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(this.db);
    const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(this.db);
    const valuePropositionContextReader = new SqliteValuePropositionContextReader(this.db);

    // Relations Category - Projection Stores - decomposed by use case
    const relationAddedProjector = new SqliteRelationAddedProjector(this.db);
    const relationRemovedProjector = new SqliteRelationRemovedProjector(this.db);
    const relationListReader = new SqliteRelationListReader(this.db);

    // ============================================================
    // STEP 4: Create Application Services / Controllers
    // ============================================================

    // Goal Controllers
    const completeGoalCommandHandler = new CompleteGoalCommandHandler(
      goalCompletedEventStore,
      goalCompletedEventStore,
      goalCompletedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader
    );
    const getGoalContextQueryHandler = new GetGoalContextQueryHandler(
      goalContextReader,
      componentContextReader,
      dependencyContextReader,
      decisionContextReader,
      invariantContextReader,
      guidelineContextReader,
      architectureReader,
      relationRemovedProjector
    );
    const reviewTurnTracker = new ReviewTurnTracker(
      goalReviewedEventStore,
      settingsReader
    );
    const completeGoalController = new CompleteGoalController(
      completeGoalCommandHandler,
      getGoalContextQueryHandler,
      goalCompletedProjector,
      reviewTurnTracker,
      goalReviewedEventStore,
      goalReviewedEventStore,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader
    );

    // Project Initialization Protocol
    const initializeProjectCommandHandler = new InitializeProjectCommandHandler(
      projectInitializedEventStore,
      eventBus,
      projectInitializedProjector,
      agentFileProtocol,
      settingsInitializer
    );
    const initializationProtocol = new InitializationProtocol(
      initializeProjectCommandHandler,
      agentFileProtocol,
      settingsInitializer
    );

    // ============================================================
    // STEP 5: Create Projection Handlers (Event Subscribers)
    // ============================================================

    // Work Category - Session Projection Handlers - using decomposed projectors
    const sessionStartedEventHandler = new SessionStartedEventHandler(sessionStartedProjector);
    const sessionEndedEventHandler = new SessionEndedEventHandler(sessionEndedProjector);
    const sessionSummaryProjectionHandler = new SessionSummaryProjectionHandler(
      eventBus,
      sessionSummaryProjectionStore,
      goalStatusReader,
      decisionSessionReader
    );
    const goalAddedEventHandler = new GoalAddedEventHandler(goalAddedProjector);
    const goalStartedEventHandler = new GoalStartedEventHandler(goalStartedProjector);
    const goalUpdatedEventHandler = new GoalUpdatedEventHandler(goalUpdatedProjector);
    const goalBlockedEventHandler = new GoalBlockedEventHandler(goalBlockedProjector);
    const goalUnblockedEventHandler = new GoalUnblockedEventHandler(goalUnblockedProjector);
    const goalPausedEventHandler = new GoalPausedEventHandler(goalPausedProjector);
    const goalResumedEventHandler = new GoalResumedEventHandler(goalResumedProjector);
    const goalCompletedEventHandler = new GoalCompletedEventHandler(goalCompletedProjector);
    const goalResetEventHandler = new GoalResetEventHandler(goalResetProjector);
    const goalRemovedEventHandler = new GoalRemovedEventHandler(goalRemovedProjector);
    const goalProgressUpdatedEventHandler = new GoalProgressUpdatedEventHandler(goalProgressUpdatedProjector);

    // Solution Category
    // Architecture Event Handlers - decomposed by use case
    const architectureDefinedEventHandler = new ArchitectureDefinedEventHandler(architectureDefinedProjector);
    const architectureUpdatedEventHandler = new ArchitectureUpdatedEventHandler(architectureUpdatedProjector);
    // Component Event Handlers - decomposed by use case
    const componentAddedEventHandler = new ComponentAddedEventHandler(componentAddedProjector);
    const componentUpdatedEventHandler = new ComponentUpdatedEventHandler(componentUpdatedProjector);
    const componentDeprecatedEventHandler = new ComponentDeprecatedEventHandler(componentDeprecatedProjector);
    const componentRemovedEventHandler = new ComponentRemovedEventHandler(componentRemovedProjector);
    // Dependency Event Handlers - decomposed by use case
    const dependencyAddedEventHandler = new DependencyAddedEventHandler(dependencyAddedProjector);
    const dependencyUpdatedEventHandler = new DependencyUpdatedEventHandler(dependencyUpdatedProjector);
    const dependencyRemovedEventHandler = new DependencyRemovedEventHandler(dependencyRemovedProjector);
    // Decision Event Handlers - decomposed by use case
    const decisionAddedEventHandler = new DecisionAddedEventHandler(decisionAddedProjector);
    const decisionUpdatedEventHandler = new DecisionUpdatedEventHandler(decisionUpdatedProjector);
    const decisionReversedEventHandler = new DecisionReversedEventHandler(decisionReversedProjector);
    const decisionSupersededEventHandler = new DecisionSupersededEventHandler(decisionSupersededProjector);
    // Guideline Event Handlers - decomposed by use case
    const guidelineAddedEventHandler = new GuidelineAddedEventHandler(guidelineAddedProjector);
    const guidelineUpdatedEventHandler = new GuidelineUpdatedEventHandler(guidelineUpdatedProjector);
    const guidelineRemovedEventHandler = new GuidelineRemovedEventHandler(guidelineRemovedProjector);
    // Invariant Event Handlers - decomposed by use case
    const invariantAddedEventHandler = new InvariantAddedEventHandler(invariantAddedProjector);
    const invariantUpdatedEventHandler = new InvariantUpdatedEventHandler(invariantUpdatedProjector);
    const invariantRemovedEventHandler = new InvariantRemovedEventHandler(invariantRemovedProjector);

    // Project Knowledge Category
    // Project Event Handlers - decomposed by use case
    const projectInitializedEventHandler = new ProjectInitializedEventHandler(projectInitializedProjector);
    const projectUpdatedEventHandler = new ProjectUpdatedEventHandler(projectUpdatedProjector);
    // AudiencePain Event Handlers - decomposed by use case
    const audiencePainAddedEventHandler = new AudiencePainAddedEventHandler(audiencePainAddedProjector);
    const audiencePainUpdatedEventHandler = new AudiencePainUpdatedEventHandler(audiencePainUpdatedProjector);
    const audiencePainResolvedEventHandler = new AudiencePainResolvedEventHandler(audiencePainResolvedProjector);
    // Audience Event Handlers - decomposed by use case
    const audienceAddedEventHandler = new AudienceAddedEventHandler(audienceAddedProjector);
    const audienceUpdatedEventHandler = new AudienceUpdatedEventHandler(audienceUpdatedProjector);
    const audienceRemovedEventHandler = new AudienceRemovedEventHandler(audienceRemovedProjector);
    // ValueProposition Event Handlers - decomposed by use case
    const valuePropositionAddedEventHandler = new ValuePropositionAddedEventHandler(valuePropositionAddedProjector);
    const valuePropositionUpdatedEventHandler = new ValuePropositionUpdatedEventHandler(valuePropositionUpdatedProjector);
    const valuePropositionRemovedEventHandler = new ValuePropositionRemovedEventHandler(valuePropositionRemovedProjector);

    // Relations Category - Event Handlers - decomposed by use case
    const relationAddedEventHandler = new RelationAddedEventHandler(relationAddedProjector);
    const relationRemovedEventHandler = new RelationRemovedEventHandler(relationRemovedProjector);

    // ============================================================
    // STEP 6: Subscribe Projection Handlers to Events
    // ============================================================

    // Work Category - Session events
    eventBus.subscribe("SessionStartedEvent", sessionStartedEventHandler);
    eventBus.subscribe("SessionEndedEvent", sessionEndedEventHandler);

    // Work Category - Session Summary (cross-aggregate projection)
    sessionSummaryProjectionHandler.subscribe();

    // Work Category - Goal events
    eventBus.subscribe("GoalAddedEvent", goalAddedEventHandler);
    eventBus.subscribe("GoalStartedEvent", goalStartedEventHandler);
    eventBus.subscribe("GoalUpdatedEvent", goalUpdatedEventHandler);
    eventBus.subscribe("GoalBlockedEvent", goalBlockedEventHandler);
    eventBus.subscribe("GoalUnblockedEvent", goalUnblockedEventHandler);
    eventBus.subscribe("GoalPausedEvent", goalPausedEventHandler);
    eventBus.subscribe("GoalResumedEvent", goalResumedEventHandler);
    eventBus.subscribe("GoalCompletedEvent", goalCompletedEventHandler);
    eventBus.subscribe("GoalResetEvent", goalResetEventHandler);
    eventBus.subscribe("GoalRemovedEvent", goalRemovedEventHandler);
    eventBus.subscribe("GoalProgressUpdatedEvent", goalProgressUpdatedEventHandler);

    // Solution Category - Architecture events - decomposed by use case
    eventBus.subscribe("ArchitectureDefinedEvent", architectureDefinedEventHandler);
    eventBus.subscribe("ArchitectureUpdatedEvent", architectureUpdatedEventHandler);

    // Solution Category - Component events - decomposed by use case
    eventBus.subscribe("ComponentAddedEvent", componentAddedEventHandler);
    eventBus.subscribe("ComponentUpdatedEvent", componentUpdatedEventHandler);
    eventBus.subscribe("ComponentDeprecatedEvent", componentDeprecatedEventHandler);
    eventBus.subscribe("ComponentRemovedEvent", componentRemovedEventHandler);

    // Solution Category - Dependency events - decomposed by use case
    eventBus.subscribe("DependencyAddedEvent", dependencyAddedEventHandler);
    eventBus.subscribe("DependencyUpdatedEvent", dependencyUpdatedEventHandler);
    eventBus.subscribe("DependencyRemovedEvent", dependencyRemovedEventHandler);

    // Solution Category - Decision events - decomposed by use case
    eventBus.subscribe("DecisionAddedEvent", decisionAddedEventHandler);
    eventBus.subscribe("DecisionUpdatedEvent", decisionUpdatedEventHandler);
    eventBus.subscribe("DecisionReversedEvent", decisionReversedEventHandler);
    eventBus.subscribe("DecisionSupersededEvent", decisionSupersededEventHandler);

    // Solution Category - Guideline events - decomposed by use case
    eventBus.subscribe("GuidelineAddedEvent", guidelineAddedEventHandler);
    eventBus.subscribe("GuidelineUpdatedEvent", guidelineUpdatedEventHandler);
    eventBus.subscribe("GuidelineRemovedEvent", guidelineRemovedEventHandler);

    // Solution Category - Invariant events - decomposed by use case
    eventBus.subscribe("InvariantAddedEvent", invariantAddedEventHandler);
    eventBus.subscribe("InvariantUpdatedEvent", invariantUpdatedEventHandler);
    eventBus.subscribe("InvariantRemovedEvent", invariantRemovedEventHandler);

    // Project Knowledge Category - Project events - decomposed by use case
    eventBus.subscribe("ProjectInitializedEvent", projectInitializedEventHandler);
    eventBus.subscribe("ProjectUpdatedEvent", projectUpdatedEventHandler);

    // Project Knowledge Category - Audience Pain events - decomposed by use case
    eventBus.subscribe("AudiencePainAddedEvent", audiencePainAddedEventHandler);
    eventBus.subscribe("AudiencePainUpdatedEvent", audiencePainUpdatedEventHandler);
    eventBus.subscribe("AudiencePainResolvedEvent", audiencePainResolvedEventHandler);

    // Project Knowledge Category - Audience events - decomposed by use case
    eventBus.subscribe("AudienceAddedEvent", audienceAddedEventHandler);
    eventBus.subscribe("AudienceUpdatedEvent", audienceUpdatedEventHandler);
    eventBus.subscribe("AudienceRemovedEvent", audienceRemovedEventHandler);

    // Project Knowledge Category - Value Proposition events - decomposed by use case
    eventBus.subscribe("ValuePropositionAddedEvent", valuePropositionAddedEventHandler);
    eventBus.subscribe("ValuePropositionUpdatedEvent", valuePropositionUpdatedEventHandler);
    eventBus.subscribe("ValuePropositionRemovedEvent", valuePropositionRemovedEventHandler);

    // Relations Category - Relation events - decomposed by use case
    eventBus.subscribe("RelationAddedEvent", relationAddedEventHandler);
    eventBus.subscribe("RelationRemovedEvent", relationRemovedEventHandler);

    // ============================================================
    // STEP 7: Return Complete Container (No Lifecycle Management)
    // ============================================================

    return {
      // Core Infrastructure
      eventBus,
      eventStore,
      clock,
      settingsReader,
      settingsInitializer,

      // Worker Identity
      workerIdentityReader,

      // Goal Claims
      goalClaimPolicy,

      // Maintenance Services
      databaseRebuildService,

      // CLI Version
      cliVersionReader,

      // Work Category - Session Event Stores - decomposed by use case
      sessionStartedEventStore,
      sessionEndedEventStore,
      // Goal Event Stores - decomposed by use case
      goalAddedEventStore,
      goalStartedEventStore,
      goalUpdatedEventStore,
      goalBlockedEventStore,
      goalUnblockedEventStore,
      goalPausedEventStore,
      goalResumedEventStore,
      goalCompletedEventStore,
      goalReviewedEventStore,
      goalResetEventStore,
      goalRemovedEventStore,
      goalProgressUpdatedEventStore,
      // Session Projection Stores - decomposed by use case
      sessionStartedProjector,
      sessionEndedProjector,
      activeSessionReader,
      sessionSummaryProjectionStore,
      sessionSummaryReader,
      sessionListReader,
      // Goal Projection Stores - decomposed by use case
      goalAddedProjector,
      goalStartedProjector,
      goalUpdatedProjector,
      goalBlockedProjector,
      goalUnblockedProjector,
      goalPausedProjector,
      goalResumedProjector,
      goalCompletedProjector,
      goalResetProjector,
      goalRemovedProjector,
      goalProgressUpdatedProjector,
      goalContextReader,
      goalStatusReader,
      // Goal Controllers
      reviewTurnTracker,
      completeGoalController,

      // Solution Category
      // Architecture Event Stores - decomposed by use case
      architectureDefinedEventStore,
      architectureUpdatedEventStore,
      // Component Event Stores - decomposed by use case
      componentAddedEventStore,
      componentUpdatedEventStore,
      componentDeprecatedEventStore,
      componentRemovedEventStore,
      // Dependency Event Stores - decomposed by use case
      dependencyAddedEventStore,
      dependencyUpdatedEventStore,
      dependencyRemovedEventStore,
      // Decision Event Stores - decomposed by use case
      decisionAddedEventStore,
      decisionUpdatedEventStore,
      decisionReversedEventStore,
      decisionSupersededEventStore,
      // Guideline Event Stores - decomposed by use case
      guidelineAddedEventStore,
      guidelineUpdatedEventStore,
      guidelineRemovedEventStore,
      // Invariant Event Stores - decomposed by use case
      invariantAddedEventStore,
      invariantUpdatedEventStore,
      invariantRemovedEventStore,
      // Architecture Projection Stores - decomposed by use case
      architectureDefinedProjector,
      architectureUpdatedProjector,
      architectureReader,
      architectureViewer,
      // Component Projection Stores - decomposed by use case
      componentAddedProjector,
      componentUpdatedProjector,
      componentDeprecatedProjector,
      componentRemovedProjector,
      componentContextReader,
      componentListReader,
      // Dependency Projection Stores - decomposed by use case
      dependencyAddedProjector,
      dependencyUpdatedProjector,
      dependencyRemovedProjector,
      dependencyContextReader,
      dependencyListReader,
      // Decision Projection Stores - decomposed by use case
      decisionAddedProjector,
      decisionUpdatedProjector,
      decisionReversedProjector,
      decisionSupersededProjector,
      decisionContextReader,
      decisionSessionReader,
      decisionListReader,
      // Guideline Projection Stores - decomposed by use case
      guidelineAddedProjector,
      guidelineUpdatedProjector,
      guidelineRemovedProjector,
      guidelineContextReader,
      guidelineListReader,
      // Invariant Projection Stores - decomposed by use case
      invariantAddedProjector,
      invariantUpdatedProjector,
      invariantRemovedProjector,
      invariantContextReader,
      invariantListReader,
      // Solution Context - cross-cutting reader and qualifier
      solutionContextReader,
      unprimedBrownfieldQualifier,

      // Project Knowledge Category
      // Project Event Stores - decomposed by use case
      projectInitializedEventStore,
      projectUpdatedEventStore,
      // Project Services
      agentFileProtocol,
      initializationProtocol,
      // Audience Event Stores - decomposed by use case
      audienceAddedEventStore,
      audienceUpdatedEventStore,
      audienceRemovedEventStore,
      // AudiencePain Event Stores - decomposed by use case
      audiencePainAddedEventStore,
      audiencePainUpdatedEventStore,
      audiencePainResolvedEventStore,
      // ValueProposition Event Stores - decomposed by use case
      valuePropositionAddedEventStore,
      valuePropositionUpdatedEventStore,
      valuePropositionRemovedEventStore,
      // Project Projection Stores - decomposed by use case
      projectInitializedProjector,
      projectUpdatedProjector,
      projectContextReader,
      // Audience Projection Stores - decomposed by use case
      audienceAddedProjector,
      audienceUpdatedProjector,
      audienceRemovedProjector,
      audienceContextReader,
      // AudiencePain Projection Stores - decomposed by use case
      audiencePainAddedProjector,
      audiencePainUpdatedProjector,
      audiencePainResolvedProjector,
      audiencePainContextReader,
      // ValueProposition Projection Stores - decomposed by use case
      valuePropositionAddedProjector,
      valuePropositionUpdatedProjector,
      valuePropositionRemovedProjector,
      valuePropositionContextReader,

      // Relations Category - decomposed by use case
      relationAddedEventStore,
      relationRemovedEventStore,
      relationAddedProjector,
      relationRemovedProjector,
      relationListReader,
    };
  }
}
