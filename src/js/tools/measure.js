function startMeasure(mode) {
  if (state.measure.active) stopMeasure();
  state.measure.active = true;
  state.measure.mode = mode;
  state.measure.points = [];
  state.measure.entities = [];
  state.measure.labels = [];
  $('#btnMeasure').classList.toggle('active', mode === 'distance');
  $('#btnArea').classList.toggle('active', mode === 'area');
  $('#btnHeight').classList.toggle('active', mode === 'height');
  showToast('Click to add points. Double-click to finish.', 'info');
}

function stopMeasure() {
  state.measure.active = false;
  clearMeasureEntities();
  $('#btnMeasure').classList.remove('active');
  $('#btnArea').classList.remove('active');
  $('#btnHeight').classList.remove('active');
  $('#measureTooltip').style.display = 'none';
}

function clearMeasureEntities() {
  state.measure.entities.forEach(e => state.viewer.entities.remove(e));
  state.measure.labels.forEach(l => state.viewer.entities.remove(l));
  if (state.measure.polyline) state.viewer.entities.remove(state.measure.polyline);
  if (state.measure.polygon) state.viewer.entities.remove(state.measure.polygon);
  state.measure.entities = [];
  state.measure.labels = [];
  state.measure.polyline = null;
  state.measure.polygon = null;
}

function addMeasurePoint(cartesian) {
  if (state.measure.points.length >= CONFIG.MAX_MEASURE_POINTS) return;
  state.measure.points.push(cartesian);
  const point = state.viewer.entities.add({
    position: cartesian,
    point: { pixelSize: 10, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND }
  });
  state.measure.entities.push(point);
  updateMeasureGraphics();
}

function updateMeasureGraphics() {
  const { points, mode } = state.measure;
  if (points.length < 2) return;
  if (state.measure.polyline) state.viewer.entities.remove(state.measure.polyline);
  state.measure.polyline = state.viewer.entities.add({
    polyline: { positions: points, width: 3, material: Cesium.Color.YELLOW.withAlpha(0.8), clampToGround: true }
  });
  if (mode === 'area' && points.length >= 3) {
    if (state.measure.polygon) state.viewer.entities.remove(state.measure.polygon);
    state.measure.polygon = state.viewer.entities.add({
      polygon: { hierarchy: new Cesium.PolygonHierarchy(points), material: Cesium.Color.YELLOW.withAlpha(0.2), outline: true, outlineColor: Cesium.Color.YELLOW, outlineWidth: 2, clampToGround: true }
    });
  }
}

function finishMeasure() {
  if (state.measure.points.length < 2) { stopMeasure(); return; }
  const { points, mode } = state.measure;
  let resultText = '';
  if (mode === 'distance') {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += calculateDistance(points[i - 1], points[i]);
    resultText = 'Distance: ' + formatDistance(total);
  } else if (mode === 'area') {
    const area = calculatePolygonArea(points);
    resultText = 'Area: ' + formatArea(area);
  } else if (mode === 'height') {
    const profile = calculateHeightProfile(points);
    resultText = 'Elevation gain: ' + formatAltitude(profile.gain) + ' | Loss: ' + formatAltitude(profile.loss);
  }
  const last = points[points.length - 1];
  const label = state.viewer.entities.add({
    position: last,
    label: { text: resultText, font: '12px Inter, sans-serif', fillColor: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 3, pixelOffset: new Cesium.Cartesian2(0, -25), heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, backgroundColor: Cesium.Color.fromCssColorString('#12161dcc'), backgroundPadding: new Cesium.Cartesian2(8, 4) }
  });
  state.measure.labels.push(label);
  showToast(resultText, 'success', 6000);
  stopMeasure();
}

function calculateDistance(c1, c2) {
  const carto1 = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(c1);
  const carto2 = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(c2);
  const R = 6371000;
  const dLat = carto2.latitude - carto1.latitude;
  const dLon = carto2.longitude - carto1.longitude;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(carto1.latitude) * Math.cos(carto2.latitude) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculatePolygonArea(points) {
  if (points.length < 3) return 0;
  const ellipsoid = state.viewer.scene.globe.ellipsoid;
  let totalAngle = 0;
  for (let i = 0; i < points.length; i++) {
    const prev = ellipsoid.cartesianToCartographic(points[(i - 1 + points.length) % points.length]);
    const curr = ellipsoid.cartesianToCartographic(points[i]);
    const next = ellipsoid.cartesianToCartographic(points[(i + 1) % points.length]);
    const v1 = { lat: prev.latitude - curr.latitude, lon: prev.longitude - curr.longitude };
    const v2 = { lat: next.latitude - curr.latitude, lon: next.longitude - curr.longitude };
    const dot = v1.lat * v2.lat + v1.lon * v2.lon;
    const det = v1.lat * v2.lon - v1.lon * v2.lat;
    totalAngle += Math.atan2(det, dot);
  }
  const R = ellipsoid.maximumRadius;
  return Math.abs(totalAngle - (points.length - 2) * Math.PI) * R * R;
}

function calculateHeightProfile(points) {
  const samples = 50;
  let gain = 0, loss = 0, prevElev = null;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const idx = Math.floor(t * (points.length - 1));
    const nextIdx = Math.min(idx + 1, points.length - 1);
    const localT = (t * (points.length - 1)) - idx;
    const c1 = points[idx];
    const c2 = points[nextIdx];
    const carto1 = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(c1);
    const carto2 = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(c2);
    const lat = carto1.latitude + (carto2.latitude - carto1.latitude) * localT;
    const lon = carto1.longitude + (carto2.longitude - carto1.longitude) * localT;
    const cartographic = new Cesium.Cartographic(lon, lat);
    const height = state.viewer.scene.globe.getHeight(cartographic) || 0;
    if (prevElev !== null) {
      const diff = height - prevElev;
      if (diff > 0) gain += diff; else loss += Math.abs(diff);
    }
    prevElev = height;
  }
  return { gain, loss };
}