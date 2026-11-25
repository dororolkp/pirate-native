export function visualAttributes(
  ui: "button" | "panel" | "metric",
  variant: "regular" | "danger" = "regular",
  guide?: string,
) {
  return { dataSet: { ui, variant, ...(guide ? { guide } : {}) } };
}
