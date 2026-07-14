export interface SupportManagementItem {
  id: string;
  title: string;
}

export interface SupportManagementData {
  items: SupportManagementItem[];
  pageSize: number;
}
