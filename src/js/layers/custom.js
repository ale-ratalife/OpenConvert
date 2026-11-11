async function addCustomLayer(options) {
  const id = generateId();
  const { name, type, url, file, style = {} } = options;

  try {
    let dataSource;
    if (type === 'geojson' || type === 'kml' || type === 'kmz') {
      if (file) {
        const text = await file.text();
        const mime = type === 'kml' ? 'application/vnd.google-earth.kml+xml' : 'application/json';
        const blob = new Blob([text], { type: mime });
        const url_ = URL.createObjectURL(blob);
        dataSource = await loadCustomDataSource(id, url_, type, style);
      } else if (url) {
        dataSource = await loadCustomDataSource(id, url, type, style);
      }
    } else if (type === 'csv') {
      if (file) {
        const text = await file.text();
        const geojson = csvToGeoJSON(text);
        const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
        const url_ = URL.createObjectURL(blob);
        dataSource = await loadGeoJSONDataSource(id, url_, style);
      }
    } else if (type === 'gpx') {
      if (file) {
        const text = await file.text();
        const geojson = gpxToGeoJSON(text);
        const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
        const url_ = URL.createObjectURL(blob);
        dataSource = await loadGeoJSONDataSource(id, url_, style);
      }
    }

    if (dataSource) {
      state.viewer.dataSources.add(dataSource);
      state.customLayers.set(id, { dataSource, name, type, style, enabled: true });
      showToast('Added custom layer: ' + name, 'success');
      buildUI();
      return id;
    }
  } catch (e) {
    console.error('Failed to add custom layer:', e);
    showToast('Failed to add custom layer', 'danger');
  }
  return null;
}

async function loadCustomDataSource(id, url, type, style) {
  if (type === 'kml' || type === 'kmz') {
    const dataSource = new Cesium.KmlDataSource();
    await dataSource.load(url, { camera: state.viewer.scene.camera, canvas: state.viewer.scene.canvas });
    return dataSource;
  }
  return loadGeoJSONDataSource(id, url, style);
}

function removeCustomLayer(id) {
  const layer = state.customLayers.get(id);
  if (layer) {
    state.viewer.dataSources.remove(layer.dataSource, true);
    state.customLayers.delete(id);
    buildUI();
    showToast('Custom layer removed', 'info');
  }
}

function toggleCustomLayer(id, enabled) {
  const layer = state.customLayers.get(id);
  if (layer) {
    layer.enabled = enabled;
    layer.dataSource.show = enabled;
  }
}