/**
 * TEMPORARY WORKAROUND - DO NOT USE IN PRODUCTION
 *
 * Infrastructure implementation of database rebuild service with sequential handler execution.
 *
 * This service addresses a race condition during database rebuild where
 * cross-aggregate projection handlers (e.g., SessionSummaryProjectionHandler)
 * attempt to read from projections (e.g., goal_views) while primary handlers
 * are still writing to them.
 *
 * The root cause: InProcessEventBus executes handlers in parallel via Promise.all(),
 * which works fine during normal operations but causes issues during rebuild when
 * projections don't exist yet.
 *
 * This service encapsulates ALL the complexity of sequential rebuild:
 * - Creating new database connection
 * - Running migrations
 * - Creating sequential event bus
 * - Creating all projectors
 * - Creating all handlers
 * - Registering handlers
 * - Replaying events sequentially
 *
 * REMOVAL PLAN:
 * This will be removed when Epic/Feature/Task redesign is complete. At that time,
 * simply swap back to LocalDatabaseRebuildService in bootstrap.ts.
 *
 * @see LocalDatabaseRebuildService - Normal parallel rebuild (currently has race condition)
 */

import fs from "fs-extra";
import path from "path";
import Database from "better-sqlite3";
import {
  IDatabaseRebuildService,
  DatabaseRebuildResult,
} from "../../application/maintenance/db/rebuild/IDatabaseRebuildService.js";
import { IEventStore } from "../../application/shared/persistence/IEventStore.js";
import { TemporarySequentialRebuildEventBus } from "../shared/messaging/TemporarySequentialRebuildEventBus.js";
import { MigrationRunner } from "../shared/persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../shared/persistence/migrations.config.js";

// Projectors
import { SqliteSessionStartedProjector } from "../work/sessions/start/SqliteSessionStartedProjector.js";
import { SqliteSessionEndedProjector } from "../work/sessions/end/SqliteSessionEndedProjector.js";
import { SqliteSessionPausedProjector } from "../work/sessions/pause/SqliteSessionPausedProjector.js";
import { SqliteSessionResumedProjector } from "../work/sessions/resume/SqliteSessionResumedProjector.js";
import { SqliteSessionSummaryProjectionStore } from "../work/sessions/get-context/SqliteSessionSummaryProjectionStore.js";
import { SqliteGoalStatusReader } from "../work/goals/SqliteGoalStatusReader.js";
import { SqliteDecisionSessionReader } from "../solution/decisions/get-context/SqliteDecisionSessionReader.js";
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
import { SqliteArchitectureDefinedProjector } from "../solution/architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../solution/architecture/update/SqliteArchitectureUpdatedProjector.js";
import { SqliteComponentAddedProjector } from "../solution/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../solution/components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../solution/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../solution/components/remove/SqliteComponentRemovedProjector.js";
import { SqliteDependencyAddedProjector } from "../solution/dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../solution/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../solution/dependencies/remove/SqliteDependencyRemovedProjector.js";
import { SqliteDecisionAddedProjector } from "../solution/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../solution/decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../solution/decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionSupersededProjector } from "../solution/decisions/supersede/SqliteDecisionSupersededProjector.js";
import { SqliteGuidelineAddedProjector } from "../solution/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../solution/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../solution/guidelines/remove/SqliteGuidelineRemovedProjector.js";
import { SqliteInvariantAddedProjector } from "../solution/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../solution/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../solution/invariants/remove/SqliteInvariantRemovedProjector.js";
import { SqliteProjectInitializedProjector } from "../project-knowledge/project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../project-knowledge/project/update/SqliteProjectUpdatedProjector.js";
import { SqliteAudiencePainAddedProjector } from "../project-knowledge/audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../project-knowledge/audience-pains/update/SqliteAudiencePainUpdatedProjector.js";
import { SqliteAudiencePainResolvedProjector } from "../project-knowledge/audience-pains/resolve/SqliteAudiencePainResolvedProjector.js";
import { SqliteAudienceAddedProjector } from "../project-knowledge/audiences/add/SqliteAudienceAddedProjector.js";
import { SqliteAudienceUpdatedProjector } from "../project-knowledge/audiences/update/SqliteAudienceUpdatedProjector.js";
import { SqliteAudienceRemovedProjector } from "../project-knowledge/audiences/remove/SqliteAudienceRemovedProjector.js";
import { SqliteValuePropositionAddedProjector } from "../project-knowledge/value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../project-knowledge/value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { SqliteValuePropositionRemovedProjector } from "../project-knowledge/value-propositions/remove/SqliteValuePropositionRemovedProjector.js";
import { SqliteRelationAddedProjector } from "../relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationRemovedProjector } from "../relations/remove/SqliteRelationRemovedProjector.js";

