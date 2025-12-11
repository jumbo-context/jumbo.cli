/**
 * Composition Root - Dependency Injection Configuration
 *
 * This is where ALL dependency wiring happens. The single place that knows
 * about concrete infrastructure implementations and assembles them into
 * the ApplicationContainer.
 *
 * Responsibilities:
 * - Instantiate all infrastructure implementations
 * - Wire dependencies together
 * - Manage infrastructure state (directories, databases, migrations)
 * - Return a container that presentation layer consumes
 *
 * No other layer should instantiate infrastructure. Controllers receive
 * the container and use it - they never know what's inside.
 */

import Database from "better-sqlite3";
import path from "path";
import { SystemClock } from "../shared/system/SystemClock.js";
import { FsEventStore } from "../shared/persistence/FsEventStore.js";
import { SqliteConnectionManager } from "../shared/persistence/SqliteConnectionManager.js";
import { MigrationRunner } from "../shared/persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../shared/persistence/migrations.config.js";
import { InProcessEventBus } from "../shared/messaging/InProcessEventBus.js";
import { IDbConnectionManager } from "../shared/persistence/IDbConnectionManager.js";

// Session Event Stores - decomposed by use case
import { FsSessionStartedEventStore } from "../work/sessions/start/FsSessionStartedEventStore.js";
import { FsSessionEndedEventStore } from "../work/sessions/end/FsSessionEndedEventStore.js";
import { FsSessionPausedEventStore } from "../work/sessions/pause/FsSessionPausedEventStore.js";
import { FsSessionResumedEventStore } from "../work/sessions/resume/FsSessionResumedEventStore.js";
// Goal Event Stores - decomposed by use case
import { FsGoalAddedEventStore } from "../work/goals/add/FsGoalAddedEventStore.js";
import { FsGoalStartedEventStore } from "../work/goals/start/FsGoalStartedEventStore.js";
import { FsGoalUpdatedEventStore } from "../work/goals/update/FsGoalUpdatedEventStore.js";
import { FsGoalBlockedEventStore } from "../work/goals/block/FsGoalBlockedEventStore.js";
import { FsGoalUnblockedEventStore } from "../work/goals/unblock/FsGoalUnblockedEventStore.js";
import { FsGoalCompletedEventStore } from "../work/goals/complete/FsGoalCompletedEventStore.js";
import { FsGoalResetEventStore } from "../work/goals/reset/FsGoalResetEventStore.js";
import { FsGoalRemovedEventStore } from "../work/goals/remove/FsGoalRemovedEventStore.js";
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
import { SqliteSessionPausedProjector } from "../work/sessions/pause/SqliteSessionPausedProjector.js";
import { SqliteSessionResumedProjector } from "../work/sessions/resume/SqliteSessionResumedProjector.js";
import { SqliteSessionSummaryProjectionStore } from "../work/sessions/get-context/SqliteSessionSummaryProjectionStore.js";
import { SqliteSessionSummaryReader } from "../work/sessions/get-context/SqliteSessionSummaryReader.js";
// Goal Projection Stores - decomposed by use case
import { SqliteGoalAddedProjector } from "../work/goals/add/SqliteGoalAddedProjector.js";
import { SqliteGoalStartedProjector } from "../work/goals/start/SqliteGoalStartedProjector.js";
import { SqliteGoalUpdatedProjector } from "../work/goals/update/SqliteGoalUpdatedProjector.js";
import { SqliteGoalBlockedProjector } from "../work/goals/block/SqliteGoalBlockedProjector.js";
import { SqliteGoalUnblockedProjector } from "../work/goals/unblock/SqliteGoalUnblockedProjector.js";
import { SqliteGoalCompletedProjector } from "../work/goals/complete/SqliteGoalCompletedProjector.js";
import { SqliteGoalResetProjector } from "../work/goals/reset/SqliteGoalResetProjector.js";
import { SqliteGoalRemovedProjector } from "../work/goals/remove/SqliteGoalRemovedProjector.js";
import { SqliteGoalContextReader } from "../work/goals/get-context/SqliteGoalContextReader.js";
import { SqliteGoalStatusReader } from "../work/goals/SqliteGoalStatusReader.js";
// Decision Projection Stores - decomposed by use case
import { SqliteDecisionAddedProjector } from "../solution/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../solution/decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../solution/decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionSupersededProjector } from "../solution/decisions/supersede/SqliteDecisionSupersededProjector.js";
import { SqliteDecisionContextReader } from "../solution/decisions/get-context/SqliteDecisionContextReader.js";
import { SqliteDecisionSessionReader } from "../solution/decisions/get-context/SqliteDecisionSessionReader.js";
// Architecture Projection Stores - decomposed by use case
import { SqliteArchitectureDefinedProjector } from "../solution/architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../solution/architecture/update/SqliteArchitectureUpdatedProjector.js";
// Component Projection Stores - decomposed by use case
import { SqliteComponentAddedProjector } from "../solution/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../solution/components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../solution/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../solution/components/remove/SqliteComponentRemovedProjector.js";
import { SqliteComponentContextReader } from "../solution/components/get-context/SqliteComponentContextReader.js";
// Dependency Projection Stores - decomposed by use case
import { SqliteDependencyAddedProjector } from "../solution/dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../solution/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../solution/dependencies/remove/SqliteDependencyRemovedProjector.js";
import { SqliteDependencyContextReader } from "../solution/dependencies/get-context/SqliteDependencyContextReader.js";
// Guideline Projection Stores - decomposed by use case
import { SqliteGuidelineAddedProjector } from "../solution/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../solution/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../solution/guidelines/remove/SqliteGuidelineRemovedProjector.js";
import { SqliteGuidelineContextReader } from "../solution/guidelines/get-context/SqliteGuidelineContextReader.js";
// Invariant Projection Stores - decomposed by use case
import { SqliteInvariantAddedProjector } from "../solution/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../solution/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../solution/invariants/remove/SqliteInvariantRemovedProjector.js";
import { SqliteInvariantContextReader } from "../solution/invariants/get-context/SqliteInvariantContextReader.js";
// Relations Projection Stores - decomposed by use case
import { SqliteRelationAddedProjector } from "../relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationRemovedProjector } from "../relations/remove/SqliteRelationRemovedProjector.js";
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
// Audience Context Reader
import { SqliteAudienceContextReader } from "../project-knowledge/audiences/query/SqliteAudienceContextReader.js";
// AudiencePain Context Reader
import { SqliteAudiencePainContextReader } from "../project-knowledge/audience-pains/query/SqliteAudiencePainContextReader.js";
// CLI Metadata Reader
import { BuildTimeCliMetadataReader } from "../cli-metadata/query/BuildTimeCliMetadataReader.js";
// Solution Context Reader
import { SqliteSolutionContextReader } from "../solution/SqliteSolutionContextReader.js";

