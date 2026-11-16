import { FleetScreen } from "../components/fleet-screen";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/missions");
}
export default function Missions() {
  return <FleetScreen tab="Missions" />;
}
