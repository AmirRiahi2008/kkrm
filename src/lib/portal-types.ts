import type { Entity } from "./types";

export interface ExpertDirectoryFilters {
  groups: Entity[];
  disciplines: Entity[];
  qualifications: Entity[];
  cities: string[];
  statuses: string[];
}

export interface TariffVersion {
  id: number;
  name: string;
  effective_from: string;
  effective_to: string | null;
  approval_reference: string | null;
  source_url: string | null;
  is_demo: boolean;
}

export interface FeeCalculation {
  tariff_id: number;
  tariff_name: string;
  currency: string;
  value: number;
  expert_count: number;
  base_fee: number;
  panel_multiplier_bps: number;
  total: number;
  is_demo: boolean;
  is_estimate: boolean;
  notice: string;
  segments: {
    from: number;
    to: number;
    value: number;
    rate_bps: number;
    fee: number;
  }[];
}
