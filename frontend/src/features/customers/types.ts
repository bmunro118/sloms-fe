// ── Customer types ─────────────────────────────────────────────────────────────

export type CustomerDetails = {
  customerId: number;
  accountNumber?: string;
  centreNumber?: string;
  companyName: string;
  invBuildingName?: string;
  invAddressLn1?: string;
  invAddressLn2?: string;
  invTownOrCity?: string;
  invCounty?: string;
  invPostCode?: string;
  contactName?: string;
  contactEmail?: string;
  reportEmail?: string;
  contactPhone?: string;
  contactMobile?: string;
  contactFax?: string;
  band?: string;
  isSuspended?: boolean;
};

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
