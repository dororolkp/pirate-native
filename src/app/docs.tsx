import { DocumentationCenter } from "../components/documentation-center";
import { pageMetadata } from "../lib/site-metadata";
export function generateMetadata() {
  return pageMetadata("/docs");
}
export default function DocsRoute() {
  return <DocumentationCenter />;
}
