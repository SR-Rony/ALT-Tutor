import { AdminSupportManagementPage } from "@/components/admin/support-management";
import { supportManagementService } from "@/services/admin/admin-support-management.service";

export const metadata = { title: "SupportManagement" };

export default async function Page() {
  const data = await supportManagementService.getItems();
  return <AdminSupportManagementPage data={data} />;
}
