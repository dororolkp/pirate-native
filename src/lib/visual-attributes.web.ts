export function visualAttributes(
  ui: "button" | "panel" | "metric",
  variant: "regular" | "danger" = "regular",
) {
  return { dataSet: { ui, variant } };
}
