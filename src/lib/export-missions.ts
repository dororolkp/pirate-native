import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { csvMissions, Mission } from "./fleet-domain";

export async function exportMissions(missions: Mission[]) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Sharing is unavailable on this device.");
  const file = new File(Paths.cache, `pirate-missions-${Date.now()}.csv`);
  try {
    file.create({ overwrite: true });
    file.write(csvMissions(missions));
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
      dialogTitle: "Export Pirate missions",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
