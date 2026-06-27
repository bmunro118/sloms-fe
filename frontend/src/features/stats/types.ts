// Pure type definitions for the stats feature — no runtime imports, so these
// are safe to use from both the app and node-environment unit tests.

export type StatBucket = 'year' | 'quarter' | 'month' | 'week';
export type StatMetric = 'revenue' | 'orders' | 'items' | 'avgPrice';
export type StatGroupBy = 'model' | 'category';

export type TimeseriesQuery = {
  bucket: StatBucket;
  metric?: StatMetric;
  from?: string;
  to?: string;
  customerId?: number[];
  band?: string;
};

export type TimeseriesPoint = {
  period: string;
  periodStart: string;
  revenue: number;
  orders: number;
  items: number;
  avgPrice: number;
};

export type TimeseriesResult = {
  bucket: StatBucket;
  metric: StatMetric;
  from: string;
  to: string;
  series: TimeseriesPoint[];
};

export type BuilderQuery = {
  customerIds?: number[];
  accountNumbers?: string[];
  from: string;
  to: string;
  groupBy?: StatGroupBy;
};

export type BuilderRow = {
  modelCode: string | null;
  description: string | null;
  category: string | null;
  quantity: number;
  sales: number;
};

export type BuilderResult = {
  filters: {
    customerIds: number[];
    from: string;
    to: string;
    groupBy: StatGroupBy;
  };
  totals: {
    revenueTotal: number;
    orderCount: number;
    itemCount: number;
    avgPrice: number;
    avgItemsPerOrder: number;
  };
  rows: BuilderRow[];
};
