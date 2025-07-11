
import { getApiKeys } from "@/lib/apiKeyService";
import { DashboardClientPage } from "@/components/dashboard-client-page";
import { redirect } from 'next/navigation'


export default async function DashboardPage() {
  if (process.env.KEYSTONE_MODE === 'api') {
    redirect('/404');
  }
  const apiKeys = await getApiKeys();

  return <DashboardClientPage initialKeys={apiKeys} />;
}
