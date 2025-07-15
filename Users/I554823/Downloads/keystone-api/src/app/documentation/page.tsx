
import { getServiceConfigs } from "@/lib/serviceConfigService";
import { DocumentationClientPage } from "./client-page";

export default async function DocumentationPage() {
  const services = await getServiceConfigs();
  
  return <DocumentationClientPage services={services} />;
}

    