
import { getServiceConfigs } from "@/lib/serviceConfigService";
import { ServicesClientPage } from "./client-page";

export default async function ServicesPage() {
  const initialServices = await getServiceConfigs();
  return <ServicesClientPage initialServices={initialServices} />;
}
