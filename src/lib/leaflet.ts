type LeafletModule = typeof import("leaflet");

interface MapInternals {
  _mapPane?: HTMLElement;
  _onZoomTransitionEnd: (this: MapInternals) => void;
  _getMapPanePos: (this: MapInternals) => unknown;
}

let leafletModule: Promise<LeafletModule> | null = null;

function ignoreLateCallsAfterRemove(L: LeafletModule): LeafletModule {
  const map = L.Map.prototype as unknown as MapInternals;
  const finishZoom = map._onZoomTransitionEnd;
  const panePosition = map._getMapPanePos;
  map._onZoomTransitionEnd = function finishZoomWhileMounted(this: MapInternals) {
    if (this._mapPane) {
      finishZoom.call(this);
    }
  };
  map._getMapPanePos = function panePositionWhileMounted(this: MapInternals) {
    return this._mapPane ? panePosition.call(this) : L.point(0, 0);
  };
  return L;
}

export function loadLeaflet(): Promise<LeafletModule> {
  leafletModule ??= import("leaflet").then(ignoreLateCallsAfterRemove);
  return leafletModule;
}
