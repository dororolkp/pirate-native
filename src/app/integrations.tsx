import { IntegrationsCenter } from "../components/integrations-center";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/integrations");
}
export default function IntegrationsRoute() {
  return <IntegrationsCenter />;
}