// Event Handlers (Projection Handlers)
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
import { GoalCompletedEventHandler } from "../../application/work/goals/complete/GoalCompletedEventHandler.js";
import { GoalResetEventHandler } from "../../application/work/goals/reset/GoalResetEventHandler.js";
import { GoalRemovedEventHandler } from "../../application/work/goals/remove/GoalRemovedEventHandler.js";
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

// Port interfaces for session projection stores - decomposed by use case
import { ISessionStartedProjector } from "../../application/work/sessions/start/ISessionStartedProjector.js";
import { ISessionEndedProjector } from "../../application/work/sessions/end/ISessionEndedProjector.js";
import { IActiveSessionReader } from "../../application/work/sessions/end/IActiveSessionReader.js";
import { ISessionPausedProjector } from "../../application/work/sessions/pause/ISessionPausedProjector.js";
import { ISessionResumedProjector } from "../../application/work/sessions/resume/ISessionResumedProjector.js";
import { ISessionSummaryProjectionStore } from "../../application/work/sessions/get-context/ISessionSummaryProjectionStore.js";
import { ISessionSummaryReader } from "../../application/work/sessions/get-context/ISessionSummaryReader.js";
import { IGoalAddedProjector } from "../../application/work/goals/add/IGoalAddedProjector.js";
import { IGoalStartedProjector } from "../../application/work/goals/start/IGoalStartedProjector.js";
import { IGoalReader } from "../../application/work/goals/start/IGoalReader.js";
import { IGoalUpdatedProjector } from "../../application/work/goals/update/IGoalUpdatedProjector.js";
import { IGoalUpdateReader } from "../../application/work/goals/update/IGoalUpdateReader.js";
import { IGoalBlockedProjector } from "../../application/work/goals/block/IGoalBlockedProjector.js";
import { IGoalUnblockedProjector } from "../../application/work/goals/unblock/IGoalUnblockedProjector.js";
import { IGoalCompletedProjector } from "../../application/work/goals/complete/IGoalCompletedProjector.js";
import { IGoalCompleteReader } from "../../application/work/goals/complete/IGoalCompleteReader.js";
import { IGoalResetProjector } from "../../application/work/goals/reset/IGoalResetProjector.js";
import { IGoalResetReader } from "../../application/work/goals/reset/IGoalResetReader.js";
import { IGoalRemovedProjector } from "../../application/work/goals/remove/IGoalRemovedProjector.js";
import { IGoalRemoveReader } from "../../application/work/goals/remove/IGoalRemoveReader.js";
import { IGoalContextReader } from "../../application/work/goals/get-context/IGoalContextReader.js";
import { IGoalStatusReader } from "../../application/work/goals/IGoalStatusReader.js";
import { IGoalReadForSessionSummary } from "../../application/work/sessions/get-context/IGoalReadForSessionSummary.js";
import { IDecisionAddedProjector } from "../../application/solution/decisions/add/IDecisionAddedProjector.js";
import { IDecisionUpdatedProjector } from "../../application/solution/decisions/update/IDecisionUpdatedProjector.js";
import { IDecisionUpdateReader } from "../../application/solution/decisions/update/IDecisionUpdateReader.js";
import { IDecisionReversedProjector } from "../../application/solution/decisions/reverse/IDecisionReversedProjector.js";
import { IDecisionReverseReader } from "../../application/solution/decisions/reverse/IDecisionReverseReader.js";
import { IDecisionSupersededProjector } from "../../application/solution/decisions/supersede/IDecisionSupersededProjector.js";
import { IDecisionSupersedeReader } from "../../application/solution/decisions/supersede/IDecisionSupersedeReader.js";
import { IDecisionContextReader } from "../../application/work/goals/get-context/IDecisionContextReader.js";
import { IDecisionSessionReader } from "../../application/work/sessions/get-context/IDecisionSessionReader.js";
import { IArchitectureDefinedProjector } from "../../application/solution/architecture/define/IArchitectureDefinedProjector.js";
import { IArchitectureDefineReader } from "../../application/solution/architecture/define/IArchitectureDefineReader.js";
import { IArchitectureUpdatedProjector } from "../../application/solution/architecture/update/IArchitectureUpdatedProjector.js";
import { IArchitectureUpdateReader } from "../../application/solution/architecture/update/IArchitectureUpdateReader.js";
import { IComponentAddedProjector } from "../../application/solution/components/add/IComponentAddedProjector.js";
import { IComponentAddReader } from "../../application/solution/components/add/IComponentAddReader.js";
import { IComponentUpdatedProjector } from "../../application/solution/components/update/IComponentUpdatedProjector.js";
import { IComponentUpdateReader } from "../../application/solution/components/update/IComponentUpdateReader.js";
import { IComponentDeprecatedProjector } from "../../application/solution/components/deprecate/IComponentDeprecatedProjector.js";
import { IComponentDeprecateReader } from "../../application/solution/components/deprecate/IComponentDeprecateReader.js";
import { IComponentRemovedProjector } from "../../application/solution/components/remove/IComponentRemovedProjector.js";
import { IComponentRemoveReader } from "../../application/solution/components/remove/IComponentRemoveReader.js";
import { IComponentContextReader } from "../../application/work/goals/get-context/IComponentContextReader.js";
import { IDependencyAddedProjector } from "../../application/solution/dependencies/add/IDependencyAddedProjector.js";
import { IDependencyAddReader } from "../../application/solution/dependencies/add/IDependencyAddReader.js";
import { IDependencyUpdatedProjector } from "../../application/solution/dependencies/update/IDependencyUpdatedProjector.js";
import { IDependencyUpdateReader } from "../../application/solution/dependencies/update/IDependencyUpdateReader.js";
import { IDependencyRemovedProjector } from "../../application/solution/dependencies/remove/IDependencyRemovedProjector.js";
import { IDependencyRemoveReader } from "../../application/solution/dependencies/remove/IDependencyRemoveReader.js";
import { IDependencyContextReader } from "../../application/work/goals/get-context/IDependencyContextReader.js";
import { IGuidelineAddedProjector } from "../../application/solution/guidelines/add/IGuidelineAddedProjector.js";
import { IGuidelineUpdatedProjector } from "../../application/solution/guidelines/update/IGuidelineUpdatedProjector.js";
import { IGuidelineUpdateReader } from "../../application/solution/guidelines/update/IGuidelineUpdateReader.js";
import { IGuidelineRemovedProjector } from "../../application/solution/guidelines/remove/IGuidelineRemovedProjector.js";
import { IGuidelineRemoveReader } from "../../application/solution/guidelines/remove/IGuidelineRemoveReader.js";
import { IGuidelineContextReader } from "../../application/work/goals/get-context/IGuidelineContextReader.js";
import { IInvariantAddedProjector } from "../../application/solution/invariants/add/IInvariantAddedProjector.js";
import { IInvariantAddReader } from "../../application/solution/invariants/add/IInvariantAddReader.js";
import { IInvariantUpdatedProjector } from "../../application/solution/invariants/update/IInvariantUpdatedProjector.js";
import { IInvariantUpdateReader } from "../../application/solution/invariants/update/IInvariantUpdateReader.js";
import { IInvariantRemovedProjector } from "../../application/solution/invariants/remove/IInvariantRemovedProjector.js";
import { IInvariantRemoveReader } from "../../application/solution/invariants/remove/IInvariantRemoveReader.js";
import { IInvariantContextReader } from "../../application/work/goals/get-context/IInvariantContextReader.js";
// Relations Projection Store ports - decomposed by use case
import { IRelationAddedProjector } from "../../application/relations/add/IRelationAddedProjector.js";
import { IRelationAddedReader } from "../../application/relations/add/IRelationAddedReader.js";
import { IRelationRemovedProjector } from "../../application/relations/remove/IRelationRemovedProjector.js";
import { IRelationRemovedReader } from "../../application/relations/remove/IRelationRemovedReader.js";
import { IRelationReader } from "../../application/relations/IRelationReader.js";
// Audience Pain Projection Store ports - decomposed by use case
import { IAudiencePainAddedProjector } from "../../application/project-knowledge/audience-pains/add/IAudiencePainAddedProjector.js";
import { IAudiencePainUpdatedProjector } from "../../application/project-knowledge/audience-pains/update/IAudiencePainUpdatedProjector.js";
import { IAudiencePainResolvedProjector } from "../../application/project-knowledge/audience-pains/resolve/IAudiencePainResolvedProjector.js";
import { IAudiencePainUpdateReader } from "../../application/project-knowledge/audience-pains/update/IAudiencePainUpdateReader.js";
// Audience Projection Store ports - decomposed by use case
import { IAudienceAddedProjector } from "../../application/project-knowledge/audiences/add/IAudienceAddedProjector.js";
import { IAudienceUpdatedProjector } from "../../application/project-knowledge/audiences/update/IAudienceUpdatedProjector.js";
import { IAudienceRemovedProjector } from "../../application/project-knowledge/audiences/remove/IAudienceRemovedProjector.js";
import { IAudienceRemoveReader } from "../../application/project-knowledge/audiences/remove/IAudienceRemoveReader.js";
// Value Proposition Projection Store ports - decomposed by use case
import { IValuePropositionAddedProjector } from "../../application/project-knowledge/value-propositions/add/IValuePropositionAddedProjector.js";
import { IValuePropositionUpdatedProjector } from "../../application/project-knowledge/value-propositions/update/IValuePropositionUpdatedProjector.js";
import { IValuePropositionRemovedProjector } from "../../application/project-knowledge/value-propositions/remove/IValuePropositionRemovedProjector.js";
import { IValuePropositionUpdateReader } from "../../application/project-knowledge/value-propositions/update/IValuePropositionUpdateReader.js";
import { IValuePropositionRemoveReader } from "../../application/project-knowledge/value-propositions/remove/IValuePropositionRemoveReader.js";
import { IProjectInitializedProjector } from "../../application/project-knowledge/project/init/IProjectInitializedProjector.js";
import { IProjectUpdatedProjector } from "../../application/project-knowledge/project/update/IProjectUpdatedProjector.js";
import { IProjectInitReader } from "../../application/project-knowledge/project/init/IProjectInitReader.js";
import { IProjectUpdateReader } from "../../application/project-knowledge/project/update/IProjectUpdateReader.js";
import { IProjectContextReader } from "../../application/project-knowledge/project/query/IProjectContextReader.js";
import { IProjectInitializedEventWriter } from "../../application/project-knowledge/project/init/IProjectInitializedEventWriter.js";
import { IProjectUpdatedEventWriter } from "../../application/project-knowledge/project/update/IProjectUpdatedEventWriter.js";
import { IAgentFileProtocol } from "../../application/project-knowledge/project/init/IAgentFileProtocol.js";
import { IAudienceContextReader } from "../../application/project-knowledge/audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../application/project-knowledge/audience-pains/query/IAudiencePainContextReader.js";
import { ICliMetadataReader } from "../../application/cli-metadata/query/ICliMetadataReader.js";
// Solution Context
import { ISolutionContextReader } from "../../application/solution/ISolutionContextReader.js";
import { UnprimedBrownfieldQualifier } from "../../application/solution/UnprimedBrownfieldQualifier.js";

