import { AdminUserDetailPage } from "@/components/admin/users/admin-user-detail-page";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `User profile · ${id.slice(0, 8)}` };
}

export default async function AdminUserDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <AdminUserDetailPage userId={id} />;
}
