import { FleetScreen } from "../components/fleet-screen";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/");
}
export default function Overview() {
  return <FleetScreen tab="Overview" />;
}
