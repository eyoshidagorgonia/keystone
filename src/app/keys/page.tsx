
import { getApiKeys } from "@/lib/apiKeyService";
import { KeysClientPage } from "./client-page";

export default async function KeysPage() {
  const apiKeys = await getApiKeys();

  return <KeysClientPage initialKeys={apiKeys} />;
}
