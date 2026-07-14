export type AdminExampleItemStatus = "active" | "inactive";

export interface AdminExampleItem {
  id: string;
  title: string;
  status: AdminExampleItemStatus;
  createdDate: string;
}

export interface AdminExampleManagementData {
  items: AdminExampleItem[];
  pageSize: number;
}