// Handlers
import { SessionStartedEventHandler } from "../../application/work/sessions/start/SessionStartedEventHandler.js";
import { SessionEndedEventHandler } from "../../application/work/sessions/end/SessionEndedEventHandler.js";
import { SessionPausedEventHandler } from "../../application/work/sessions/pause/SessionPausedEventHandler.js";
import { SessionResumedEventHandler } from "../../application/work/sessions/resume/SessionResumedEventHandler.js";
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
import { DecisionAddedEventHandler } from "../../application/solution/decisions/add/DecisionAddedEventHandler.js";
import { DecisionUpdatedEventHandler } from "../../application/solution/decisions/update/DecisionUpdatedEventHandler.js";
import { DecisionReversedEventHandler } from "../../application/solution/decisions/reverse/DecisionReversedEventHandler.js";
import { DecisionSupersededEventHandler } from "../../application/solution/decisions/supersede/DecisionSupersededEventHandler.js";
import { ArchitectureDefinedEventHandler } from "../../application/solution/architecture/define/ArchitectureDefinedEventHandler.js";
import { ArchitectureUpdatedEventHandler } from "../../application/solution/architecture/update/ArchitectureUpdatedEventHandler.js";
import { ComponentAddedEventHandler } from "../../application/solution/components/add/ComponentAddedEventHandler.js";
import { ComponentUpdatedEventHandler } from "../../application/solution/components/update/ComponentUpdatedEventHandler.js";
import { ComponentDeprecatedEventHandler } from "../../application/solution/components/deprecate/ComponentDeprecatedEventHandler.js";
import { ComponentRemovedEventHandler } from "../../application/solution/components/remove/ComponentRemovedEventHandler.js";
import { DependencyAddedEventHandler } from "../../application/solution/dependencies/add/DependencyAddedEventHandler.js";
import { DependencyUpdatedEventHandler } from "../../application/solution/dependencies/update/DependencyUpdatedEventHandler.js";
import { DependencyRemovedEventHandler } from "../../application/solution/dependencies/remove/DependencyRemovedEventHandler.js";
import { GuidelineAddedEventHandler } from "../../application/solution/guidelines/add/GuidelineAddedEventHandler.js";
import { GuidelineUpdatedEventHandler } from "../../application/solution/guidelines/update/GuidelineUpdatedEventHandler.js";
import { GuidelineRemovedEventHandler } from "../../application/solution/guidelines/remove/GuidelineRemovedEventHandler.js";
import { InvariantAddedEventHandler } from "../../application/solution/invariants/add/InvariantAddedEventHandler.js";
import { InvariantUpdatedEventHandler } from "../../application/solution/invariants/update/InvariantUpdatedEventHandler.js";
import { InvariantRemovedEventHandler } from "../../application/solution/invariants/remove/InvariantRemovedEventHandler.js";
import { ProjectInitializedEventHandler } from "../../application/project-knowledge/project/init/ProjectInitializedEventHandler.js";
import { ProjectUpdatedEventHandler } from "../../application/project-knowledge/project/update/ProjectUpdatedEventHandler.js";
import { AudiencePainAddedEventHandler } from "../../application/project-knowledge/audience-pains/add/AudiencePainAddedEventHandler.js";
import { AudiencePainUpdatedEventHandler } from "../../application/project-knowledge/audience-pains/update/AudiencePainUpdatedEventHandler.js";
import { AudiencePainResolvedEventHandler } from "../../application/project-knowledge/audience-pains/resolve/AudiencePainResolvedEventHandler.js";
import { AudienceAddedEventHandler } from "../../application/project-knowledge/audiences/add/AudienceAddedEventHandler.js";
import { AudienceUpdatedEventHandler } from "../../application/project-knowledge/audiences/update/AudienceUpdatedEventHandler.js";
import { AudienceRemovedEventHandler } from "../../application/project-knowledge/audiences/remove/AudienceRemovedEventHandler.js";
import { ValuePropositionAddedEventHandler } from "../../application/project-knowledge/value-propositions/add/ValuePropositionAddedEventHandler.js";
import { ValuePropositionUpdatedEventHandler } from "../../application/project-knowledge/value-propositions/update/ValuePropositionUpdatedEventHandler.js";
import { ValuePropositionRemovedEventHandler } from "../../application/project-knowledge/value-propositions/remove/ValuePropositionRemovedEventHandler.js";
import { RelationAddedEventHandler } from "../../application/relations/add/RelationAddedEventHandler.js";
import { RelationRemovedEventHandler } from "../../application/relations/remove/RelationRemovedEventHandler.js";