// Port interfaces for session event stores - decomposed by use case
import { ISessionStartedEventWriter } from "../../application/work/sessions/start/ISessionStartedEventWriter.js";
import { ISessionEndedEventWriter } from "../../application/work/sessions/end/ISessionEndedEventWriter.js";
import { ISessionEndedEventReader } from "../../application/work/sessions/end/ISessionEndedEventReader.js";
import { ISessionPausedEventWriter } from "../../application/work/sessions/pause/ISessionPausedEventWriter.js";
import { ISessionPausedEventReader } from "../../application/work/sessions/pause/ISessionPausedEventReader.js";
import { ISessionResumedEventWriter } from "../../application/work/sessions/resume/ISessionResumedEventWriter.js";
import { ISessionResumedEventReader } from "../../application/work/sessions/resume/ISessionResumedEventReader.js";
// Goal Event Store ports - decomposed by use case
import { IGoalAddedEventWriter } from "../../application/work/goals/add/IGoalAddedEventWriter.js";
import { IGoalStartedEventWriter } from "../../application/work/goals/start/IGoalStartedEventWriter.js";
import { IGoalStartedEventReader } from "../../application/work/goals/start/IGoalStartedEventReader.js";
import { IGoalUpdatedEventWriter } from "../../application/work/goals/update/IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "../../application/work/goals/update/IGoalUpdatedEventReader.js";
import { IGoalBlockedEventWriter } from "../../application/work/goals/block/IGoalBlockedEventWriter.js";
import { IGoalBlockedEventReader } from "../../application/work/goals/block/IGoalBlockedEventReader.js";
import { IGoalUnblockedEventWriter } from "../../application/work/goals/unblock/IGoalUnblockedEventWriter.js";
import { IGoalUnblockedEventReader } from "../../application/work/goals/unblock/IGoalUnblockedEventReader.js";
import { IGoalCompletedEventWriter } from "../../application/work/goals/complete/IGoalCompletedEventWriter.js";
import { IGoalCompletedEventReader } from "../../application/work/goals/complete/IGoalCompletedEventReader.js";
import { IGoalResetEventWriter } from "../../application/work/goals/reset/IGoalResetEventWriter.js";
import { IGoalResetEventReader } from "../../application/work/goals/reset/IGoalResetEventReader.js";
import { IGoalRemovedEventWriter } from "../../application/work/goals/remove/IGoalRemovedEventWriter.js";
import { IGoalRemovedEventReader } from "../../application/work/goals/remove/IGoalRemovedEventReader.js";
import { IDecisionAddedEventWriter } from "../../application/solution/decisions/add/IDecisionAddedEventWriter.js";
import { IDecisionUpdatedEventWriter } from "../../application/solution/decisions/update/IDecisionUpdatedEventWriter.js";
import { IDecisionReversedEventWriter } from "../../application/solution/decisions/reverse/IDecisionReversedEventWriter.js";
import { IDecisionSupersededEventWriter } from "../../application/solution/decisions/supersede/IDecisionSupersededEventWriter.js";
import { IArchitectureDefinedEventWriter } from "../../application/solution/architecture/define/IArchitectureDefinedEventWriter.js";
import { IArchitectureUpdatedEventWriter } from "../../application/solution/architecture/update/IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "../../application/solution/architecture/update/IArchitectureUpdatedEventReader.js";
import { IComponentAddedEventWriter } from "../../application/solution/components/add/IComponentAddedEventWriter.js";
import { IComponentUpdatedEventWriter } from "../../application/solution/components/update/IComponentUpdatedEventWriter.js";
import { IComponentDeprecatedEventWriter } from "../../application/solution/components/deprecate/IComponentDeprecatedEventWriter.js";
import { IComponentRemovedEventWriter } from "../../application/solution/components/remove/IComponentRemovedEventWriter.js";
import { IDependencyAddedEventWriter } from "../../application/solution/dependencies/add/IDependencyAddedEventWriter.js";
import { IDependencyUpdatedEventWriter } from "../../application/solution/dependencies/update/IDependencyUpdatedEventWriter.js";
import { IDependencyUpdatedEventReader } from "../../application/solution/dependencies/update/IDependencyUpdatedEventReader.js";
import { IDependencyRemovedEventWriter } from "../../application/solution/dependencies/remove/IDependencyRemovedEventWriter.js";
import { IDependencyRemovedEventReader } from "../../application/solution/dependencies/remove/IDependencyRemovedEventReader.js";
import { IGuidelineAddedEventWriter } from "../../application/solution/guidelines/add/IGuidelineAddedEventWriter.js";
import { IGuidelineUpdatedEventWriter } from "../../application/solution/guidelines/update/IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "../../application/solution/guidelines/update/IGuidelineUpdatedEventReader.js";
import { IGuidelineRemovedEventWriter } from "../../application/solution/guidelines/remove/IGuidelineRemovedEventWriter.js";
import { IGuidelineRemovedEventReader } from "../../application/solution/guidelines/remove/IGuidelineRemovedEventReader.js";
import { IInvariantAddedEventWriter } from "../../application/solution/invariants/add/IInvariantAddedEventWriter.js";
import { IInvariantUpdatedEventWriter } from "../../application/solution/invariants/update/IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "../../application/solution/invariants/update/IInvariantUpdatedEventReader.js";
import { IInvariantRemovedEventWriter } from "../../application/solution/invariants/remove/IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "../../application/solution/invariants/remove/IInvariantRemovedEventReader.js";
import { IAudienceAddedEventWriter } from "../../application/project-knowledge/audiences/add/IAudienceAddedEventWriter.js";
import { IAudienceUpdatedEventWriter } from "../../application/project-knowledge/audiences/update/IAudienceUpdatedEventWriter.js";
import { IAudienceRemovedEventWriter } from "../../application/project-knowledge/audiences/remove/IAudienceRemovedEventWriter.js";
import { IAudiencePainAddedEventWriter } from "../../application/project-knowledge/audience-pains/add/IAudiencePainAddedEventWriter.js";
import { IAudiencePainUpdatedEventWriter } from "../../application/project-knowledge/audience-pains/update/IAudiencePainUpdatedEventWriter.js";
import { IAudiencePainResolvedEventWriter } from "../../application/project-knowledge/audience-pains/resolve/IAudiencePainResolvedEventWriter.js";
import { IValuePropositionAddedEventWriter } from "../../application/project-knowledge/value-propositions/add/IValuePropositionAddedEventWriter.js";
import { IValuePropositionUpdatedEventWriter } from "../../application/project-knowledge/value-propositions/update/IValuePropositionUpdatedEventWriter.js";
import { IValuePropositionRemovedEventWriter } from "../../application/project-knowledge/value-propositions/remove/IValuePropositionRemovedEventWriter.js";
// Relations Event Store ports - decomposed by use case
import { IRelationAddedEventWriter } from "../../application/relations/add/IRelationAddedEventWriter.js";
import { IRelationRemovedEventWriter } from "../../application/relations/remove/IRelationRemovedEventWriter.js";
import { IRelationRemovedEventReader } from "../../application/relations/remove/IRelationRemovedEventReader.js";

