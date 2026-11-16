import { FleetScreen } from "../components/fleet-screen";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/settings");
}
export default function Settings() {
  return <FleetScreen tab="Settings" />;
}
