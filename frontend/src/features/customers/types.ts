// ── Customer types ─────────────────────────────────────────────────────────────

// Re-export from api.ts as CustomerDetails so existing component imports stay valid
export type { CustomerRecord as CustomerDetails } from './api';

export type CustomerFormMode = 'view' | 'edit' | 'create';

export type Address = {
  id: number;
  siteCompanyName?: string;
  delBuildingName?: string;
  delAddressLn1?: string;
  delAddressLn2?: string;
  delTownOrCity?: string;
  delCounty?: string;
  delPostCode?: string;
  siteContactName?: string;
  siteContactEmail?: string;
  siteContactPhone?: string;
  siteContactMobile?: string;
  defaultAddress?: boolean;
};

export type AddressesResponse = {
  data?: Address[];
};