export class TemporarySequentialDatabaseRebuildService implements IDatabaseRebuildService {
  constructor(
    private readonly rootDir: string,
    private readonly db: Database.Database,
    private readonly eventStore: IEventStore
  ) {}

  async rebuild(): Promise<DatabaseRebuildResult> {
    const dbPath = path.join(this.rootDir, "jumbo.db");

    // Step 1: Close existing database connection
    if (this.db && this.db.open) {
      this.db.pragma("wal_checkpoint(TRUNCATE)");
      this.db.close();
    }

    // Step 2: Delete the database file
    if (await fs.pathExists(dbPath)) {
      await fs.remove(dbPath);
    }

    // Also remove WAL and SHM files if they exist
    const walPath = dbPath + "-wal";
    const shmPath = dbPath + "-shm";
    if (await fs.pathExists(walPath)) {
      await fs.remove(walPath);
    }
    if (await fs.pathExists(shmPath)) {
      await fs.remove(shmPath);
    }

    // Step 3: Create new database connection and run migrations
    const newDb = new Database(dbPath);
    newDb.pragma("journal_mode = WAL");

    const infrastructureDir = path.resolve(__dirname, "..");
    const migrations = getNamespaceMigrations(infrastructureDir);
    const migrationRunner = new MigrationRunner(newDb);
    migrationRunner.runNamespaceMigrations(migrations);

    // Step 4: Create sequential event bus
    const sequentialEventBus = new TemporarySequentialRebuildEventBus();

    // Step 5: Create all projectors
    const sessionStartedProjector = new SqliteSessionStartedProjector(newDb);
    const sessionEndedProjector = new SqliteSessionEndedProjector(newDb);
    const sessionPausedProjector = new SqliteSessionPausedProjector(newDb);
    const sessionResumedProjector = new SqliteSessionResumedProjector(newDb);
    const sessionSummaryProjectionStore = new SqliteSessionSummaryProjectionStore(newDb);
    const goalStatusReader = new SqliteGoalStatusReader(newDb);
    const decisionSessionReader = new SqliteDecisionSessionReader(newDb);
    const goalAddedProjector = new SqliteGoalAddedProjector(newDb);
    const goalStartedProjector = new SqliteGoalStartedProjector(newDb);
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(newDb);
    const goalBlockedProjector = new SqliteGoalBlockedProjector(newDb);
    const goalUnblockedProjector = new SqliteGoalUnblockedProjector(newDb);
    const goalPausedProjector = new SqliteGoalPausedProjector(newDb);
    const goalResumedProjector = new SqliteGoalResumedProjector(newDb);
    const goalCompletedProjector = new SqliteGoalCompletedProjector(newDb);
    const goalResetProjector = new SqliteGoalResetProjector(newDb);
    const goalRemovedProjector = new SqliteGoalRemovedProjector(newDb);
    const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(newDb);
    const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(newDb);
    const componentAddedProjector = new SqliteComponentAddedProjector(newDb);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(newDb);
    const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(newDb);
    const componentRemovedProjector = new SqliteComponentRemovedProjector(newDb);
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(newDb);
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(newDb);
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(newDb);
    const decisionAddedProjector = new SqliteDecisionAddedProjector(newDb);
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(newDb);
    const decisionReversedProjector = new SqliteDecisionReversedProjector(newDb);
    const decisionSupersededProjector = new SqliteDecisionSupersededProjector(newDb);
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(newDb);
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(newDb);
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(newDb);
    const invariantAddedProjector = new SqliteInvariantAddedProjector(newDb);
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(newDb);
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(newDb);
    const projectInitializedProjector = new SqliteProjectInitializedProjector(newDb);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(newDb);
    const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(newDb);
    const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(newDb);
    const audiencePainResolvedProjector = new SqliteAudiencePainResolvedProjector(newDb);
    const audienceAddedProjector = new SqliteAudienceAddedProjector(newDb);
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(newDb);
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(newDb);
    const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(newDb);
    const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(newDb);
    const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(newDb);
    const relationAddedProjector = new SqliteRelationAddedProjector(newDb);
    const relationRemovedProjector = new SqliteRelationRemovedProjector(newDb);

    // Step 6: Create all handlers
    const sessionStartedEventHandler = new SessionStartedEventHandler(sessionStartedProjector);
    const sessionEndedEventHandler = new SessionEndedEventHandler(sessionEndedProjector);
    const sessionPausedEventHandler = new SessionPausedEventHandler(sessionPausedProjector);
    const sessionResumedEventHandler = new SessionResumedEventHandler(sessionResumedProjector);
    const sessionSummaryProjectionHandler = new SessionSummaryProjectionHandler(
      sequentialEventBus,
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
    const architectureDefinedEventHandler = new ArchitectureDefinedEventHandler(architectureDefinedProjector);
    const architectureUpdatedEventHandler = new ArchitectureUpdatedEventHandler(architectureUpdatedProjector);
    const componentAddedEventHandler = new ComponentAddedEventHandler(componentAddedProjector);
    const componentUpdatedEventHandler = new ComponentUpdatedEventHandler(componentUpdatedProjector);
    const componentDeprecatedEventHandler = new ComponentDeprecatedEventHandler(componentDeprecatedProjector);
    const componentRemovedEventHandler = new ComponentRemovedEventHandler(componentRemovedProjector);
    const dependencyAddedEventHandler = new DependencyAddedEventHandler(dependencyAddedProjector);
    const dependencyUpdatedEventHandler = new DependencyUpdatedEventHandler(dependencyUpdatedProjector);
    const dependencyRemovedEventHandler = new DependencyRemovedEventHandler(dependencyRemovedProjector);
    const decisionAddedEventHandler = new DecisionAddedEventHandler(decisionAddedProjector);
    const decisionUpdatedEventHandler = new DecisionUpdatedEventHandler(decisionUpdatedProjector);
    const decisionReversedEventHandler = new DecisionReversedEventHandler(decisionReversedProjector);
    const decisionSupersededEventHandler = new DecisionSupersededEventHandler(decisionSupersededProjector);
    const guidelineAddedEventHandler = new GuidelineAddedEventHandler(guidelineAddedProjector);
    const guidelineUpdatedEventHandler = new GuidelineUpdatedEventHandler(guidelineUpdatedProjector);
    const guidelineRemovedEventHandler = new GuidelineRemovedEventHandler(guidelineRemovedProjector);
    const invariantAddedEventHandler = new InvariantAddedEventHandler(invariantAddedProjector);
    const invariantUpdatedEventHandler = new InvariantUpdatedEventHandler(invariantUpdatedProjector);
    const invariantRemovedEventHandler = new InvariantRemovedEventHandler(invariantRemovedProjector);
    const projectInitializedEventHandler = new ProjectInitializedEventHandler(projectInitializedProjector);
    const projectUpdatedEventHandler = new ProjectUpdatedEventHandler(projectUpdatedProjector);
    const audiencePainAddedEventHandler = new AudiencePainAddedEventHandler(audiencePainAddedProjector);
    const audiencePainUpdatedEventHandler = new AudiencePainUpdatedEventHandler(audiencePainUpdatedProjector);
    const audiencePainResolvedEventHandler = new AudiencePainResolvedEventHandler(audiencePainResolvedProjector);
    const audienceAddedEventHandler = new AudienceAddedEventHandler(audienceAddedProjector);
    const audienceUpdatedEventHandler = new AudienceUpdatedEventHandler(audienceUpdatedProjector);
    const audienceRemovedEventHandler = new AudienceRemovedEventHandler(audienceRemovedProjector);
    const valuePropositionAddedEventHandler = new ValuePropositionAddedEventHandler(valuePropositionAddedProjector);
    const valuePropositionUpdatedEventHandler = new ValuePropositionUpdatedEventHandler(valuePropositionUpdatedProjector);
    const valuePropositionRemovedEventHandler = new ValuePropositionRemovedEventHandler(valuePropositionRemovedProjector);
    const relationAddedEventHandler = new RelationAddedEventHandler(relationAddedProjector);
    const relationRemovedEventHandler = new RelationRemovedEventHandler(relationRemovedProjector);

    // Step 7: Register all handlers to sequential bus
    sequentialEventBus.subscribe("SessionStartedEvent", sessionStartedEventHandler);
    sequentialEventBus.subscribe("SessionPausedEvent", sessionPausedEventHandler);
    sequentialEventBus.subscribe("SessionResumedEvent", sessionResumedEventHandler);
    sequentialEventBus.subscribe("SessionEndedEvent", sessionEndedEventHandler);
    sessionSummaryProjectionHandler.subscribe();
    sequentialEventBus.subscribe("GoalAddedEvent", goalAddedEventHandler);
    sequentialEventBus.subscribe("GoalStartedEvent", goalStartedEventHandler);
    sequentialEventBus.subscribe("GoalUpdatedEvent", goalUpdatedEventHandler);
    sequentialEventBus.subscribe("GoalBlockedEvent", goalBlockedEventHandler);
    sequentialEventBus.subscribe("GoalUnblockedEvent", goalUnblockedEventHandler);
    sequentialEventBus.subscribe("GoalPausedEvent", goalPausedEventHandler);
    sequentialEventBus.subscribe("GoalResumedEvent", goalResumedEventHandler);
    sequentialEventBus.subscribe("GoalCompletedEvent", goalCompletedEventHandler);
    sequentialEventBus.subscribe("GoalResetEvent", goalResetEventHandler);
    sequentialEventBus.subscribe("GoalRemovedEvent", goalRemovedEventHandler);
    sequentialEventBus.subscribe("ArchitectureDefinedEvent", architectureDefinedEventHandler);
    sequentialEventBus.subscribe("ArchitectureUpdatedEvent", architectureUpdatedEventHandler);
    sequentialEventBus.subscribe("ComponentAddedEvent", componentAddedEventHandler);
    sequentialEventBus.subscribe("ComponentUpdatedEvent", componentUpdatedEventHandler);
    sequentialEventBus.subscribe("ComponentDeprecatedEvent", componentDeprecatedEventHandler);
    sequentialEventBus.subscribe("ComponentRemovedEvent", componentRemovedEventHandler);
    sequentialEventBus.subscribe("DependencyAddedEvent", dependencyAddedEventHandler);
    sequentialEventBus.subscribe("DependencyUpdatedEvent", dependencyUpdatedEventHandler);
    sequentialEventBus.subscribe("DependencyRemovedEvent", dependencyRemovedEventHandler);
    sequentialEventBus.subscribe("DecisionAddedEvent", decisionAddedEventHandler);
    sequentialEventBus.subscribe("DecisionUpdatedEvent", decisionUpdatedEventHandler);
    sequentialEventBus.subscribe("DecisionReversedEvent", decisionReversedEventHandler);
    sequentialEventBus.subscribe("DecisionSupersededEvent", decisionSupersededEventHandler);
    sequentialEventBus.subscribe("GuidelineAddedEvent", guidelineAddedEventHandler);
    sequentialEventBus.subscribe("GuidelineUpdatedEvent", guidelineUpdatedEventHandler);
    sequentialEventBus.subscribe("GuidelineRemovedEvent", guidelineRemovedEventHandler);
    sequentialEventBus.subscribe("InvariantAddedEvent", invariantAddedEventHandler);
    sequentialEventBus.subscribe("InvariantUpdatedEvent", invariantUpdatedEventHandler);
    sequentialEventBus.subscribe("InvariantRemovedEvent", invariantRemovedEventHandler);
    sequentialEventBus.subscribe("ProjectInitializedEvent", projectInitializedEventHandler);
    sequentialEventBus.subscribe("ProjectUpdatedEvent", projectUpdatedEventHandler);
    sequentialEventBus.subscribe("AudiencePainAddedEvent", audiencePainAddedEventHandler);
    sequentialEventBus.subscribe("AudiencePainUpdatedEvent", audiencePainUpdatedEventHandler);
    sequentialEventBus.subscribe("AudiencePainResolvedEvent", audiencePainResolvedEventHandler);
    sequentialEventBus.subscribe("AudienceAddedEvent", audienceAddedEventHandler);
    sequentialEventBus.subscribe("AudienceUpdatedEvent", audienceUpdatedEventHandler);
    sequentialEventBus.subscribe("AudienceRemovedEvent", audienceRemovedEventHandler);
    sequentialEventBus.subscribe("ValuePropositionAddedEvent", valuePropositionAddedEventHandler);
    sequentialEventBus.subscribe("ValuePropositionUpdatedEvent", valuePropositionUpdatedEventHandler);
    sequentialEventBus.subscribe("ValuePropositionRemovedEvent", valuePropositionRemovedEventHandler);
    sequentialEventBus.subscribe("RelationAddedEvent", relationAddedEventHandler);
    sequentialEventBus.subscribe("RelationRemovedEvent", relationRemovedEventHandler);

    // Step 8: Get all events from event store (file-based, still intact)
    const events = await this.eventStore.getAllEvents();

    // Step 9: Replay each event through the sequential event bus
    let processedCount = 0;
    for (const event of events) {
      await sequentialEventBus.publish(event);
      processedCount++;
    }

    // Step 10: Close the new database connection
    if (newDb && newDb.open) {
      newDb.pragma("wal_checkpoint(TRUNCATE)");
      newDb.close();
    }

    return {
      eventsReplayed: processedCount,
      success: true,
    };
  }
}
