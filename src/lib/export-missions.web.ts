import { csvMissions, Mission } from "./fleet-domain";

export async function exportMissions(missions: Mission[]) {
  return exportCsv(
    csvMissions(missions),
    `pirate-missions-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}
export async function exportCsv(content: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
