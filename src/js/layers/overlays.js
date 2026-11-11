async function initOverlays() {
  for (const [key, config] of Object.entries(state.layers.overlays)) {
    if (config.enabled) await loadOverlay(key);
  }
}

async function loadOverlay(key) {
  const config = state.layers.overlays[key];
  if (!config) return;

  try {
    let dataSource;
    if (config.type === 'geojson') {
      dataSource = await loadGeoJSONDataSource(key, config.source, config.style);
    } else if (config.type === 'topojson') {
      dataSource = await loadTopoJSONDataSource(key, config.source, config.object, config.style);
    } else if (config.type === 'csv') {
      dataSource = await loadCSVDataSource(key, config.source, config.style);
    }

    if (dataSource) {
      state.viewer.dataSources.add(dataSource);
      state.overlayLayers.set(key, { dataSource, config });
      if (config.refresh) setInterval(() => refreshOverlay(key), config.refresh);
    }
  } catch (e) {
    console.warn('Failed to load overlay ' + key + ':', e);
    showToast('Failed to load ' + config.name, 'warning');
  }
}

async function loadGeoJSONDataSource(key, url, style) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const geojson = await response.json();
  const dataSource = new Cesium.GeoJsonDataSource(key);
  await dataSource.load(geojson, {
    stroke: Cesium.Color.fromCssColorString(style.stroke || '#1a73e8'),
    fill: style.fill ? Cesium.Color.fromCssColorString(style.fill) : Cesium.Color.TRANSPARENT,
    strokeWidth: style.strokeWidth || 1.5,
    markerSize: style.markerSize || 6,
    markerSymbol: style.markerSymbol || '?',
    markerColor: Cesium.Color.fromCssColorString(style.markerColor || '#ea4335'),
    clampToGround: true
  });
  return dataSource;
}

async function loadTopoJSONDataSource(key, url, objectName, style) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const topojson = await response.json();
  const topojsonClient = await import('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm');
  const geojson = topojsonClient.feature(topojson, topojson.objects[objectName]);
  const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(geojson)], { type: 'application/json' }));
  return loadGeoJSONDataSource(key, blobUrl, style);
}

async function loadCSVDataSource(key, url, style) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const text = await response.text();
  const geojson = csvToGeoJSON(text);
  const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(geojson)], { type: 'application/json' }));
  return loadGeoJSONDataSource(key, blobUrl, style);
}

async function refreshOverlay(key) {
  const existing = state.overlayLayers.get(key);
  if (existing) {
    state.viewer.dataSources.remove(existing.dataSource, true);
    state.overlayLayers.delete(key);
  }
  await loadOverlay(key);
}

function toggleOverlay(key, enabled) {
  const config = state.layers.overlays[key];
  if (!config) return;
  config.enabled = enabled;
  if (enabled) loadOverlay(key);
  else {
    const existing = state.overlayLayers.get(key);
    if (existing) {
      state.viewer.dataSources.remove(existing.dataSource, true);
      state.overlayLayers.delete(key);
    }
  }
  saveLayers({
    basemaps: Object.fromEntries(Object.entries(state.layers.basemaps).map(([k, v]) => [k, { enabled: v.enabled }])),
    overlays: Object.fromEntries(Object.entries(state.layers.overlays).map(([k, v]) => [k, { enabled: v.enabled }]))
  });
}