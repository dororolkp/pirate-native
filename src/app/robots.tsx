import { FleetScreen } from "../components/fleet-screen";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/robots");
}
export default function Robots() {
  return <FleetScreen tab="Robots" />;
}
