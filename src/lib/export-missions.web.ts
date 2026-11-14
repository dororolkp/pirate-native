import { csvMissions, Mission } from "./fleet-domain";

export async function exportMissions(missions: Mission[]) {
  const url = URL.createObjectURL(
    new Blob([csvMissions(missions)], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pirate-missions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
