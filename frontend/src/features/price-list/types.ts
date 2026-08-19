import {
  PriceListItem,
  PriceListRevision,
  PriceListType,
  ItemListPrice,
  PriceListRevisionDetail,
} from '@src/features/price-list/api';

export type { PriceListItem, PriceListRevision, PriceListType, ItemListPrice, PriceListRevisionDetail };

export type PriceListFilters = { category: string };

export type Tab = 'items' | 'revisions' | 'types';

export type ItemsTabProps = {
  filteredItems: PriceListItem[];
  isLoading: boolean;
  error: string | null;
  expandedItemId: string | null;
  itemDetail: PriceListItem | null;
  itemLists: ItemListPrice[];
  isItemDetailLoading: boolean;
  searchQuery: string;
  hasActiveFilters: boolean;
  isAdmin: boolean;
  onSearchChange: (val: string) => void;
  onFilterPress: () => void;
  onToggleItem: (itemId: string) => void;
  onVoidItem: (itemId: string) => void;
};

export type RevisionsTabProps = {
  revisions: PriceListRevision[];
  isLoading: boolean;
  error: string | null;
  expandedRevisionId: number | null;
  revisionDetail: PriceListRevisionDetail | null;
  isRevisionDetailLoading: boolean;
  isAdmin: boolean;
  onToggleRevision: (id: number) => void;
  onActivateRevision: (rev: PriceListRevision) => void;
};

export type TypesTabProps = {
  listTypes: PriceListType[];
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  onDeleteType: (type: PriceListType) => void;
};
