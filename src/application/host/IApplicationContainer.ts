/**
 * Application Container Interface
 *
 * Defines the services available to the presentation layer.
 * All types are interfaces - no concrete implementations exposed.
 *
 * This interface lives in the application layer to ensure the presentation
 * layer only depends on abstractions, not concrete infrastructure types.
 *
 * Key Design:
 * - NO db: Database.Database - database is hidden in infrastructure
 * - NO lifecycle methods - resources managed by Host via signal handlers
 * - Pure dependency access interface
 */

import { IEventStore } from "../shared/persistence/IEventStore.js";
import { IEventBus } from "../shared/messaging/IEventBus.js";
import { IClock } from "../shared/system/IClock.js";
import { IDatabaseRebuildService } from "../maintenance/db/rebuild/IDatabaseRebuildService.js";

// Settings
import { ISettingsReader } from "../shared/settings/ISettingsReader.js";
import { ISettingsInitializer } from "../shared/settings/ISettingsInitializer.js";

// CLI Version
import { ICliVersionReader } from "../cli-metadata/query/ICliMetadataReader.js";

// Port interfaces for session projection stores - decomposed by use case
import { ISessionStartedProjector } from "../work/sessions/start/ISessionStartedProjector.js";
import { ISessionEndedProjector } from "../work/sessions/end/ISessionEndedProjector.js";
import { IActiveSessionReader } from "../work/sessions/end/IActiveSessionReader.js";
import { ISessionListReader } from "../work/sessions/list/ISessionListReader.js";
import { ISessionSummaryProjectionStore } from "../work/sessions/get-context/ISessionSummaryProjectionStore.js";
import { ISessionSummaryReader } from "../work/sessions/get-context/ISessionSummaryReader.js";
import { IGoalAddedProjector } from "../work/goals/add/IGoalAddedProjector.js";
import { IGoalStartedProjector } from "../work/goals/start/IGoalStartedProjector.js";
import { IGoalReader } from "../work/goals/start/IGoalReader.js";
import { IGoalUpdatedProjector } from "../work/goals/update/IGoalUpdatedProjector.js";
import { IGoalUpdateReader } from "../work/goals/update/IGoalUpdateReader.js";
import { IGoalBlockedProjector } from "../work/goals/block/IGoalBlockedProjector.js";
import { IGoalUnblockedProjector } from "../work/goals/unblock/IGoalUnblockedProjector.js";
import { IGoalPausedProjector } from "../work/goals/pause/IGoalPausedProjector.js";
import { IGoalResumedProjector } from "../work/goals/resume/IGoalResumedProjector.js";
import { IGoalCompletedProjector } from "../work/goals/complete/IGoalCompletedProjector.js";
import { IGoalCompleteReader } from "../work/goals/complete/IGoalCompleteReader.js";
import { IGoalResetProjector } from "../work/goals/reset/IGoalResetProjector.js";
import { IGoalResetReader } from "../work/goals/reset/IGoalResetReader.js";
import { IGoalRemovedProjector } from "../work/goals/remove/IGoalRemovedProjector.js";
import { IGoalRemoveReader } from "../work/goals/remove/IGoalRemoveReader.js";
import { IGoalContextReader } from "../work/goals/get-context/IGoalContextReader.js";
import { IGoalStatusReader } from "../work/goals/IGoalStatusReader.js";
import { IGoalReadForSessionSummary } from "../work/sessions/get-context/IGoalReadForSessionSummary.js";
// Goal Controllers
import { CompleteGoalController } from "../work/goals/complete/CompleteGoalController.js";
import { ReviewTurnTracker } from "../work/goals/complete/ReviewTurnTracker.js";
import { IGoalReviewedEventWriter } from "../work/goals/complete/IGoalReviewedEventWriter.js";
import { IGoalReviewedEventReader } from "../work/goals/complete/IGoalReviewedEventReader.js";

