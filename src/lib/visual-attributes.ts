// CSS hooks are web-only; native views never receive DOM attributes.
export function visualAttributes(
  _ui: "button" | "panel" | "metric",
  _variant: "regular" | "danger" = "regular",
) {
  return {};
}
