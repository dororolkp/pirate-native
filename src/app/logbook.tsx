import { FleetScreen } from "../components/fleet-screen";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/logbook");
}
export default function LogbookRoute() {
  return <FleetScreen tab="Logbook" />;
}