/**
 * ApplicationContainer - Complete dependency injection container
 *
 * Contains all infrastructure components, event stores, projection stores,
 * and cross-cutting services needed by the application.
 *
 * This container is created once at application startup and provides
 * all dependencies to CLI commands and other application components.
 */
export interface ApplicationContainer {
  // Core Infrastructure
  eventBus: InProcessEventBus;
  eventStore: FsEventStore;
  clock: SystemClock;
  dbConnectionManager: IDbConnectionManager;
  db: Database.Database;

  // CLI Metadata
  cliMetadataReader: ICliMetadataReader;

  // Work Category - Session Event Stores - decomposed by use case
  sessionStartedEventStore: ISessionStartedEventWriter;
  sessionEndedEventStore: ISessionEndedEventWriter & ISessionEndedEventReader;
  sessionPausedEventStore: ISessionPausedEventWriter & ISessionPausedEventReader;
  sessionResumedEventStore: ISessionResumedEventWriter & ISessionResumedEventReader;
  // Goal Event Stores - decomposed by use case
  goalAddedEventStore: IGoalAddedEventWriter;
  goalStartedEventStore: IGoalStartedEventWriter & IGoalStartedEventReader;
  goalUpdatedEventStore: IGoalUpdatedEventWriter & IGoalUpdatedEventReader;
  goalBlockedEventStore: IGoalBlockedEventWriter & IGoalBlockedEventReader;
  goalUnblockedEventStore: IGoalUnblockedEventWriter & IGoalUnblockedEventReader;
  goalCompletedEventStore: IGoalCompletedEventWriter & IGoalCompletedEventReader;
  goalResetEventStore: IGoalResetEventWriter & IGoalResetEventReader;
  goalRemovedEventStore: IGoalRemovedEventWriter & IGoalRemovedEventReader;

