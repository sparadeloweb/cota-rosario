type LeafletModule = typeof import("leaflet");

let leafletModule: Promise<LeafletModule> | null = null;

export function loadLeaflet(): Promise<LeafletModule> {
  leafletModule ??= import("leaflet");
  return leafletModule;
}
