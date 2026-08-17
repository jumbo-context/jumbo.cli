import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  BaseColors,
  SemanticColors,
  TuiGlyphs,
} from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { Wizard } from "../wizard/Wizard.js";
import type { WizardStepDefinition } from "../wizard/Wizard.js";
import { WizardFieldKind } from "../wizard/WizardConstants.js";
import {
  AUTHORING_PROGRESS_LABELS,
  GOAL_AUTHORING_RESULT_MAX_MESSAGE_LENGTH,
  GOAL_AUTHORING_RESULT_PANEL_WIDTH,
  GoalAuthoringCopy,
  GoalAuthoringCriterionValue,
  GoalAuthoringFieldKey,
  GoalAuthoringRequestStatus,
  GoalAuthoringResultCopy,
  GoalAuthoringResultInteractionKey,
  GoalAuthoringStage,
  type GoalAuthoringStageValue,
} from "./GoalAuthoringFlowConstants.js";

export interface GoalAuthoringValues {
  readonly title: string;
  readonly objective: string;
  readonly successCriteria: readonly string[];
  readonly scopeIn: readonly string[];
  readonly scopeOut: readonly string[];
  readonly nextGoal: string;
  readonly previousGoal: string;
  readonly prerequisiteGoals: string;
  readonly branch: string;
  readonly worktree: string;
}

export type GoalAuthoringSubmissionResult =
  | {
      readonly status: typeof GoalAuthoringRequestStatus.SUCCESS;
      readonly goalId: string;
    }
  | {
      readonly status: typeof GoalAuthoringRequestStatus.FAILURE;
      readonly error: string;
    };

type GoalAuthoringRequestResult =
  | {
      readonly status: typeof GoalAuthoringRequestStatus.PENDING;
    }
  | GoalAuthoringSubmissionResult;

const DETAILS_STEPS: readonly WizardStepDefinition[] = [
  {
    title: GoalAuthoringCopy.details.title,
    description: GoalAuthoringCopy.details.description,
    fields: [
      {
        key: GoalAuthoringFieldKey.TITLE,
        label: GoalAuthoringCopy.details.fields.title,
        placeholder: GoalAuthoringCopy.details.fields.titlePlaceholder,
      },
      {
        key: GoalAuthoringFieldKey.OBJECTIVE,
        label: GoalAuthoringCopy.details.fields.objective,
        placeholder: GoalAuthoringCopy.details.fields.objectivePlaceholder,
      },
    ],
  },
] as const;

const SEQUENCING_STEPS: readonly WizardStepDefinition[] = [
  {
    title: GoalAuthoringCopy.sequencing.title,
    description: GoalAuthoringCopy.sequencing.description,
    fields: [
      {
        key: GoalAuthoringFieldKey.PREVIOUS_GOAL,
        label: GoalAuthoringCopy.sequencing.fields.previousGoal,
        placeholder:
          GoalAuthoringCopy.sequencing.fields.previousGoalPlaceholder,
        required: false,
      },
      {
        key: GoalAuthoringFieldKey.NEXT_GOAL,
        label: GoalAuthoringCopy.sequencing.fields.nextGoal,
        placeholder: GoalAuthoringCopy.sequencing.fields.nextGoalPlaceholder,
        required: false,
      },
      {
        key: GoalAuthoringFieldKey.PREREQUISITE_GOALS,
        label: GoalAuthoringCopy.sequencing.fields.prerequisiteGoals,
        placeholder:
          GoalAuthoringCopy.sequencing.fields.prerequisiteGoalsPlaceholder,
        required: false,
      },
    ],
  },
] as const;

const WORKSPACE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: GoalAuthoringCopy.workspace.title,
    description: GoalAuthoringCopy.workspace.description,
    fields: [
      {
        key: GoalAuthoringFieldKey.BRANCH,
        label: GoalAuthoringCopy.workspace.fields.branch,
        placeholder: GoalAuthoringCopy.workspace.fields.branchPlaceholder,
        required: false,
      },
      {
        key: GoalAuthoringFieldKey.WORKTREE,
        label: GoalAuthoringCopy.workspace.fields.worktree,
        placeholder: GoalAuthoringCopy.workspace.fields.worktreePlaceholder,
        required: false,
      },
    ],
  },
] as const;

