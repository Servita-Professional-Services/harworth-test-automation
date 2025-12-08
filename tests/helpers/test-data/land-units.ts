import { generateUniqueName } from '../generate-random-string';

export const makeLandUnitPayload = ({ divStrategies, sector, site, overrides = {} }: any) => {
  const divId = Number(divStrategies?.[0]?.id ?? 1);
  const sectorId = Number(sector?.[0]?.id ?? 1);

  const payload = {
    display_name: overrides.display_name ?? generateUniqueName('LU'),
    divestment_strategy_id: divId,
    sector_id: sectorId,
    land_unit_category_id: overrides.land_unit_category_id ?? 1,
    measure: overrides.measure ?? 150,
    unit_of_measure: overrides.unit_of_measure ?? 'plots',
    parent_id: overrides.parent_id ?? Number(site?.id ?? 1),
    parent_type: overrides.parent_type ?? 'site',
  };

  return payload;
};