import { IDecisionAddedProjector } from "../solution/decisions/add/IDecisionAddedProjector.js";
import { IDecisionUpdatedProjector } from "../solution/decisions/update/IDecisionUpdatedProjector.js";
import { IDecisionUpdateReader } from "../solution/decisions/update/IDecisionUpdateReader.js";
import { IDecisionReversedProjector } from "../solution/decisions/reverse/IDecisionReversedProjector.js";
import { IDecisionReverseReader } from "../solution/decisions/reverse/IDecisionReverseReader.js";
import { IDecisionSupersededProjector } from "../solution/decisions/supersede/IDecisionSupersededProjector.js";
import { IDecisionSupersedeReader } from "../solution/decisions/supersede/IDecisionSupersedeReader.js";
import { IDecisionContextReader } from "../work/goals/get-context/IDecisionContextReader.js";
import { IDecisionSessionReader } from "../work/sessions/get-context/IDecisionSessionReader.js";
import { IDecisionListReader } from "../solution/decisions/list/IDecisionListReader.js";
import { IArchitectureDefinedProjector } from "../solution/architecture/define/IArchitectureDefinedProjector.js";
import { IArchitectureDefineReader } from "../solution/architecture/define/IArchitectureDefineReader.js";
import { IArchitectureUpdatedProjector } from "../solution/architecture/update/IArchitectureUpdatedProjector.js";
import { IArchitectureUpdateReader } from "../solution/architecture/update/IArchitectureUpdateReader.js";
import { IArchitectureReader } from "../solution/architecture/IArchitectureReader.js";
import { IArchitectureViewer } from "../solution/architecture/view/IArchitectureViewer.js";
import { IComponentAddedProjector } from "../solution/components/add/IComponentAddedProjector.js";
import { IComponentAddReader } from "../solution/components/add/IComponentAddReader.js";
import { IComponentUpdatedProjector } from "../solution/components/update/IComponentUpdatedProjector.js";
import { IComponentUpdateReader } from "../solution/components/update/IComponentUpdateReader.js";
import { IComponentDeprecatedProjector } from "../solution/components/deprecate/IComponentDeprecatedProjector.js";
import { IComponentDeprecateReader } from "../solution/components/deprecate/IComponentDeprecateReader.js";
import { IComponentRemovedProjector } from "../solution/components/remove/IComponentRemovedProjector.js";
import { IComponentRemoveReader } from "../solution/components/remove/IComponentRemoveReader.js";
import { IComponentContextReader } from "../work/goals/get-context/IComponentContextReader.js";
import { IComponentListReader } from "../solution/components/list/IComponentListReader.js";
import { IDependencyAddedProjector } from "../solution/dependencies/add/IDependencyAddedProjector.js";
import { IDependencyAddReader } from "../solution/dependencies/add/IDependencyAddReader.js";
import { IDependencyUpdatedProjector } from "../solution/dependencies/update/IDependencyUpdatedProjector.js";
import { IDependencyUpdateReader } from "../solution/dependencies/update/IDependencyUpdateReader.js";
import { IDependencyRemovedProjector } from "../solution/dependencies/remove/IDependencyRemovedProjector.js";
import { IDependencyRemoveReader } from "../solution/dependencies/remove/IDependencyRemoveReader.js";
import { IDependencyContextReader } from "../work/goals/get-context/IDependencyContextReader.js";
import { IDependencyListReader } from "../solution/dependencies/list/IDependencyListReader.js";
import { IGuidelineAddedProjector } from "../solution/guidelines/add/IGuidelineAddedProjector.js";
import { IGuidelineUpdatedProjector } from "../solution/guidelines/update/IGuidelineUpdatedProjector.js";
import { IGuidelineUpdateReader } from "../solution/guidelines/update/IGuidelineUpdateReader.js";
import { IGuidelineRemovedProjector } from "../solution/guidelines/remove/IGuidelineRemovedProjector.js";
import { IGuidelineRemoveReader } from "../solution/guidelines/remove/IGuidelineRemoveReader.js";
import { IGuidelineContextReader } from "../work/goals/get-context/IGuidelineContextReader.js";
import { IGuidelineListReader } from "../solution/guidelines/list/IGuidelineListReader.js";
import { IInvariantAddedProjector } from "../solution/invariants/add/IInvariantAddedProjector.js";
import { IInvariantAddReader } from "../solution/invariants/add/IInvariantAddReader.js";
import { IInvariantUpdatedProjector } from "../solution/invariants/update/IInvariantUpdatedProjector.js";
import { IInvariantUpdateReader } from "../solution/invariants/update/IInvariantUpdateReader.js";
import { IInvariantRemovedProjector } from "../solution/invariants/remove/IInvariantRemovedProjector.js";
import { IInvariantRemoveReader } from "../solution/invariants/remove/IInvariantRemoveReader.js";
import { IInvariantContextReader } from "../work/goals/get-context/IInvariantContextReader.js";
import { IInvariantListReader } from "../solution/invariants/list/IInvariantListReader.js";
// Relations Projection Store ports - decomposed by use case
import { IRelationAddedProjector } from "../relations/add/IRelationAddedProjector.js";
import { IRelationAddedReader } from "../relations/add/IRelationAddedReader.js";
import { IRelationRemovedProjector } from "../relations/remove/IRelationRemovedProjector.js";
import { IRelationRemovedReader } from "../relations/remove/IRelationRemovedReader.js";
import { IRelationReader } from "../relations/IRelationReader.js";
import { IRelationListReader } from "../relations/list/IRelationListReader.js";
// Audience Pain Projection Store ports - decomposed by use case
import { IAudiencePainAddedProjector } from "../project-knowledge/audience-pains/add/IAudiencePainAddedProjector.js";
import { IAudiencePainUpdatedProjector } from "../project-knowledge/audience-pains/update/IAudiencePainUpdatedProjector.js";
import { IAudiencePainResolvedProjector } from "../project-knowledge/audience-pains/resolve/IAudiencePainResolvedProjector.js";
import { IAudiencePainUpdateReader } from "../project-knowledge/audience-pains/update/IAudiencePainUpdateReader.js";
// Audience Projection Store ports - decomposed by use case
import { IAudienceAddedProjector } from "../project-knowledge/audiences/add/IAudienceAddedProjector.js";
import { IAudienceUpdatedProjector } from "../project-knowledge/audiences/update/IAudienceUpdatedProjector.js";
import { IAudienceRemovedProjector } from "../project-knowledge/audiences/remove/IAudienceRemovedProjector.js";
import { IAudienceRemoveReader } from "../project-knowledge/audiences/remove/IAudienceRemoveReader.js";
// Value Proposition Projection Store ports - decomposed by use case
import { IValuePropositionAddedProjector } from "../project-knowledge/value-propositions/add/IValuePropositionAddedProjector.js";
import { IValuePropositionUpdatedProjector } from "../project-knowledge/value-propositions/update/IValuePropositionUpdatedProjector.js";
import { IValuePropositionRemovedProjector } from "../project-knowledge/value-propositions/remove/IValuePropositionRemovedProjector.js";
import { IValuePropositionUpdateReader } from "../project-knowledge/value-propositions/update/IValuePropositionUpdateReader.js";
import { IValuePropositionRemoveReader } from "../project-knowledge/value-propositions/remove/IValuePropositionRemoveReader.js";
import { IProjectInitializedProjector } from "../project-knowledge/project/init/IProjectInitializedProjector.js";
import { IProjectUpdatedProjector } from "../project-knowledge/project/update/IProjectUpdatedProjector.js";
import { IProjectInitReader } from "../project-knowledge/project/init/IProjectInitReader.js";
import { IProjectUpdateReader } from "../project-knowledge/project/update/IProjectUpdateReader.js";
import { IProjectContextReader } from "../project-knowledge/project/query/IProjectContextReader.js";
import { IProjectInitializedEventWriter } from "../project-knowledge/project/init/IProjectInitializedEventWriter.js";
import { IProjectUpdatedEventWriter } from "../project-knowledge/project/update/IProjectUpdatedEventWriter.js";
import { IAgentFileProtocol } from "../project-knowledge/project/init/IAgentFileProtocol.js";
import { IInitializationProtocol } from "../project-knowledge/project/init/IInitializationProtocol.js";
import { IAudienceContextReader } from "../project-knowledge/audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../project-knowledge/audience-pains/query/IAudiencePainContextReader.js";
import { IValuePropositionContextReader } from "../project-knowledge/value-propositions/query/IValuePropositionContextReader.js";
// Solution Context
import { ISolutionContextReader } from "../solution/ISolutionContextReader.js";
import { UnprimedBrownfieldQualifier } from "../solution/UnprimedBrownfieldQualifier.js";

