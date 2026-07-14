import type { UserRole } from "@/enums";

export interface User {
  id: string;
  name: string;
  /** Present when set on the backend; phone is the primary login identity */
  email?: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}