  // Work Category - Session Projection Stores - decomposed by use case
  sessionStartedProjector: ISessionStartedProjector;
  sessionEndedProjector: ISessionEndedProjector;
  activeSessionReader: IActiveSessionReader;
  sessionPausedProjector: ISessionPausedProjector;
  sessionResumedProjector: ISessionResumedProjector;
  sessionSummaryProjectionStore: ISessionSummaryProjectionStore;
  sessionSummaryReader: ISessionSummaryReader;
  // Goal Projection Stores - decomposed by use case
  goalAddedProjector: IGoalAddedProjector;
  goalStartedProjector: IGoalStartedProjector & IGoalReader;
  goalUpdatedProjector: IGoalUpdatedProjector & IGoalUpdateReader;
  goalBlockedProjector: IGoalBlockedProjector;
  goalUnblockedProjector: IGoalUnblockedProjector;
  goalCompletedProjector: IGoalCompletedProjector & IGoalCompleteReader;
  goalResetProjector: IGoalResetProjector & IGoalResetReader;
  goalRemovedProjector: IGoalRemovedProjector & IGoalRemoveReader;
  goalContextReader: IGoalContextReader;
  goalStatusReader: IGoalStatusReader & IGoalReadForSessionSummary;

  // Solution Category - Event Stores
  // Architecture Event Stores - decomposed by use case
  architectureDefinedEventStore: IArchitectureDefinedEventWriter;
  architectureUpdatedEventStore: IArchitectureUpdatedEventWriter & IArchitectureUpdatedEventReader;
  // Component Event Stores - decomposed by use case
  componentAddedEventStore: IComponentAddedEventWriter;
  componentUpdatedEventStore: IComponentUpdatedEventWriter;
  componentDeprecatedEventStore: IComponentDeprecatedEventWriter;
  componentRemovedEventStore: IComponentRemovedEventWriter;
  // Dependency Event Stores - decomposed by use case
  dependencyAddedEventStore: IDependencyAddedEventWriter;
  dependencyUpdatedEventStore: IDependencyUpdatedEventWriter & IDependencyUpdatedEventReader;
  dependencyRemovedEventStore: IDependencyRemovedEventWriter & IDependencyRemovedEventReader;
  // Decision Event Stores - decomposed by use case
  decisionAddedEventStore: IDecisionAddedEventWriter;
  decisionUpdatedEventStore: IDecisionUpdatedEventWriter;
  decisionReversedEventStore: IDecisionReversedEventWriter;
  decisionSupersededEventStore: IDecisionSupersededEventWriter;
  // Guideline Event Stores - decomposed by use case
  guidelineAddedEventStore: IGuidelineAddedEventWriter;
  guidelineUpdatedEventStore: IGuidelineUpdatedEventWriter & IGuidelineUpdatedEventReader;
  guidelineRemovedEventStore: IGuidelineRemovedEventWriter & IGuidelineRemovedEventReader;
  // Invariant Event Stores - decomposed by use case
  invariantAddedEventStore: IInvariantAddedEventWriter;
  invariantUpdatedEventStore: IInvariantUpdatedEventWriter & IInvariantUpdatedEventReader;
  invariantRemovedEventStore: IInvariantRemovedEventWriter & IInvariantRemovedEventReader;

  // Solution Category - Projection Stores
  // Architecture Projection Stores - decomposed by use case
  architectureDefinedProjector: IArchitectureDefinedProjector & IArchitectureDefineReader;
  architectureUpdatedProjector: IArchitectureUpdatedProjector & IArchitectureUpdateReader;
  // Component Projection Stores - decomposed by use case
  componentAddedProjector: IComponentAddedProjector & IComponentAddReader;
  componentUpdatedProjector: IComponentUpdatedProjector & IComponentUpdateReader;
  componentDeprecatedProjector: IComponentDeprecatedProjector & IComponentDeprecateReader;
  componentRemovedProjector: IComponentRemovedProjector & IComponentRemoveReader;
  componentContextReader: IComponentContextReader;
  // Dependency Projection Stores - decomposed by use case
  dependencyAddedProjector: IDependencyAddedProjector & IDependencyAddReader;
  dependencyUpdatedProjector: IDependencyUpdatedProjector & IDependencyUpdateReader;
  dependencyRemovedProjector: IDependencyRemovedProjector & IDependencyRemoveReader;
  dependencyContextReader: IDependencyContextReader;
  // Decision Projection Stores - decomposed by use case
  decisionAddedProjector: IDecisionAddedProjector;
  decisionUpdatedProjector: IDecisionUpdatedProjector & IDecisionUpdateReader;
  decisionReversedProjector: IDecisionReversedProjector & IDecisionReverseReader;
  decisionSupersededProjector: IDecisionSupersededProjector & IDecisionSupersedeReader;
  decisionContextReader: IDecisionContextReader;
  decisionSessionReader: IDecisionSessionReader;
  // Guideline Projection Stores - decomposed by use case
  guidelineAddedProjector: IGuidelineAddedProjector;
  guidelineUpdatedProjector: IGuidelineUpdatedProjector & IGuidelineUpdateReader;
  guidelineRemovedProjector: IGuidelineRemovedProjector & IGuidelineRemoveReader;
  guidelineContextReader: IGuidelineContextReader;
  // Invariant Projection Stores - decomposed by use case
  invariantAddedProjector: IInvariantAddedProjector & IInvariantAddReader;
  invariantUpdatedProjector: IInvariantUpdatedProjector & IInvariantUpdateReader;
  invariantRemovedProjector: IInvariantRemovedProjector & IInvariantRemoveReader;
  invariantContextReader: IInvariantContextReader;
  // Solution Context - cross-cutting reader and qualifier
  solutionContextReader: ISolutionContextReader;
  unprimedBrownfieldQualifier: UnprimedBrownfieldQualifier;

  // Project Knowledge Category - Event Stores
  // Project Event Stores - decomposed by use case
  projectInitializedEventStore: IProjectInitializedEventWriter;
  projectUpdatedEventStore: IProjectUpdatedEventWriter;
  // Project Services
  agentFileProtocol: IAgentFileProtocol;
  // Audience Event Stores - decomposed by use case
  audienceAddedEventStore: IAudienceAddedEventWriter;
  audienceUpdatedEventStore: IAudienceUpdatedEventWriter;
  audienceRemovedEventStore: IAudienceRemovedEventWriter;
  // AudiencePain Event Stores - decomposed by use case
  audiencePainAddedEventStore: IAudiencePainAddedEventWriter;
  audiencePainUpdatedEventStore: IAudiencePainUpdatedEventWriter;
  audiencePainResolvedEventStore: IAudiencePainResolvedEventWriter;
  // ValueProposition Event Stores - decomposed by use case
  valuePropositionAddedEventStore: IValuePropositionAddedEventWriter;
  valuePropositionUpdatedEventStore: IValuePropositionUpdatedEventWriter;
  valuePropositionRemovedEventStore: IValuePropositionRemovedEventWriter;

