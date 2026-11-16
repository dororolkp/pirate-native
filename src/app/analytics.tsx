import { FleetScreen } from "../components/fleet-screen";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/analytics");
}
export default function Analytics() {
  return <FleetScreen tab="Analytics" />;
}
