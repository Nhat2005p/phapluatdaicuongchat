export type UserRole = 'student' | 'lecturer' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface HistoryItem {
  id: number;
  user_id: number;
  query: string;
  intent_code?: string;
  tier_level?: string;
  response_json: any;
  created_at: string;
}

export interface AdminStats {
  users_total: number;
  roles_distribution: Record<string, number>;
  queries_total: number;
  laws_count: number;
  principles_count: number;
  server_status: string;
}
