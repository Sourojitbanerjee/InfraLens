export type AppView = 
  | 'landing'
  | 'dashboard'
  | 'analyze'
  | 'map'
  | 'queue'
  | 'analytics'
  | 'authorities'
  | 'activity';

export interface FilterState {
  searchQuery: string;
  category: string; // 'all' or InfrastructureCategory
  severity: string; // 'all' or Severity
  priority: string; // 'all' or Priority ('P0' | 'P1' | 'P2' | 'P3' | 'P4')
  status: string;   // 'all' or ResolutionStatus
  ward: string;     // 'all' or Ward ID
  authority: string; // 'all' or Authority ID
  dateRange: string; // 'all' | 'today' | '7d' | '30d'
  clusterOnly: boolean;
}
