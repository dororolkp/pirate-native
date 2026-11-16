import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { csvMissions, Mission } from "./fleet-domain";

export async function exportMissions(missions: Mission[]) {
  return exportCsv(csvMissions(missions), `pirate-missions-${Date.now()}.csv`);
}
export async function exportCsv(content: string, filename: string) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Sharing is unavailable on this device.");
  const file = new File(Paths.cache, filename);
  try {
    file.create({ overwrite: true });
    file.write(content);
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
      dialogTitle: "Export Pirate records",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
