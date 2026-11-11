function bindEvents() {
  $('#panelCollapse').onclick = () => {
    state.ui.panelCollapsed = !state.ui.panelCollapsed;
    $('#layerPanel').classList.toggle('collapsed', state.ui.panelCollapsed);
    $('#panelCollapse svg').innerHTML = state.ui.panelCollapsed ? '<polyline points="9 18 15 12 9 6"/>' : '<polyline points="15 18 9 12 15 6"/>';
  };
  $('#btnLayers').onclick = () => {
    state.ui.panelOpen = !state.ui.panelOpen;
    $('#layerPanel').classList.toggle('open', state.ui.panelOpen);
    $('#btnLayers').setAttribute('aria-expanded', state.ui.panelOpen);
    if (window.innerWidth <= 1024) $('#mobilePanelToggle').style.display = state.ui.panelOpen ? 'none' : 'flex';
  };
  $('#mobilePanelToggle').onclick = () => $('#btnLayers').click();
  $('#searchInput').oninput = debounce((e) => { if (e.target.value.length >= 3) searchPlaces(e.target.value); }, CONFIG.SEARCH_DEBOUNCE);
  $('#searchInput').onkeydown = (e) => { if (e.key === 'Enter') searchPlaces(e.target.value); };
  $('#btnHome').onclick = () => state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(0, 30, 15000000), duration: 1.5 });
  $('#btnLocate').onclick = getUserLocation;
  $('#btnScreenshot').onclick = takeScreenshot;
  $('#btnMeasure').onclick = () => startMeasure('distance');
  $('#btnArea').onclick = () => startMeasure('area');
  $('#btnHeight').onclick = () => startMeasure('height');
  $('#btnRecord').onclick = () => showToast('Tour recording not implemented', 'info');
  $('#btnSettings').onclick = openSettingsModal;
  $('#settingsClose').onclick = () => closeModal('settingsModal');
  $('#exportClose').onclick = () => closeModal('exportModal');
  $('#customLayerClose').onclick = () => closeModal('customLayerModal');
  $$('.modal-overlay').forEach(m => m.onclick = (e) => { if (e.target === m) closeModal(m.id); });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'Escape') {
      if (state.measure.active) { stopMeasure(); return; }
      $$('.modal-overlay.open').forEach(m => closeModal(m.id));
      $$('.dropdown.open').forEach(d => closeDropdown(d));
      $('#contextMenu').classList.remove('open');
      return;
    }
    switch (e.key.toLowerCase()) {
      case 'h': if (!e.shiftKey) state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(0, 30, 15000000), duration: 1.5 }); break;
      case 'm': startMeasure(e.shiftKey ? 'area' : 'distance'); break;
      case 's': takeScreenshot(); break;
      case 'l': $('#btnLayers').click(); break;
      case ',': openSettingsModal(); break;
      case 'r': showToast('Tour recording not implemented', 'info'); break;
    }
  });
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#cesiumContainer')) { e.preventDefault(); showContextMenu(e.clientX, e.clientY); }
  });
  document.addEventListener('click', () => $('#contextMenu').classList.remove('open'));
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 1024) $('#mobilePanelToggle').style.display = state.ui.panelOpen ? 'none' : 'flex';
    else $('#mobilePanelToggle').style.display = 'none';
  });
  const params = new URLSearchParams(window.location.search);
  if (params.has('lng') && params.has('lat')) {
    const lng = parseFloat(params.get('lng'));
    const lat = parseFloat(params.get('lat'));
    const height = params.has('z') ? 15000000 / Math.pow(2, parseFloat(params.get('z'))) : 15000000;
    setTimeout(() => state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lng, lat, height), duration: 0 }), 1000);
  }
}

let lastFpsTime = performance.now();
let frameCount = 0;
let fps = 60;

function updateStatusLoop() {
  const now = performance.now();
  frameCount++;
  if (now - lastFpsTime >= 1000) { fps = Math.round(frameCount * 1000 / (now - lastFpsTime)); frameCount = 0; lastFpsTime = now; }
  if (state.viewer) {
    const camera = state.viewer.camera;
    const cartographic = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
    if (cartographic) {
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const height = cartographic.height;
      $('#statusCoords').textContent = formatCoordinate(lat, true) + ' ' + formatCoordinate(lon, false);
      $('#statusAltitude').textContent = formatAltitude(height);
      $('#statusCamera').textContent = '📷 ' + camera.heading.toFixed(2) + '° / ' + (-Cesium.Math.toDegrees(camera.pitch)).toFixed(2) + '° / ' + formatAltitude(height);
    }
    const clock = state.viewer.clock;
    if (clock.currentTime) { const date = Cesium.JulianDate.toDate(clock.currentTime); $('#statusTime').textContent = date.toISOString().slice(11, 19) + ' UTC'; }
    if (state.settings.showFPS) { $('#statusFPS').textContent = fps + ' FPS'; $('#statusFPS').style.color = fps >= 50 ? 'var(--success)' : (fps >= 30 ? 'var(--warning)' : 'var(--danger)'); }
    $('#statusClock').textContent = state.settings.clockMode === 'realtime' ? 'Real-time' : state.settings.clockMode === 'fixed' ? 'Fixed ' + state.settings.timeOfDay + ':00' : 'Sim ' + state.settings.timeMultiplier + 'x';
    const activeBasemap = Object.entries(state.layers.basemaps).find(([, v]) => v.enabled);
    if (activeBasemap) $('#statusCredit').textContent = activeBasemap[1].attribution.slice(0, 80);
  }
  requestAnimationFrame(updateStatusLoop);
}