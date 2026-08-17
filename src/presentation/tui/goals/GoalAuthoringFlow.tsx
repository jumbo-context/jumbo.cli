import React, { useMemo, useState } from "react";
import { Wizard } from "../wizard/Wizard.js";
import type { WizardStepDefinition } from "../wizard/Wizard.js";
import { WizardFieldKind } from "../wizard/WizardConstants.js";
import {
  AUTHORING_PROGRESS_LABELS,
  GoalAuthoringCopy,
  GoalAuthoringCriterionValue,
  GoalAuthoringFieldKey,
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
  readonly onComplete: (values: GoalAuthoringValues) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly dispatchError?: string | null;
  readonly disabled?: boolean;
}

type ScopeFieldKey =
  | typeof GoalAuthoringFieldKey.SCOPE_IN
  | typeof GoalAuthoringFieldKey.SCOPE_OUT;

export function GoalAuthoringFlow({
  onComplete,
  onCancel,
  dispatchError = null,
  disabled = false,
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
      prerequisiteGoals:
        values[GoalAuthoringFieldKey.PREREQUISITE_GOALS] ?? "",
    });
    setStage(GoalAuthoringStage.WORKSPACE);
  };

  const handleWorkspaceConfirm = (values: Record<string, string>) => {
    const nextWorkspaceValues = {
      branch: values[GoalAuthoringFieldKey.BRANCH] ?? "",
      worktree: values[GoalAuthoringFieldKey.WORKTREE] ?? "",
    };
    setWorkspaceValues(nextWorkspaceValues);
    onComplete({
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
    });
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

  if (stage === GoalAuthoringStage.DETAILS) {
    return (
      <Wizard
        key={GoalAuthoringStage.DETAILS}
        title={GoalAuthoringCopy.title}
        steps={DETAILS_STEPS}
        onConfirm={handleDetailsConfirm}
        onCancel={onCancel}
        initialValues={{ title, objective }}
        dispatchError={dispatchError}
        disabled={disabled}
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
        dispatchError={dispatchError}
        disabled={disabled}
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
        dispatchError={dispatchError}
        disabled={disabled}
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
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.SEQUENCING]}
      />
    );
  }

  return (
    <Wizard
      key={GoalAuthoringStage.WORKSPACE}
      title={GoalAuthoringCopy.title}
      steps={WORKSPACE_STEPS}
      onConfirm={handleWorkspaceConfirm}
      onCancel={onCancel}
      onBack={() => setStage(GoalAuthoringStage.SEQUENCING)}
      initialValues={workspaceValues}
      dispatchError={dispatchError}
      disabled={disabled}
      progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.WORKSPACE]}
    />
  );
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
