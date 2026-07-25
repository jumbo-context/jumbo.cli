export interface RelationAuditSummary {
  readonly nodes: {
    readonly count: number;
    readonly byEntityType: Readonly<Record<string, number>>;
  };
  readonly relations: {
    readonly count: number;
    readonly byRelationType: Readonly<Record<string, number>>;
    readonly byStrength: Readonly<Record<string, number>>;
    readonly byStatus: Readonly<Record<string, number>>;
  };
}