// Worker Identity
import { IWorkerIdentityReader } from "./workers/IWorkerIdentityReader.js";

// Goal Claims
import { GoalClaimPolicy } from "../work/goals/claims/GoalClaimPolicy.js";

// Port interfaces for session event stores - decomposed by use case
import { ISessionStartedEventWriter } from "../work/sessions/start/ISessionStartedEventWriter.js";
import { ISessionEndedEventWriter } from "../work/sessions/end/ISessionEndedEventWriter.js";
import { ISessionEndedEventReader } from "../work/sessions/end/ISessionEndedEventReader.js";
// Goal Event Store ports - decomposed by use case
import { IGoalAddedEventWriter } from "../work/goals/add/IGoalAddedEventWriter.js";
import { IGoalStartedEventWriter } from "../work/goals/start/IGoalStartedEventWriter.js";
import { IGoalStartedEventReader } from "../work/goals/start/IGoalStartedEventReader.js";
import { IGoalUpdatedEventWriter } from "../work/goals/update/IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "../work/goals/update/IGoalUpdatedEventReader.js";
import { IGoalBlockedEventWriter } from "../work/goals/block/IGoalBlockedEventWriter.js";
import { IGoalBlockedEventReader } from "../work/goals/block/IGoalBlockedEventReader.js";
import { IGoalUnblockedEventWriter } from "../work/goals/unblock/IGoalUnblockedEventWriter.js";
import { IGoalUnblockedEventReader } from "../work/goals/unblock/IGoalUnblockedEventReader.js";
import { IGoalPausedEventWriter } from "../work/goals/pause/IGoalPausedEventWriter.js";
import { IGoalPausedEventReader } from "../work/goals/pause/IGoalPausedEventReader.js";
import { IGoalResumedEventWriter } from "../work/goals/resume/IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "../work/goals/resume/IGoalResumedEventReader.js";
import { IGoalCompletedEventWriter } from "../work/goals/complete/IGoalCompletedEventWriter.js";
import { IGoalCompletedEventReader } from "../work/goals/complete/IGoalCompletedEventReader.js";
import { IGoalResetEventWriter } from "../work/goals/reset/IGoalResetEventWriter.js";
import { IGoalResetEventReader } from "../work/goals/reset/IGoalResetEventReader.js";
import { IGoalRemovedEventWriter } from "../work/goals/remove/IGoalRemovedEventWriter.js";
import { IGoalRemovedEventReader } from "../work/goals/remove/IGoalRemovedEventReader.js";
import { IGoalProgressUpdatedEventWriter } from "../work/goals/update-progress/IGoalProgressUpdatedEventWriter.js";
import { IGoalProgressUpdatedEventReader } from "../work/goals/update-progress/IGoalProgressUpdatedEventReader.js";
import { IGoalProgressUpdatedProjector } from "../work/goals/update-progress/IGoalProgressUpdatedProjector.js";
import { IGoalProgressUpdateReader } from "../work/goals/update-progress/IGoalProgressUpdateReader.js";
import { IDecisionAddedEventWriter } from "../solution/decisions/add/IDecisionAddedEventWriter.js";
import { IDecisionUpdatedEventWriter } from "../solution/decisions/update/IDecisionUpdatedEventWriter.js";
import { IDecisionReversedEventWriter } from "../solution/decisions/reverse/IDecisionReversedEventWriter.js";
import { IDecisionSupersededEventWriter } from "../solution/decisions/supersede/IDecisionSupersededEventWriter.js";
import { IArchitectureDefinedEventWriter } from "../solution/architecture/define/IArchitectureDefinedEventWriter.js";
import { IArchitectureUpdatedEventWriter } from "../solution/architecture/update/IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "../solution/architecture/update/IArchitectureUpdatedEventReader.js";
import { IComponentAddedEventWriter } from "../solution/components/add/IComponentAddedEventWriter.js";
import { IComponentUpdatedEventWriter } from "../solution/components/update/IComponentUpdatedEventWriter.js";
import { IComponentDeprecatedEventWriter } from "../solution/components/deprecate/IComponentDeprecatedEventWriter.js";
import { IComponentRemovedEventWriter } from "../solution/components/remove/IComponentRemovedEventWriter.js";
import { IDependencyAddedEventWriter } from "../solution/dependencies/add/IDependencyAddedEventWriter.js";
import { IDependencyUpdatedEventWriter } from "../solution/dependencies/update/IDependencyUpdatedEventWriter.js";
import { IDependencyUpdatedEventReader } from "../solution/dependencies/update/IDependencyUpdatedEventReader.js";
import { IDependencyRemovedEventWriter } from "../solution/dependencies/remove/IDependencyRemovedEventWriter.js";
import { IDependencyRemovedEventReader } from "../solution/dependencies/remove/IDependencyRemovedEventReader.js";
import { IGuidelineAddedEventWriter } from "../solution/guidelines/add/IGuidelineAddedEventWriter.js";
import { IGuidelineUpdatedEventWriter } from "../solution/guidelines/update/IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "../solution/guidelines/update/IGuidelineUpdatedEventReader.js";
import { IGuidelineRemovedEventWriter } from "../solution/guidelines/remove/IGuidelineRemovedEventWriter.js";
import { IGuidelineRemovedEventReader } from "../solution/guidelines/remove/IGuidelineRemovedEventReader.js";
import { IInvariantAddedEventWriter } from "../solution/invariants/add/IInvariantAddedEventWriter.js";
import { IInvariantUpdatedEventWriter } from "../solution/invariants/update/IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "../solution/invariants/update/IInvariantUpdatedEventReader.js";
import { IInvariantRemovedEventWriter } from "../solution/invariants/remove/IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "../solution/invariants/remove/IInvariantRemovedEventReader.js";
import { IAudienceAddedEventWriter } from "../project-knowledge/audiences/add/IAudienceAddedEventWriter.js";
import { IAudienceUpdatedEventWriter } from "../project-knowledge/audiences/update/IAudienceUpdatedEventWriter.js";
import { IAudienceRemovedEventWriter } from "../project-knowledge/audiences/remove/IAudienceRemovedEventWriter.js";
import { IAudiencePainAddedEventWriter } from "../project-knowledge/audience-pains/add/IAudiencePainAddedEventWriter.js";
import { IAudiencePainUpdatedEventWriter } from "../project-knowledge/audience-pains/update/IAudiencePainUpdatedEventWriter.js";
import { IAudiencePainResolvedEventWriter } from "../project-knowledge/audience-pains/resolve/IAudiencePainResolvedEventWriter.js";
import { IValuePropositionAddedEventWriter } from "../project-knowledge/value-propositions/add/IValuePropositionAddedEventWriter.js";
import { IValuePropositionUpdatedEventWriter } from "../project-knowledge/value-propositions/update/IValuePropositionUpdatedEventWriter.js";
import { IValuePropositionRemovedEventWriter } from "../project-knowledge/value-propositions/remove/IValuePropositionRemovedEventWriter.js";
// Relations Event Store ports - decomposed by use case
import { IRelationAddedEventWriter } from "../relations/add/IRelationAddedEventWriter.js";
import { IRelationRemovedEventWriter } from "../relations/remove/IRelationRemovedEventWriter.js";
import { IRelationRemovedEventReader } from "../relations/remove/IRelationRemovedEventReader.js";

