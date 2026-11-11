function takeScreenshot() {
  const canvas = state.viewer.canvas;
  const link = document.createElement('a');
  link.download = 'freeglobe-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Screenshot saved', 'success');
}

function exportView() {
  const camera = state.viewer.camera;
  const cartographic = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
  const view = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    camera: {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
      heading: Cesium.Math.toDegrees(camera.heading),
      pitch: Cesium.Math.toDegrees(camera.pitch),
      roll: Cesium.Math.toDegrees(camera.roll)
    },
    layers: {
      basemap: Object.entries(state.layers.basemaps).find(([, v]) => v.enabled)?.[0],
      overlays: Object.entries(state.layers.overlays).filter(([, v]) => v.enabled).map(([k]) => k),
      custom: [...state.customLayers.entries()].filter(([, v]) => v.enabled).map(([k, v]) => ({ id: k, name: v.name, type: v.type }))
    },
    settings: { ...state.settings }
  };
  const blob = new Blob([JSON.stringify(view, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'freeglobe-view-' + Date.now() + '.json';
  link.href = url;
  link.click();
  showToast('View exported', 'success');
}

function exportKML() {
  let kml = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n';
  kml += '  <name>Free Globe Export</name>\n  <description>Exported ' + new Date().toISOString() + '</description>\n';
  const camera = state.viewer.camera;
  const cartographic = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
  kml += '  <LookAt>\n    <longitude>' + Cesium.Math.toDegrees(cartographic.longitude) + '</longitude>\n    <latitude>' + Cesium.Math.toDegrees(cartographic.latitude) + '</latitude>\n    <altitude>' + cartographic.height + '</altitude>\n    <heading>' + Cesium.Math.toDegrees(camera.heading) + '</heading>\n    <tilt>' + (90 - Cesium.Math.toDegrees(camera.pitch)) + '</tilt>\n    <range>' + Cesium.Math.toDegrees(camera.heading) + '</range>\n  </LookAt>\n';
  state.measure.entities.forEach(e => {
    if (e.position) {
      const pos = e.position.getValue(state.viewer.clock.currentTime);
      if (pos) {
        const c = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(pos);
        kml += '  <Placemark>\n    <name>Measure Point</name>\n    <Point>\n      <coordinates>' + Cesium.Math.toDegrees(c.longitude) + ',' + Cesium.Math.toDegrees(c.latitude) + ',' + c.height + '</coordinates>\n    </Point>\n  </Placemark>\n';
      }
    }
  });
  kml += '</Document>\n</kml>';
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'freeglobe-' + Date.now() + '.kml';
  link.href = url;
  link.click();
  showToast('KML exported', 'success');
}

function shareView() {
  const camera = state.viewer.camera;
  const cartographic = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
  const params = new URLSearchParams({
    lng: Cesium.Math.toDegrees(cartographic.longitude).toFixed(6),
    lat: Cesium.Math.toDegrees(cartographic.latitude).toFixed(6),
    z: Math.round(Math.log2(15000000 / cartographic.height) * 10) / 10
  });
  const url = window.location.origin + window.location.pathname + '?' + params;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied to clipboard', 'success');
  }).catch(() => {
    prompt('Copy this link:', url);
  });
}

async function searchPlaces(query) {
  if (!query.trim()) return;
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=5&addressdetails=1&accept-language=' + state.settings.language;
    const response = await fetch(url, { headers: { 'User-Agent': 'FreeGlobe/1.0 (https://github.com/freeglobe)' } });
    const results = await response.json();
    if (results.length) {
      const r = results[0];
      state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(parseFloat(r.lon), parseFloat(r.lat), 15000), duration: 1.5 });
      showToast('Found: ' + r.display_name, 'success');
    } else {
      showToast('No results found', 'warning');
    }
  } catch (e) {
    console.warn('Search failed:', e);
    showToast('Search failed', 'danger');
  }
}