interface GoalAuthoringFlowProps {
  readonly onComplete: (
    values: GoalAuthoringValues,
  ) => Promise<GoalAuthoringSubmissionResult>;
  readonly onSuccessAcknowledged?: (goalId: string) => void | Promise<void>;
  readonly onCancel: () => void;
}

type ScopeFieldKey =
  | typeof GoalAuthoringFieldKey.SCOPE_IN
  | typeof GoalAuthoringFieldKey.SCOPE_OUT;

export function GoalAuthoringFlow({
  onComplete,
  onSuccessAcknowledged = () => {},
  onCancel,
}: GoalAuthoringFlowProps): React.ReactElement {
  const [stage, setStage] = useState<GoalAuthoringStageValue>(
    GoalAuthoringStage.DETAILS,
  );
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [successCriteria, setSuccessCriteria] = useState<readonly string[]>([]);
  const [scopeValues, setScopeValues] = useState({
    scopeIn: [] as readonly string[],
    scopeOut: [] as readonly string[],
  });
  const [scopeFieldKey, setScopeFieldKey] = useState<ScopeFieldKey>(
    GoalAuthoringFieldKey.SCOPE_IN,
  );
  const [scopeEditIndex, setScopeEditIndex] = useState(0);
  const [sequencingValues, setSequencingValues] = useState({
    previousGoal: "",
    nextGoal: "",
    prerequisiteGoals: "",
  });
  const [criteriaEditIndex, setCriteriaEditIndex] = useState(0);
  const [wizardKey, setWizardKey] = useState(0);
  const [workspaceValues, setWorkspaceValues] = useState({
    branch: "",
    worktree: "",
  });
  const [requestResult, setRequestResult] =
    useState<GoalAuthoringRequestResult | null>(null);
  const [acknowledgingSuccess, setAcknowledgingSuccess] = useState(false);

  const criterionNumber = criteriaEditIndex + 1;
  const criteriaSteps = useMemo(
    () => buildCriteriaSteps(criterionNumber),
    [criterionNumber],
  );
  const scopeSteps = useMemo(
    () => buildScopeSteps(scopeFieldKey, scopeEditIndex + 1),
    [scopeEditIndex, scopeFieldKey],
  );

  const handleDetailsConfirm = (values: Record<string, string>) => {
    setTitle(values[GoalAuthoringFieldKey.TITLE] ?? "");
    setObjective(values[GoalAuthoringFieldKey.OBJECTIVE] ?? "");
    setCriteriaEditIndex(0);
    setStage(GoalAuthoringStage.CRITERIA);
  };

  const handleCriteriaConfirm = (values: Record<string, string>) => {
    const criterion = values[GoalAuthoringFieldKey.CRITERION] ?? "";
    const nextSuccessCriteria = [...successCriteria];
    nextSuccessCriteria[criteriaEditIndex] = criterion;
    setSuccessCriteria(nextSuccessCriteria);

    if (
      values[GoalAuthoringFieldKey.ADD_ANOTHER_CRITERION] ===
      GoalAuthoringCriterionValue.YES
    ) {
      setCriteriaEditIndex(criteriaEditIndex + 1);
      setWizardKey((current) => current + 1);
      return;
    }

    setStage(GoalAuthoringStage.SCOPE);
  };

  const handleScopeConfirm = (values: Record<string, string>) => {
    const item = values[scopeFieldKey] ?? "";
    const nextScopeValues = {
      ...scopeValues,
      [scopeFieldKey]: replaceScopeItem(
        scopeValues[scopeFieldKey],
        scopeEditIndex,
        item,
      ),
    };
    setScopeValues(nextScopeValues);

    if (
      values[scopeAddAnotherFieldKey(scopeFieldKey)] ===
      GoalAuthoringCriterionValue.YES
    ) {
      setScopeEditIndex(scopeEditIndex + 1);
      setWizardKey((current) => current + 1);
      return;
    }

    if (scopeFieldKey === GoalAuthoringFieldKey.SCOPE_IN) {
      setScopeFieldKey(GoalAuthoringFieldKey.SCOPE_OUT);
      setScopeEditIndex(0);
      setWizardKey((current) => current + 1);
      return;
    }

    setStage(GoalAuthoringStage.SEQUENCING);
  };

  const handleSequencingConfirm = (values: Record<string, string>) => {
    setSequencingValues({
      previousGoal: values[GoalAuthoringFieldKey.PREVIOUS_GOAL] ?? "",
      nextGoal: values[GoalAuthoringFieldKey.NEXT_GOAL] ?? "",
      prerequisiteGoals: values[GoalAuthoringFieldKey.PREREQUISITE_GOALS] ?? "",
    });
    setStage(GoalAuthoringStage.WORKSPACE);
  };

  const handleWorkspaceConfirm = async (values: Record<string, string>) => {
    const nextWorkspaceValues = {
      branch: values[GoalAuthoringFieldKey.BRANCH] ?? "",
      worktree: values[GoalAuthoringFieldKey.WORKTREE] ?? "",
    };
    setWorkspaceValues(nextWorkspaceValues);
    const authoringValues = {
      title,
      objective,
      successCriteria,
      scopeIn: scopeValues.scopeIn,
      scopeOut: scopeValues.scopeOut,
      nextGoal: sequencingValues.nextGoal,
      previousGoal: sequencingValues.previousGoal,
      prerequisiteGoals: sequencingValues.prerequisiteGoals,
      branch: nextWorkspaceValues.branch,
      worktree: nextWorkspaceValues.worktree,
    };

    setRequestResult({ status: GoalAuthoringRequestStatus.PENDING });
    try {
      setRequestResult(await onComplete(authoringValues));
    } catch (caughtError) {
      setRequestResult({
        status: GoalAuthoringRequestStatus.FAILURE,
        error: normalizeSubmissionError(caughtError),
      });
    }
  };

  const handleCriteriaBack = () => {
    if (criteriaEditIndex > 0) {
      setCriteriaEditIndex(criteriaEditIndex - 1);
      setWizardKey((current) => current + 1);
      return;
    }

    setStage(GoalAuthoringStage.DETAILS);
  };

  const handleScopeBack = () => {
    if (scopeEditIndex > 0) {
      setScopeEditIndex(scopeEditIndex - 1);
      setWizardKey((current) => current + 1);
      return;
    }

    if (scopeFieldKey === GoalAuthoringFieldKey.SCOPE_OUT) {
      setScopeFieldKey(GoalAuthoringFieldKey.SCOPE_IN);
      setScopeEditIndex(Math.max(scopeValues.scopeIn.length - 1, 0));
      setWizardKey((current) => current + 1);
      return;
    }

    setCriteriaEditIndex(Math.max(successCriteria.length - 1, 0));
    setStage(GoalAuthoringStage.CRITERIA);
  };

  const handleSequencingBack = () => {
    setScopeFieldKey(GoalAuthoringFieldKey.SCOPE_OUT);
    setScopeEditIndex(Math.max(scopeValues.scopeOut.length - 1, 0));
    setWizardKey((current) => current + 1);
    setStage(GoalAuthoringStage.SCOPE);
  };

  useInput((_input, key) => {
    if (
      requestResult === null ||
      requestResult.status === GoalAuthoringRequestStatus.PENDING ||
      acknowledgingSuccess
    ) {
      return;
    }

    if (
      requestResult.status === GoalAuthoringRequestStatus.FAILURE &&
      key.escape
    ) {
      onCancel();
      return;
    }

    if (!key.return) {
      return;
    }

    if (requestResult.status === GoalAuthoringRequestStatus.FAILURE) {
      setRequestResult(null);
      setWizardKey((current) => current + 1);
      setStage(GoalAuthoringStage.WORKSPACE);
      return;
    }

    setAcknowledgingSuccess(true);
    void Promise.resolve(onSuccessAcknowledged(requestResult.goalId)).catch(
      () => setAcknowledgingSuccess(false),
    );
  });

  if (requestResult !== null) {
    return (
      <GoalAuthoringResultScreen
        result={requestResult}
        acknowledgingSuccess={acknowledgingSuccess}
      />
    );
  }

  if (stage === GoalAuthoringStage.DETAILS) {
    return (
      <Wizard
        key={GoalAuthoringStage.DETAILS}
        title={GoalAuthoringCopy.title}
        steps={DETAILS_STEPS}
        onConfirm={handleDetailsConfirm}
        onCancel={onCancel}
        initialValues={{ title, objective }}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.DETAILS]}
      />
    );
  }

  if (stage === GoalAuthoringStage.CRITERIA) {
    return (
      <Wizard
        key={`criteria-${wizardKey}`}
        title={GoalAuthoringCopy.title}
        steps={criteriaSteps}
        onConfirm={handleCriteriaConfirm}
        onCancel={onCancel}
        onBack={handleCriteriaBack}
        initialValues={{
          [GoalAuthoringFieldKey.CRITERION]:
            successCriteria[criteriaEditIndex] ?? "",
          [GoalAuthoringFieldKey.ADD_ANOTHER_CRITERION]:
            criteriaEditIndex < successCriteria.length - 1
              ? GoalAuthoringCriterionValue.YES
              : GoalAuthoringCriterionValue.NO,
        }}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.CRITERIA]}
      />
    );
  }

  if (stage === GoalAuthoringStage.SCOPE) {
    return (
      <Wizard
        key={`scope-${scopeFieldKey}-${wizardKey}`}
        title={GoalAuthoringCopy.title}
        steps={scopeSteps}
        onConfirm={handleScopeConfirm}
        onCancel={onCancel}
        onBack={handleScopeBack}
        initialValues={{
          [scopeFieldKey]: scopeValues[scopeFieldKey][scopeEditIndex] ?? "",
          [scopeAddAnotherFieldKey(scopeFieldKey)]:
            scopeEditIndex < scopeValues[scopeFieldKey].length - 1
              ? GoalAuthoringCriterionValue.YES
              : GoalAuthoringCriterionValue.NO,
        }}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.SCOPE]}
      />
    );
  }

  if (stage === GoalAuthoringStage.SEQUENCING) {
    return (
      <Wizard
        key={GoalAuthoringStage.SEQUENCING}
        title={GoalAuthoringCopy.title}
        steps={SEQUENCING_STEPS}
        onConfirm={handleSequencingConfirm}
        onCancel={onCancel}
        onBack={handleSequencingBack}
        initialValues={sequencingValues}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.SEQUENCING]}
      />
    );
  }

  return (
    <Wizard
      key={`workspace-${wizardKey}`}
      title={GoalAuthoringCopy.title}
      steps={WORKSPACE_STEPS}
      onConfirm={handleWorkspaceConfirm}
      onCancel={onCancel}
      onBack={() => setStage(GoalAuthoringStage.SEQUENCING)}
      initialValues={workspaceValues}
      progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.WORKSPACE]}
    />
  );
}

