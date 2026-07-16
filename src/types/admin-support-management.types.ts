export interface SupportContactMessage {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message: string;
  createdAt: string;
}

export type SupportInboxFilter = "ALL" | "TODAY" | "WEEK" | "UNREAD";
