function openCustomLayerModal() {
  const body = $('#customLayerBody');
  body.innerHTML = '<div class="control-group"><label class="control-label"><span>Layer Name</span></label><div class="input-wrap"><input type="text" id="customLayerName" placeholder="My Custom Layer"></div></div><div class="control-group"><label class="control-label"><span>Type</span></label><div class="select-wrap"><select id="customLayerType"><option value="geojson">GeoJSON (.geojson, .json)</option><option value="kml">KML (.kml)</option><option value="kmz">KMZ (.kmz)</option><option value="csv">CSV with lat/lon columns</option><option value="gpx">GPX (.gpx)</option></select></div></div><div class="control-group"><label class="control-label"><span>Source</span></label><div class="input-wrap"><input type="url" id="customLayerUrl" placeholder="https://example.com/data.geojson"></div><small>OR</small></div><div class="control-group"><label class="file-wrap"><button class="btn file-btn"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Choose File</button><input type="file" id="customLayerFile" accept=".geojson,.json,.kml,.kmz,.csv,.gpx" style="display:none;"></label><small>Drag & drop or click to select</small></div><div class="control-group"><label class="control-label"><span>Style (optional)</span></label><div class="input-wrap"><textarea id="customLayerStyle" placeholder=\'{"stroke": "#1a73e8", "strokeWidth": 2, "fill": "#1a73e840", "markerSize": 6, "markerColor": "#ea4335"}\' rows="4"></textarea></div></div><div class="btn-group" style="margin-top:16px;justify-content:flex-end;"><button class="btn" id="customLayerCancel">Cancel</button><button class="btn btn-primary" id="customLayerAdd">Add Layer</button></div>';
  $('#customLayerFile').onchange = (e) => {
    const file = e.target.files[0];
    if (file) { $('#customLayerUrl').value = ''; showToast('Selected: ' + file.name, 'info'); }
  };
  $('#customLayerUrl').oninput = () => { if ($('#customLayerUrl').value) $('#customLayerFile').value = ''; };
  $('#customLayerCancel').onclick = () => closeModal('customLayerModal');
  $('#customLayerAdd').onclick = async () => {
    const name = $('#customLayerName').value.trim() || 'Custom Layer';
    const type = $('#customLayerType').value;
    const url = $('#customLayerUrl').value.trim() || null;
    const file = $('#customLayerFile').files[0] || null;
    let style = {};
    try { style = JSON.parse($('#customLayerStyle').value || '{}'); } catch {}
    if (!url && !file) { showToast('Please provide a URL or file', 'warning'); return; }
    $('#customLayerAdd').disabled = true; $('#customLayerAdd').textContent = 'Adding...';
    await addCustomLayer({ name, type, url, file, style });
    closeModal('customLayerModal');
    $('#customLayerAdd').disabled = false; $('#customLayerAdd').textContent = 'Add Layer';
  };
  openModal('customLayerModal');
}

function openSettingsModal() {
  const body = $('#settingsBody');
  body.innerHTML = '<div class="control-group"><label class="control-label"><span>Auto-save interval</span></label><div class="select-wrap"><select id="autoSaveInterval"><option value="0" ' + (CONFIG.AUTO_SAVE_INTERVAL === 0 ? 'selected' : '') + '>Disabled</option><option value="10000" ' + (CONFIG.AUTO_SAVE_INTERVAL === 10000 ? 'selected' : '') + '>10 seconds</option><option value="30000" ' + (CONFIG.AUTO_SAVE_INTERVAL === 30000 ? 'selected' : '') + '>30 seconds</option><option value="60000" ' + (CONFIG.AUTO_SAVE_INTERVAL === 60000 ? 'selected' : '') + '>1 minute</option><option value="300000" ' + (CONFIG.AUTO_SAVE_INTERVAL === 300000 ? 'selected' : '') + '>5 minutes</option></select></div></div><div class="control-group"><label class="switch-wrap"><span>Hardware acceleration</span><label class="switch"><input type="checkbox" id="hwAccel" checked></label></label></div><div class="control-group"><label class="switch-wrap"><span>Anti-aliasing (FXAA)</span><label class="switch"><input type="checkbox" id="fxaa" checked></label></label></div><div class="control-group"><label class="switch-wrap"><span>High DPI support</span><label class="switch"><input type="checkbox" id="highDpi" checked></label></label></div><div class="divider"></div><div class="btn-group" style="justify-content:flex-end;"><button class="btn" id="resetSettings">Reset to Defaults</button><button class="btn btn-primary" id="saveSettingsBtn">Save</button></div>';
  $('#resetSettings').onclick = () => { if (confirm('Reset all settings to defaults?')) { localStorage.removeItem('freeGlobeSettings'); localStorage.removeItem('freeGlobeLayers'); location.reload(); } };
  $('#saveSettingsBtn').onclick = () => { closeModal('settingsModal'); showToast('Settings saved', 'success'); };
  openModal('settingsModal');
}

function showContextMenu(x, y) {
  const menu = $('#contextMenu');
  const camera = state.viewer.camera;
  const cartographic = state.viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const lng = Cesium.Math.toDegrees(cartographic.longitude);
  menu.innerHTML = '<button class="context-menu-item" data-action="copyCoords"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy Coordinates</button><button class="context-menu-item" data-action="addPlacemark"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Add Placemark</button><button class="context-menu-item" data-action="measureFromHere"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>Measure from Here</button><div class="context-menu-divider"></div><button class="context-menu-item" data-action="flyHere"><svg viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>Fly to Here</button><button class="context-menu-item" data-action="searchHere"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16 16l4 4"/></svg>Search Nearby</button><div class="context-menu-divider"></div><button class="context-menu-item" data-action="viewOnOSM"><svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>View on OpenStreetMap</button>';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.add('open');
  menu.querySelectorAll('[data-action]').forEach(btn => {
    btn.onclick = () => { const action = btn.dataset.action; menu.classList.remove('open'); handleContextAction(action, lat, lng); };
  });
}

function handleContextAction(action, lat, lng) {
  switch (action) {
    case 'copyCoords':
      navigator.clipboard.writeText(lat.toFixed(6) + ', ' + lng.toFixed(6));
      showToast('Copied: ' + lat.toFixed(6) + ', ' + lng.toFixed(6), 'success');
      break;
    case 'addPlacemark':
      state.viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(lng, lat), name: 'Placemark', point: { pixelSize: 12, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 2 }, label: { text: 'Placemark', font: '12px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, pixelOffset: new Cesium.Cartesian2(0, -20) } });
      showToast('Placemark added', 'success');
      break;
    case 'measureFromHere':
      startMeasure('distance');
      const cartesian = Cesium.Cartesian3.fromDegrees(lng, lat);
      state.measure.points = [cartesian];
      updateMeasureGraphics();
      break;
    case 'flyHere':
      state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lng, lat, 5000), duration: 1.5 });
      break;
    case 'searchHere':
      searchPlaces(lat + ', ' + lng);
      break;
    case 'viewOnOSM':
      window.open('https://www.openstreetmap.org/#map=15/' + lat + '/' + lng, '_blank');
      break;
  }
}

function getUserLocation() {
  if (!navigator.geolocation) { showToast('Geolocation not supported', 'warning'); return; }
  showToast('Requesting location...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => { const { latitude, longitude } = pos.coords; state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000), duration: 1.5 }); showToast('Located: ' + latitude.toFixed(4) + ', ' + longitude.toFixed(4), 'success'); },
    (err) => showToast('Location error: ' + err.message, 'danger'),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}