function GoalAuthoringResultScreen({
  result,
  acknowledgingSuccess,
}: {
  readonly result: GoalAuthoringRequestResult;
  readonly acknowledgingSuccess: boolean;
}): React.ReactElement {
  const isPending = result.status === GoalAuthoringRequestStatus.PENDING;
  const isSuccess = result.status === GoalAuthoringRequestStatus.SUCCESS;
  const statusColor = isPending
    ? SemanticColors.info
    : isSuccess
      ? SemanticColors.success
      : SemanticColors.error;
  const statusCopy = isPending
    ? GoalAuthoringResultCopy.pending
    : isSuccess
      ? GoalAuthoringResultCopy.success
      : GoalAuthoringResultCopy.failure;

  return (
    <Box
      width="100%"
      height="100%"
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
    >
      <Box
        width={GOAL_AUTHORING_RESULT_PANEL_WIDTH}
        maxWidth="100%"
        flexShrink={1}
        flexDirection="column"
        backgroundColor={BaseColors.black}
        paddingX={4}
        paddingY={2}
      >
        <Text color={SemanticColors.headline} bold>
          {TuiGlyphs.accentBar} {GoalAuthoringResultCopy.title}
        </Text>

        <Box marginTop={1}>
          <Text color={SemanticColors.secondary}>
            {GoalAuthoringResultCopy.statusLabel}:{" "}
          </Text>
          <Text color={statusColor} bold>
            {result.status}
          </Text>
        </Box>
        <Text color={statusColor} wrap="truncate-end">
          {statusCopy}
        </Text>

        {result.status === GoalAuthoringRequestStatus.SUCCESS && (
          <Box marginTop={1}>
            <Text color={SemanticColors.secondary}>
              {GoalAuthoringResultCopy.goalIdLabel}:{" "}
            </Text>
            <Text color={SemanticColors.primary} wrap="wrap">
              {result.goalId}
            </Text>
          </Box>
        )}

        {result.status === GoalAuthoringRequestStatus.FAILURE && (
          <Box marginTop={1} flexDirection="column">
            <Text color={SemanticColors.secondary}>
              {GoalAuthoringResultCopy.errorLabel}:
            </Text>
            <Text color={SemanticColors.error} wrap="wrap">
              {truncateResultMessage(result.error)}
            </Text>
          </Box>
        )}

        {!isPending && (
          <Box marginTop={1} gap={2} flexWrap="wrap">
            <KeyBadge
              char={GoalAuthoringResultInteractionKey.ACKNOWLEDGE}
              label={
                isSuccess
                  ? GoalAuthoringResultCopy.acknowledge
                  : GoalAuthoringResultCopy.retry
              }
              compact
            />
            {!isSuccess && (
              <KeyBadge
                char={GoalAuthoringResultInteractionKey.CANCEL}
                label={GoalAuthoringResultCopy.cancel}
                compact
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function normalizeSubmissionError(caughtError: unknown): string {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return String(caughtError);
}

function truncateResultMessage(message: string): string {
  if (message.length <= GOAL_AUTHORING_RESULT_MAX_MESSAGE_LENGTH) {
    return message;
  }

  return `${message.slice(0, GOAL_AUTHORING_RESULT_MAX_MESSAGE_LENGTH - 3)}...`;
}

function buildCriteriaSteps(
  criterionNumber: number,
): readonly WizardStepDefinition[] {
  return [
    {
      title: `${GoalAuthoringCopy.criteria.titlePrefix} ${criterionNumber}`,
      description: GoalAuthoringCopy.criteria.description,
      fields: [
        {
          key: GoalAuthoringFieldKey.CRITERION,
          label: GoalAuthoringCopy.criteria.successCriterion,
          placeholder: GoalAuthoringCopy.criteria.successCriterionPlaceholder,
        },
        {
          key: GoalAuthoringFieldKey.ADD_ANOTHER_CRITERION,
          label: GoalAuthoringCopy.criteria.addAnotherCriterion,
          kind: WizardFieldKind.YES_NO,
          defaultValue: GoalAuthoringCriterionValue.NO,
        },
      ],
    },
  ] as const;
}

function buildScopeSteps(
  scopeFieldKey: ScopeFieldKey,
  itemNumber: number,
): readonly WizardStepDefinition[] {
  const isScopeIn = scopeFieldKey === GoalAuthoringFieldKey.SCOPE_IN;
  return [
    {
      title: `${
        isScopeIn
          ? GoalAuthoringCopy.scope.scopeInTitlePrefix
          : GoalAuthoringCopy.scope.scopeOutTitlePrefix
      } ${itemNumber}`,
      description: GoalAuthoringCopy.scope.description,
      fields: [
        {
          key: scopeFieldKey,
          label: isScopeIn
            ? GoalAuthoringCopy.scope.fields.scopeIn
            : GoalAuthoringCopy.scope.fields.scopeOut,
          placeholder: isScopeIn
            ? GoalAuthoringCopy.scope.fields.scopeInPlaceholder
            : GoalAuthoringCopy.scope.fields.scopeOutPlaceholder,
          required: false,
        },
        {
          key: scopeAddAnotherFieldKey(scopeFieldKey),
          label: isScopeIn
            ? GoalAuthoringCopy.scope.fields.addAnotherScopeIn
            : GoalAuthoringCopy.scope.fields.addAnotherScopeOut,
          kind: WizardFieldKind.YES_NO,
          defaultValue: GoalAuthoringCriterionValue.NO,
        },
      ],
    },
  ] as const;
}

function scopeAddAnotherFieldKey(scopeFieldKey: ScopeFieldKey): string {
  return scopeFieldKey === GoalAuthoringFieldKey.SCOPE_IN
    ? GoalAuthoringFieldKey.ADD_ANOTHER_SCOPE_IN
    : GoalAuthoringFieldKey.ADD_ANOTHER_SCOPE_OUT;
}

function replaceScopeItem(
  items: readonly string[],
  index: number,
  item: string,
): readonly string[] {
  const nextItems = [...items];
  if (item.trim().length === 0) {
    nextItems.splice(index, 1);
  } else {
    nextItems[index] = item;
  }
  return nextItems;
}
