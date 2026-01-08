type IdRow = { id?: number | string };

const firstId = (rows: IdRow[] | undefined): number | null => {
  const r = rows?.find(x => x && x.id != null);
  return r ? Number(r.id) : null;
};

export const isoNow = () => new Date().toISOString();

export function makeOpportunityMetadataUpdatePayload(args: {
  opportunitySources?: IdRow[];
  existingUses?: IdRow[];
  planningStatuses?: IdRow[];
  proposedUses?: IdRow[];
  planningTimeframes?: IdRow[];
  overrides?: Partial<Record<string, any>>;
}) {
  const {
    opportunitySources,
    existingUses,
    planningStatuses,
    proposedUses,
    planningTimeframes,
    overrides = {},
  } = args;

  const safe = (val?: number | string | null): number | null =>
    val != null && !isNaN(Number(val)) ? Number(val) : null;

  const payload = {
    opportunity_source_id: safe(firstId(opportunitySources)),
    existing_use_id: safe(firstId(existingUses)),
    planning_status_id: safe(firstId(planningStatuses)),
    proposed_use_id: safe(firstId(proposedUses)),
    planning_timeframe_id: safe(firstId(planningTimeframes)),
    off_market: true,
    green_belt: false,
    data_centre_potential: 'no' as const,
    date_identified: isoNow(),
  };

  return { ...payload, ...overrides };
}

export function makeOpportunityMetadataNullPayload() {
  return {
    opportunity_source_id: null,
    off_market: null,
    date_identified: null,
    vendors_agent_id: null,
    harworth_agent_id: null,
    gross_acres: null,
    net_acres: null,
    existing_use_id: null,
    green_belt: null,
    planning_status_id: null,
    proposed_use_id: null,
    data_centre_potential: null,
    planning_timeframe_id: null,
    employment_sqft: null,
    employment_density: null,
    housing_plots: null,
    housing_density: null,
  };
}