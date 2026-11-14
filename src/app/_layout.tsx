import { FleetProvider } from "../hooks/use-fleet";
import { FleetShell } from "../components/fleet-shell";
export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  return (
    <FleetProvider>
      <FleetShell />
    </FleetProvider>
  );
}