  // Project Knowledge Category - Projection Stores
  // Project Projection Stores - decomposed by use case
  projectInitializedProjector: IProjectInitializedProjector & IProjectInitReader;
  projectUpdatedProjector: IProjectUpdatedProjector & IProjectUpdateReader;
  projectContextReader: IProjectContextReader;
  // Audience Projection Stores - decomposed by use case
  audienceAddedProjector: IAudienceAddedProjector;
  audienceUpdatedProjector: IAudienceUpdatedProjector;
  audienceRemovedProjector: IAudienceRemovedProjector & IAudienceRemoveReader;
  audienceContextReader: IAudienceContextReader;
  // AudiencePain Projection Stores - decomposed by use case
  audiencePainAddedProjector: IAudiencePainAddedProjector;
  audiencePainUpdatedProjector: IAudiencePainUpdatedProjector & IAudiencePainUpdateReader;
  audiencePainResolvedProjector: IAudiencePainResolvedProjector;
  audiencePainContextReader: IAudiencePainContextReader;
  // ValueProposition Projection Stores - decomposed by use case
  valuePropositionAddedProjector: IValuePropositionAddedProjector;
  valuePropositionUpdatedProjector: IValuePropositionUpdatedProjector & IValuePropositionUpdateReader;
  valuePropositionRemovedProjector: IValuePropositionRemovedProjector & IValuePropositionRemoveReader;

  // Relations Category - Event Stores - decomposed by use case
  relationAddedEventStore: IRelationAddedEventWriter;
  relationRemovedEventStore: IRelationRemovedEventWriter & IRelationRemovedEventReader;

  // Relations Category - Projection Stores - decomposed by use case
  relationAddedProjector: IRelationAddedProjector & IRelationAddedReader;
  relationRemovedProjector: IRelationRemovedProjector & IRelationRemovedReader & IRelationReader;
}

/**
 * Bootstrap function - Creates and wires the entire application
 */