/**
 * IApplicationContainer - Complete dependency injection container interface
 *
 * Contains all infrastructure components, event stores, projection stores,
 * and cross-cutting services needed by the application.
 *
 * This container is created by HostBuilder and provides all dependencies
 * to CLI commands and other application components.
 *
 * Key Design:
 * - NO db: Database.Database - concrete DB types hidden in infrastructure
 * - NO lifecycle methods: No dispose(), no cleanup()
 * - Resources managed by Host via process signal handlers
 * - Pure interface for dependency access
 */
export interface IApplicationContainer {
  // Core Infrastructure
  eventBus: IEventBus;
  eventStore: IEventStore;
  clock: IClock;
  settingsReader: ISettingsReader;
  settingsInitializer: ISettingsInitializer;

  // Worker Identity
  workerIdentityReader: IWorkerIdentityReader;

  // Goal Claims
  goalClaimPolicy: GoalClaimPolicy;

  // Maintenance Services
  databaseRebuildService: IDatabaseRebuildService;

  // CLI Version
  cliVersionReader: ICliVersionReader;

  // Work Category - Session Event Stores - decomposed by use case
  sessionStartedEventStore: ISessionStartedEventWriter;
  sessionEndedEventStore: ISessionEndedEventWriter & ISessionEndedEventReader;
  // Goal Event Stores - decomposed by use case
  goalAddedEventStore: IGoalAddedEventWriter;
  goalStartedEventStore: IGoalStartedEventWriter & IGoalStartedEventReader;
  goalUpdatedEventStore: IGoalUpdatedEventWriter & IGoalUpdatedEventReader;
  goalBlockedEventStore: IGoalBlockedEventWriter & IGoalBlockedEventReader;
  goalUnblockedEventStore: IGoalUnblockedEventWriter & IGoalUnblockedEventReader;
  goalPausedEventStore: IGoalPausedEventWriter & IGoalPausedEventReader;
  goalResumedEventStore: IGoalResumedEventWriter & IGoalResumedEventReader;
  goalCompletedEventStore: IGoalCompletedEventWriter & IGoalCompletedEventReader;
  goalReviewedEventStore: IGoalReviewedEventWriter & IGoalReviewedEventReader;
  goalResetEventStore: IGoalResetEventWriter & IGoalResetEventReader;
  goalRemovedEventStore: IGoalRemovedEventWriter & IGoalRemovedEventReader;
  goalProgressUpdatedEventStore: IGoalProgressUpdatedEventWriter & IGoalProgressUpdatedEventReader;

