import { AdminExampleManagementPage } from "@/components/admin/_example-management";
import { adminExampleManagementService } from "@/services/admin";

export const metadata = { title: "Example Module" };

export default async function AdminExamplePage() {
  const data = await adminExampleManagementService.getItems();
  return <AdminExampleManagementPage data={data} />;
}