export function bootstrap(jumboRoot: string): ApplicationContainer {
  // ============================================================
  // STEP 1: Ensure infrastructure directory exists
  // ============================================================

  const fs = require("fs-extra");
  fs.ensureDirSync(jumboRoot);

  // ============================================================
  // STEP 2: Create Core Infrastructure
  // ============================================================

  const clock = new SystemClock();
  const eventStore = new FsEventStore(jumboRoot);
  const dbConnectionManager = new SqliteConnectionManager(path.join(jumboRoot, "jumbo.db"));
  const db = dbConnectionManager.getConnection();
  const eventBus = new InProcessEventBus();
  const cliMetadataReader = new BuildTimeCliMetadataReader();

  // ============================================================
  // STEP 1.5: Run Database Migrations (Namespace-based)
  // ============================================================

  const migrationRunner = new MigrationRunner(db);
  const infrastructureDir = path.resolve(__dirname, "..");
  const namespaceMigrations = getNamespaceMigrations(infrastructureDir);
  migrationRunner.runNamespaceMigrations(namespaceMigrations);

  // ============================================================
  // STEP 2: Create Domain Event Stores
  // ============================================================

  // Work Category - Session Event Stores - decomposed by use case
  const sessionStartedEventStore = new FsSessionStartedEventStore(jumboRoot);
  const sessionEndedEventStore = new FsSessionEndedEventStore(jumboRoot);
  const sessionPausedEventStore = new FsSessionPausedEventStore(jumboRoot);
  const sessionResumedEventStore = new FsSessionResumedEventStore(jumboRoot);
  // Goal Event Stores - decomposed by use case
  const goalAddedEventStore = new FsGoalAddedEventStore(jumboRoot);
  const goalStartedEventStore = new FsGoalStartedEventStore(jumboRoot);
  const goalUpdatedEventStore = new FsGoalUpdatedEventStore(jumboRoot);
  const goalBlockedEventStore = new FsGoalBlockedEventStore(jumboRoot);
  const goalUnblockedEventStore = new FsGoalUnblockedEventStore(jumboRoot);
  const goalCompletedEventStore = new FsGoalCompletedEventStore(jumboRoot);
  const goalResetEventStore = new FsGoalResetEventStore(jumboRoot);
  const goalRemovedEventStore = new FsGoalRemovedEventStore(jumboRoot);

  // Solution Category
  // Architecture Event Stores - decomposed by use case
  const architectureDefinedEventStore = new FsArchitectureDefinedEventStore(jumboRoot);
  const architectureUpdatedEventStore = new FsArchitectureUpdatedEventStore(jumboRoot);
  // Component Event Stores - decomposed by use case
  const componentAddedEventStore = new FsComponentAddedEventStore(jumboRoot);
  const componentUpdatedEventStore = new FsComponentUpdatedEventStore(jumboRoot);
  const componentDeprecatedEventStore = new FsComponentDeprecatedEventStore(jumboRoot);
  const componentRemovedEventStore = new FsComponentRemovedEventStore(jumboRoot);
  // Dependency Event Stores - decomposed by use case
  const dependencyAddedEventStore = new FsDependencyAddedEventStore(jumboRoot);
  const dependencyUpdatedEventStore = new FsDependencyUpdatedEventStore(jumboRoot);
  const dependencyRemovedEventStore = new FsDependencyRemovedEventStore(jumboRoot);
  // Decision Event Stores - decomposed by use case
  const decisionAddedEventStore = new FsDecisionAddedEventStore(jumboRoot);
  const decisionUpdatedEventStore = new FsDecisionUpdatedEventStore(jumboRoot);
  const decisionReversedEventStore = new FsDecisionReversedEventStore(jumboRoot);
  const decisionSupersededEventStore = new FsDecisionSupersededEventStore(jumboRoot);
  // Guideline Event Stores - decomposed by use case
  const guidelineAddedEventStore = new FsGuidelineAddedEventStore(jumboRoot);
  const guidelineUpdatedEventStore = new FsGuidelineUpdatedEventStore(jumboRoot);
  const guidelineRemovedEventStore = new FsGuidelineRemovedEventStore(jumboRoot);
  // Invariant Event Stores - decomposed by use case
  const invariantAddedEventStore = new FsInvariantAddedEventStore(jumboRoot);
  const invariantUpdatedEventStore = new FsInvariantUpdatedEventStore(jumboRoot);
  const invariantRemovedEventStore = new FsInvariantRemovedEventStore(jumboRoot);

  // Project Knowledge Category
  // Project Event Stores - decomposed by use case
  const projectInitializedEventStore = new FsProjectInitializedEventStore(jumboRoot);
  const projectUpdatedEventStore = new FsProjectUpdatedEventStore(jumboRoot);
  // Project Services
  const agentFileProtocol = new AgentFileProtocol();
  // Audience Event Stores - decomposed by use case
  const audienceAddedEventStore = new FsAudienceAddedEventStore(jumboRoot);
  const audienceUpdatedEventStore = new FsAudienceUpdatedEventStore(jumboRoot);
  const audienceRemovedEventStore = new FsAudienceRemovedEventStore(jumboRoot);
  // AudiencePain Event Stores - decomposed by use case
  const audiencePainAddedEventStore = new FsAudiencePainAddedEventStore(jumboRoot);
  const audiencePainUpdatedEventStore = new FsAudiencePainUpdatedEventStore(jumboRoot);
  const audiencePainResolvedEventStore = new FsAudiencePainResolvedEventStore(jumboRoot);
  // ValueProposition Event Stores - decomposed by use case
  const valuePropositionAddedEventStore = new FsValuePropositionAddedEventStore(jumboRoot);
  const valuePropositionUpdatedEventStore = new FsValuePropositionUpdatedEventStore(jumboRoot);
  const valuePropositionRemovedEventStore = new FsValuePropositionRemovedEventStore(jumboRoot);

  // Relations Category - Event Stores - decomposed by use case
  const relationAddedEventStore = new FsRelationAddedEventStore(jumboRoot);
  const relationRemovedEventStore = new FsRelationRemovedEventStore(jumboRoot);

  // ============================================================
  // STEP 3: Create Projection Stores (Read Models)
  // ============================================================

  // Work Category - Session Projection Stores - decomposed by use case
  const sessionStartedProjector = new SqliteSessionStartedProjector(db);
  const sessionEndedProjector = new SqliteSessionEndedProjector(db);
  const activeSessionReader = new SqliteActiveSessionReader(db);
  const sessionPausedProjector = new SqliteSessionPausedProjector(db);
  const sessionResumedProjector = new SqliteSessionResumedProjector(db);
  const sessionSummaryProjectionStore = new SqliteSessionSummaryProjectionStore(db);
  const sessionSummaryReader = new SqliteSessionSummaryReader(db);
  // Goal Projection Stores - decomposed by use case
  const goalAddedProjector = new SqliteGoalAddedProjector(db);
  const goalStartedProjector = new SqliteGoalStartedProjector(db);
  const goalUpdatedProjector = new SqliteGoalUpdatedProjector(db);
  const goalBlockedProjector = new SqliteGoalBlockedProjector(db);
  const goalUnblockedProjector = new SqliteGoalUnblockedProjector(db);
  const goalCompletedProjector = new SqliteGoalCompletedProjector(db);
  const goalResetProjector = new SqliteGoalResetProjector(db);
  const goalRemovedProjector = new SqliteGoalRemovedProjector(db);
  const goalContextReader = new SqliteGoalContextReader(db);
  const goalStatusReader = new SqliteGoalStatusReader(db);

  // Solution Category
  // Architecture Projection Stores - decomposed by use case
  const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(db);
  const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(db);
  // Component Projection Stores - decomposed by use case
  const componentAddedProjector = new SqliteComponentAddedProjector(db);
  const componentUpdatedProjector = new SqliteComponentUpdatedProjector(db);
  const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(db);
  const componentRemovedProjector = new SqliteComponentRemovedProjector(db);
  const componentContextReader = new SqliteComponentContextReader(db);
  // Dependency Projection Stores - decomposed by use case
  const dependencyAddedProjector = new SqliteDependencyAddedProjector(db);
  const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(db);
  const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(db);
  const dependencyContextReader = new SqliteDependencyContextReader(db);
  // Decision Projection Stores - decomposed by use case
  const decisionAddedProjector = new SqliteDecisionAddedProjector(db);
  const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(db);
  const decisionReversedProjector = new SqliteDecisionReversedProjector(db);
  const decisionSupersededProjector = new SqliteDecisionSupersededProjector(db);
  const decisionContextReader = new SqliteDecisionContextReader(db);
  const decisionSessionReader = new SqliteDecisionSessionReader(db);
  // Guideline Projection Stores - decomposed by use case
  const guidelineAddedProjector = new SqliteGuidelineAddedProjector(db);
  const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(db);
  const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(db);
  const guidelineContextReader = new SqliteGuidelineContextReader(db);
  // Invariant Projection Stores - decomposed by use case
  const invariantAddedProjector = new SqliteInvariantAddedProjector(db);
  const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(db);
  const invariantRemovedProjector = new SqliteInvariantRemovedProjector(db);
  const invariantContextReader = new SqliteInvariantContextReader(db);
  // Solution Context - cross-cutting reader and qualifier
  const solutionContextReader = new SqliteSolutionContextReader(db);
  const unprimedBrownfieldQualifier = new UnprimedBrownfieldQualifier(solutionContextReader);

  // Project Knowledge Category
  // Project Projection Stores - decomposed by use case
  const projectInitializedProjector = new SqliteProjectInitializedProjector(db);
  const projectUpdatedProjector = new SqliteProjectUpdatedProjector(db);
  const projectContextReader = new SqliteProjectContextReader(db);
  // Audience Projection Stores - decomposed by use case
  const audienceAddedProjector = new SqliteAudienceAddedProjector(db);
  const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(db);
  const audienceRemovedProjector = new SqliteAudienceRemovedProjector(db);
  const audienceContextReader = new SqliteAudienceContextReader(db);
  // AudiencePain Projection Stores - decomposed by use case
  const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(db);
  const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(db);
  const audiencePainResolvedProjector = new SqliteAudiencePainResolvedProjector(db);
  const audiencePainContextReader = new SqliteAudiencePainContextReader(db);
  // ValueProposition Projection Stores - decomposed by use case
  const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(db);
  const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(db);
  const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(db);

  // Relations Category - Projection Stores - decomposed by use case
  const relationAddedProjector = new SqliteRelationAddedProjector(db);
  const relationRemovedProjector = new SqliteRelationRemovedProjector(db);

  // ============================================================
  // STEP 4: Create Projection Handlers (Event Subscribers)
  // ============================================================

  // Work Category - Session Projection Handlers - using decomposed projectors
  const sessionStartedEventHandler = new SessionStartedEventHandler(sessionStartedProjector);
  const sessionEndedEventHandler = new SessionEndedEventHandler(sessionEndedProjector);
  const sessionPausedEventHandler = new SessionPausedEventHandler(sessionPausedProjector);
  const sessionResumedEventHandler = new SessionResumedEventHandler(sessionResumedProjector);
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
  const goalCompletedEventHandler = new GoalCompletedEventHandler(goalCompletedProjector);
  const goalResetEventHandler = new GoalResetEventHandler(goalResetProjector);
  const goalRemovedEventHandler = new GoalRemovedEventHandler(goalRemovedProjector);

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
  // STEP 5: Subscribe Projection Handlers to Events
  // ============================================================

  // Work Category - Session events
  eventBus.subscribe("SessionStarted", sessionStartedEventHandler);
  eventBus.subscribe("SessionPaused", sessionPausedEventHandler);
  eventBus.subscribe("SessionResumed", sessionResumedEventHandler);
  eventBus.subscribe("SessionEnded", sessionEndedEventHandler);

  // Work Category - Session Summary (cross-aggregate projection)
  sessionSummaryProjectionHandler.subscribe();

  // Work Category - Goal events
  eventBus.subscribe("GoalAddedEvent", goalAddedEventHandler);
  eventBus.subscribe("GoalStartedEvent", goalStartedEventHandler);
  eventBus.subscribe("GoalUpdatedEvent", goalUpdatedEventHandler);
  eventBus.subscribe("GoalBlockedEvent", goalBlockedEventHandler);
  eventBus.subscribe("GoalUnblockedEvent", goalUnblockedEventHandler);
  eventBus.subscribe("GoalCompletedEvent", goalCompletedEventHandler);
  eventBus.subscribe("GoalResetEvent", goalResetEventHandler);
  eventBus.subscribe("GoalRemovedEvent", goalRemovedEventHandler);

  // Solution Category - Architecture events - decomposed by use case
  eventBus.subscribe("ArchitectureDefined", architectureDefinedEventHandler);
  eventBus.subscribe("ArchitectureUpdated", architectureUpdatedEventHandler);

  // Solution Category - Component events - decomposed by use case
  eventBus.subscribe("ComponentAdded", componentAddedEventHandler);
  eventBus.subscribe("ComponentUpdated", componentUpdatedEventHandler);
  eventBus.subscribe("ComponentDeprecated", componentDeprecatedEventHandler);
  eventBus.subscribe("ComponentRemoved", componentRemovedEventHandler);

  // Solution Category - Dependency events - decomposed by use case
  eventBus.subscribe("DependencyAdded", dependencyAddedEventHandler);
  eventBus.subscribe("DependencyUpdated", dependencyUpdatedEventHandler);
  eventBus.subscribe("DependencyRemoved", dependencyRemovedEventHandler);

  // Solution Category - Decision events - decomposed by use case
  eventBus.subscribe("DecisionAdded", decisionAddedEventHandler);
  eventBus.subscribe("DecisionUpdated", decisionUpdatedEventHandler);
  eventBus.subscribe("DecisionReversed", decisionReversedEventHandler);
  eventBus.subscribe("DecisionSuperseded", decisionSupersededEventHandler);

  // Solution Category - Guideline events - decomposed by use case
  eventBus.subscribe("GuidelineAdded", guidelineAddedEventHandler);
  eventBus.subscribe("GuidelineUpdated", guidelineUpdatedEventHandler);
  eventBus.subscribe("GuidelineRemoved", guidelineRemovedEventHandler);

  // Solution Category - Invariant events - decomposed by use case
  eventBus.subscribe("InvariantAdded", invariantAddedEventHandler);
  eventBus.subscribe("InvariantUpdated", invariantUpdatedEventHandler);
  eventBus.subscribe("InvariantRemoved", invariantRemovedEventHandler);

  // Project Knowledge Category - Project events - decomposed by use case
  eventBus.subscribe("ProjectInitialized", projectInitializedEventHandler);
  eventBus.subscribe("ProjectUpdated", projectUpdatedEventHandler);

  // Project Knowledge Category - Audience Pain events - decomposed by use case
  eventBus.subscribe("AudiencePainAdded", audiencePainAddedEventHandler);
  eventBus.subscribe("AudiencePainUpdated", audiencePainUpdatedEventHandler);
  eventBus.subscribe("AudiencePainResolved", audiencePainResolvedEventHandler);

  // Project Knowledge Category - Audience events - decomposed by use case
  eventBus.subscribe("AudienceAdded", audienceAddedEventHandler);
  eventBus.subscribe("AudienceUpdated", audienceUpdatedEventHandler);
  eventBus.subscribe("AudienceRemoved", audienceRemovedEventHandler);

  // Project Knowledge Category - Value Proposition events - decomposed by use case
  eventBus.subscribe("ValuePropositionAdded", valuePropositionAddedEventHandler);
  eventBus.subscribe("ValuePropositionUpdated", valuePropositionUpdatedEventHandler);
  eventBus.subscribe("ValuePropositionRemoved", valuePropositionRemovedEventHandler);

  // Relations Category - Relation events - decomposed by use case
  eventBus.subscribe("RelationAdded", relationAddedEventHandler);
  eventBus.subscribe("RelationRemoved", relationRemovedEventHandler);

  // ============================================================
  // STEP 6: Return Complete Container
  // ============================================================

  return {
    // Core Infrastructure
    eventBus,
    eventStore,
    clock,
    dbConnectionManager,
    db,

    // CLI Metadata
    cliMetadataReader,

    // Work Category - Session Event Stores - decomposed by use case
    sessionStartedEventStore,
    sessionEndedEventStore,
    sessionPausedEventStore,
    sessionResumedEventStore,
    // Goal Event Stores - decomposed by use case
    goalAddedEventStore,
    goalStartedEventStore,
    goalUpdatedEventStore,
    goalBlockedEventStore,
    goalUnblockedEventStore,
    goalCompletedEventStore,
    goalResetEventStore,
    goalRemovedEventStore,
    // Session Projection Stores - decomposed by use case
    sessionStartedProjector,
    sessionEndedProjector,
    activeSessionReader,
    sessionPausedProjector,
    sessionResumedProjector,
    sessionSummaryProjectionStore,
    sessionSummaryReader,
    // Goal Projection Stores - decomposed by use case
    goalAddedProjector,
    goalStartedProjector,
    goalUpdatedProjector,
    goalBlockedProjector,
    goalUnblockedProjector,
    goalCompletedProjector,
    goalResetProjector,
    goalRemovedProjector,
    goalContextReader,
    goalStatusReader,

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
    // Component Projection Stores - decomposed by use case
    componentAddedProjector,
    componentUpdatedProjector,
    componentDeprecatedProjector,
    componentRemovedProjector,
    componentContextReader,
    // Dependency Projection Stores - decomposed by use case
    dependencyAddedProjector,
    dependencyUpdatedProjector,
    dependencyRemovedProjector,
    dependencyContextReader,
    // Decision Projection Stores - decomposed by use case
    decisionAddedProjector,
    decisionUpdatedProjector,
    decisionReversedProjector,
    decisionSupersededProjector,
    decisionContextReader,
    decisionSessionReader,
    // Guideline Projection Stores - decomposed by use case
    guidelineAddedProjector,
    guidelineUpdatedProjector,
    guidelineRemovedProjector,
    guidelineContextReader,
    // Invariant Projection Stores - decomposed by use case
    invariantAddedProjector,
    invariantUpdatedProjector,
    invariantRemovedProjector,
    invariantContextReader,
    // Solution Context - cross-cutting reader and qualifier
    solutionContextReader,
    unprimedBrownfieldQualifier,

    // Project Knowledge Category
    // Project Event Stores - decomposed by use case
    projectInitializedEventStore,
    projectUpdatedEventStore,
    // Project Services
    agentFileProtocol,
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

    // Relations Category - decomposed by use case
    relationAddedEventStore,
    relationRemovedEventStore,
    relationAddedProjector,
    relationRemovedProjector,
  };
}
