import type { Role } from "@/config/permissions";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  fund_access: string[];
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  avatar_url?: string;
  phone?: string;
  department?: string;
  title?: string;
}