  // Work Category - Session Projection Stores - decomposed by use case
  sessionStartedProjector: ISessionStartedProjector;
  sessionEndedProjector: ISessionEndedProjector;
  activeSessionReader: IActiveSessionReader;
  sessionSummaryProjectionStore: ISessionSummaryProjectionStore;
  sessionSummaryReader: ISessionSummaryReader;
  sessionListReader: ISessionListReader;
  // Goal Projection Stores - decomposed by use case
  goalAddedProjector: IGoalAddedProjector;
  goalStartedProjector: IGoalStartedProjector & IGoalReader;
  goalUpdatedProjector: IGoalUpdatedProjector & IGoalUpdateReader;
  goalBlockedProjector: IGoalBlockedProjector;
  goalUnblockedProjector: IGoalUnblockedProjector;
  goalPausedProjector: IGoalPausedProjector & IGoalReader;
  goalResumedProjector: IGoalResumedProjector & IGoalReader;
  goalCompletedProjector: IGoalCompletedProjector & IGoalCompleteReader;
  goalResetProjector: IGoalResetProjector & IGoalResetReader;
  goalRemovedProjector: IGoalRemovedProjector & IGoalRemoveReader;
  goalProgressUpdatedProjector: IGoalProgressUpdatedProjector & IGoalProgressUpdateReader;
  goalContextReader: IGoalContextReader;
  goalStatusReader: IGoalStatusReader & IGoalReadForSessionSummary;
  // Goal Controllers
  reviewTurnTracker: ReviewTurnTracker;
  completeGoalController: CompleteGoalController;

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
  architectureReader: IArchitectureReader;
  architectureViewer: IArchitectureViewer;
  // Component Projection Stores - decomposed by use case
  componentAddedProjector: IComponentAddedProjector & IComponentAddReader;
  componentUpdatedProjector: IComponentUpdatedProjector & IComponentUpdateReader;
  componentDeprecatedProjector: IComponentDeprecatedProjector & IComponentDeprecateReader;
  componentRemovedProjector: IComponentRemovedProjector & IComponentRemoveReader;
  componentContextReader: IComponentContextReader;
  componentListReader: IComponentListReader;
  // Dependency Projection Stores - decomposed by use case
  dependencyAddedProjector: IDependencyAddedProjector & IDependencyAddReader;
  dependencyUpdatedProjector: IDependencyUpdatedProjector & IDependencyUpdateReader;
  dependencyRemovedProjector: IDependencyRemovedProjector & IDependencyRemoveReader;
  dependencyContextReader: IDependencyContextReader;
  dependencyListReader: IDependencyListReader;
  // Decision Projection Stores - decomposed by use case
  decisionAddedProjector: IDecisionAddedProjector;
  decisionUpdatedProjector: IDecisionUpdatedProjector & IDecisionUpdateReader;
  decisionReversedProjector: IDecisionReversedProjector & IDecisionReverseReader;
  decisionSupersededProjector: IDecisionSupersededProjector & IDecisionSupersedeReader;
  decisionContextReader: IDecisionContextReader;
  decisionSessionReader: IDecisionSessionReader;
  decisionListReader: IDecisionListReader;
  // Guideline Projection Stores - decomposed by use case
  guidelineAddedProjector: IGuidelineAddedProjector;
  guidelineUpdatedProjector: IGuidelineUpdatedProjector & IGuidelineUpdateReader;
  guidelineRemovedProjector: IGuidelineRemovedProjector & IGuidelineRemoveReader;
  guidelineContextReader: IGuidelineContextReader;
  guidelineListReader: IGuidelineListReader;
  // Invariant Projection Stores - decomposed by use case
  invariantAddedProjector: IInvariantAddedProjector & IInvariantAddReader;
  invariantUpdatedProjector: IInvariantUpdatedProjector & IInvariantUpdateReader;
  invariantRemovedProjector: IInvariantRemovedProjector & IInvariantRemoveReader;
  invariantContextReader: IInvariantContextReader;
  invariantListReader: IInvariantListReader;
  // Solution Context - cross-cutting reader and qualifier
  solutionContextReader: ISolutionContextReader;
  unprimedBrownfieldQualifier: UnprimedBrownfieldQualifier;

  // Project Knowledge Category - Event Stores
  // Project Event Stores - decomposed by use case
  projectInitializedEventStore: IProjectInitializedEventWriter;
  projectUpdatedEventStore: IProjectUpdatedEventWriter;
  // Project Services
  agentFileProtocol: IAgentFileProtocol;
  initializationProtocol: IInitializationProtocol;
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
  valuePropositionContextReader: IValuePropositionContextReader;

  // Relations Category - Event Stores - decomposed by use case
  relationAddedEventStore: IRelationAddedEventWriter;
  relationRemovedEventStore: IRelationRemovedEventWriter & IRelationRemovedEventReader;

  // Relations Category - Projection Stores - decomposed by use case
  relationAddedProjector: IRelationAddedProjector & IRelationAddedReader;
  relationRemovedProjector: IRelationRemovedProjector & IRelationRemovedReader & IRelationReader;
  relationListReader: IRelationListReader;
}
