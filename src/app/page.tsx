
import { getApiKeys } from "@/lib/apiKeyService";
import { DashboardClientPage } from "@/components/dashboard-client-page";

export default async function DashboardPage() {
  const apiKeys = await getApiKeys();
  return <DashboardClientPage initialKeys={apiKeys} />;
}
