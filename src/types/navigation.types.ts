export interface NavItem {
  title: string;
  href?: string;
  iconName?: string;
  badge?: number;
  children?: NavItem[];
}
