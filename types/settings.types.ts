export interface DatabaseClearResult {
  success: boolean;
  message: string;
  tablesCleared: string[];
  recordsDeleted: number;
}

export interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  tableStats: TableStat[];
}

export interface TableStat {
  tableName: string;
  recordCount: number;
}
