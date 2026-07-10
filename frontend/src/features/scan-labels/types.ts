// Backend-aligned extraction types
export interface LabelPair {
  key: string;
  value: string;
  confidence: number | null;
}

export interface ExtractedItemFields {
  patientInitial?: string;
  patientSurname?: string;
  modelCode?: string;
  customerRef?: string;
  side?: string;
  description?: string;
  category?: string;
  colour?: string;
  tubing?: string;
  options?: string;
  vent?: number;
  price?: number;
}

export interface MappedLabelField {
  field: keyof ExtractedItemFields;
  value: string | number;
  sourceKey: string;
  confidence: number | null;
}

export interface LabelExtraction {
  modelId: string;
  fields: ExtractedItemFields;
  mapped: MappedLabelField[];
  unmapped: LabelPair[];
}

export interface ScanLabelFromImageResponse {
  item: unknown | null; // OrderedItem from backend - using unknown to avoid backend dependency
  extraction: LabelExtraction;
}

// Scan flow types
export type ScanStep = 'camera' | 'correction' | 'review';

export interface CapturedPhoto {
  uri: string;
}

// Union type for scan results
export type ScanResult = {
  type: 'extraction';
  extraction: LabelExtraction;
  photoUri: string;
} | {
  type: 'item';
  item: unknown; // OrderedItem from backend
  extraction: LabelExtraction;
  photoUri: string;
} | {
  type: 'text';
  text: string;
};
