function buildUI() {
  const content = $('#panelContent');
  content.innerHTML = '';
  content.appendChild(createBasemapsSection());
  content.appendChild(createOverlaysSection());
  content.appendChild(createCustomLayersSection());
  content.appendChild(createTerrainAtmosphereSection());
  content.appendChild(createTimeSection());
  content.appendChild(createDisplaySection());
  content.appendChild(createToolsSection());
  content.appendChild(createAboutSection());
}

function createSection(title, id, icon = '') {
  const section = document.createElement('div');
  section.className = 'section';
  section.id = id;
  section.innerHTML = '<div class="section-header" data-section="' + id + '"><span class="section-title">' + icon + ' ' + title + '</span><span class="section-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span></div><div class="section-body"></div>';
  section.querySelector('.section-header').onclick = () => section.classList.toggle('collapsed');
  return section;
}

function createBasemapsSection() {
  const section = createSection('Basemap', 'section-basemaps', '🗺️');
  const body = section.querySelector('.section-body');
  Object.entries(state.layers.basemaps).forEach(([key, config]) => {
    const wrap = document.createElement('div');
    wrap.className = 'control-group';
    wrap.innerHTML = '<label class="radio-wrap" data-tip="' + config.attribution + (config.needsKey ? ' (Requires free API key)' : '') + '"><input type="radio" name="basemap" value="' + key + '" ' + (config.enabled ? 'checked' : '') + (config.needsKey ? ' disabled' : '') + '><span>' + config.name + (config.needsKey ? ' 🔑' : '') + '</span></label>';
    wrap.querySelector('input').onchange = () => setBasemap(key);
    body.appendChild(wrap);
  });
  return section;
}

function createOverlaysSection() {
  const section = createSection('Overlays', 'section-overlays', '📍');
  const body = section.querySelector('.section-body');
  const categories = {};
  Object.entries(state.layers.overlays).forEach(([key, config]) => {
    if (!categories[config.category]) categories[config.category] = [];
    categories[config.category].push({ key, config });
  });
  Object.entries(state.layers.categories).sort(([, a], [, b]) => a.order - b.order).forEach(([catKey, cat]) => {
    const catLayers = categories[catKey];
    if (!catLayers || !catLayers.length) return;
    const catDiv = document.createElement('div');
    catDiv.className = 'control-group';
    catDiv.innerHTML = '<div class="divider-label"><span>' + cat.icon + ' ' + cat.name + '</span></div>';
    catLayers.forEach(({ key, config }) => {
      const wrap = document.createElement('div');
      wrap.className = 'control-group';
      wrap.innerHTML = '<label class="checkbox-wrap" data-tip="' + (config.config?.attribution || '') + '"><input type="checkbox" data-overlay="' + key + '" ' + (config.enabled ? 'checked' : '') + '><span>' + config.name + '</span></label>';
      wrap.querySelector('input').onchange = (e) => toggleOverlay(key, e.target.checked);
      catDiv.appendChild(wrap);
    });
    body.appendChild(catDiv);
  });
  return section;
}

function createCustomLayersSection() {
  const section = createSection('Custom Layers', 'section-custom', '➕');
  const body = section.querySelector('.section-body');
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-primary';
  addBtn.style.width = '100%';
  addBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Custom Layer';
  addBtn.onclick = () => openCustomLayerModal();
  body.appendChild(addBtn);
  if (state.customLayers.size > 0) {
    const divider = document.createElement('div');
    divider.className = 'divider-label';
    divider.innerHTML = '<span>Your Layers</span>';
    body.appendChild(divider);
    state.customLayers.forEach((layer, id) => {
      const wrap = document.createElement('div');
      wrap.className = 'control-group';
      wrap.innerHTML = '<div class="layer-node-leaf"><span class="layer-node-icon"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span><input type="checkbox" ' + (layer.enabled ? 'checked' : '') + ' style="margin-right:8px;width:16px;height:16px;"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + layer.name + '</span><button class="btn btn-sm btn-danger" data-remove="' + id + '" style="padding:4px 8px;font-size:10px;">Remove</button></div>';
      wrap.querySelector('input').onchange = (e) => toggleCustomLayer(id, e.target.checked);
      wrap.querySelector('[data-remove]').onclick = () => removeCustomLayer(id);
      body.appendChild(wrap);
    });
  }
  return section;
}

function createTerrainAtmosphereSection() {
  const section = createSection('Terrain & Atmosphere', 'section-terrain', '🌍');
  const body = section.querySelector('.section-body');
  body.innerHTML = '<div class="control-group"><label class="switch-wrap"><span>3D Terrain</span><label class="switch"><input type="checkbox" id="terrainEnabled" checked><span></span></label></label></div><div class="control-group"><label class="switch-wrap"><span>Water Mask</span><label class="switch"><input type="checkbox" id="showWater" ' + (state.settings.showWater ? 'checked' : '') + '></label></label></div><div class="control-group"><div class="slider-wrap"><div class="slider-header"><span>Terrain Exaggeration</span><span class="slider-value" id="exagValue">' + state.settings.terrainExaggeration.toFixed(1) + 'x</span></div><input type="range" id="terrainExaggeration" min="0.1" max="5" step="0.1" value="' + state.settings.terrainExaggeration + '"><div class="slider-labels"><span>0.1x</span><span>5x</span></div></div></div><div class="divider"></div><div class="control-group"><label class="switch-wrap"><span>Atmosphere</span><label class="switch"><input type="checkbox" id="atmosphereEnabled" ' + (state.settings.atmosphere ? 'checked' : '') + '></label></label></div><div class="control-group"><label class="switch-wrap"><span>Fog</span><label class="switch"><input type="checkbox" id="fogEnabled" ' + (state.settings.fog ? 'checked' : '') + '></label></label></div><div class="control-group"><label class="switch-wrap"><span>Shadows</span><label class="switch"><input type="checkbox" id="shadowsEnabled" ' + (state.settings.shadows ? 'checked' : '') + '></label></label></div>';
  $('#terrainEnabled').onchange = (e) => { state.viewer.scene.globe.show = e.target.checked; };
  $('#showWater').onchange = (e) => { state.settings.showWater = e.target.checked; updateTerrain(); saveSettings(state.settings); };
  $('#terrainExaggeration').oninput = (e) => { state.settings.terrainExaggeration = parseFloat(e.target.value); updateTerrain(); $('#exagValue').textContent = state.settings.terrainExaggeration.toFixed(1) + 'x'; saveSettings(state.settings); };
  $('#atmosphereEnabled').onchange = (e) => { state.settings.atmosphere = e.target.checked; updateAtmosphere(); saveSettings(state.settings); };
  $('#fogEnabled').onchange = (e) => { state.settings.fog = e.target.checked; updateAtmosphere(); saveSettings(state.settings); };
  $('#shadowsEnabled').onchange = (e) => { state.settings.shadows = e.target.checked; updateAtmosphere(); saveSettings(state.settings); };
  return section;
}

function createTimeSection() {
  const section = createSection('Time & Clock', 'section-time', '🕐');
  const body = section.querySelector('.section-body');
  body.innerHTML = '<div class="control-group"><label class="control-label"><span>Clock Mode</span></label><div class="select-wrap"><select id="clockMode"><option value="realtime" ' + (state.settings.clockMode === 'realtime' ? 'selected' : '') + '>Real-time (sync with system)</option><option value="fixed" ' + (state.settings.clockMode === 'fixed' ? 'selected' : '') + '>Fixed time of day</option><option value="simulation" ' + (state.settings.clockMode === 'simulation' ? 'selected' : '') + '>Simulation (accelerated)</option></select></div></div><div class="control-group" id="fixedTimeGroup" style="display:' + (state.settings.clockMode === 'fixed' ? 'block' : 'none') + '"><div class="slider-wrap"><div class="slider-header"><span>Time of Day (UTC)</span><span class="slider-value" id="timeValue">' + state.settings.timeOfDay + ':00</span></div><input type="range" id="timeOfDay" min="0" max="23.75" step="0.25" value="' + state.settings.timeOfDay + '"><div class="slider-labels"><span>0:00</span><span>12:00</span><span>24:00</span></div></div></div><div class="control-group" id="simulationGroup" style="display:' + (state.settings.clockMode === 'simulation' ? 'block' : 'none') + '"><div class="slider-wrap"><div class="slider-header"><span>Time Multiplier</span><span class="slider-value" id="multiplierValue">' + state.settings.timeMultiplier + 'x</span></div><input type="range" id="timeMultiplier" min="1" max="3600" step="1" value="' + state.settings.timeMultiplier + '"><div class="slider-labels"><span>1x (real-time)</span><span>60x</span><span>3600x</span></div></div></div><div class="control-group"><label class="switch-wrap"><span>Show clock in status bar</span><label class="switch"><input type="checkbox" id="showClock" checked></label></label></div>';
  $('#clockMode').onchange = (e) => {
    state.settings.clockMode = e.target.value;
    $('#fixedTimeGroup').style.display = e.target.value === 'fixed' ? 'block' : 'none';
    $('#simulationGroup').style.display = e.target.value === 'simulation' ? 'block' : 'none';
    setupClock();
    saveSettings(state.settings);
  };
  $('#timeOfDay').oninput = (e) => {
    const val = parseFloat(e.target.value);
    state.settings.timeOfDay = val;
    $('#timeValue').textContent = Math.floor(val) + ':' + ((val % 1) * 60 || '00');
    updateClockTime(val);
    saveSettings(state.settings);
  };
  $('#timeMultiplier').oninput = (e) => {
    state.settings.timeMultiplier = parseInt(e.target.value);
    $('#multiplierValue').textContent = state.settings.timeMultiplier + 'x';
    setupClock();
    saveSettings(state.settings);
  };
  return section;
}

function createDisplaySection() {
  const section = createSection('Display & Units', 'section-display', '🎨');
  const body = section.querySelector('.section-body');
  body.innerHTML = '<div class="control-group"><label class="control-label"><span>Coordinate Format</span></label><div class="select-wrap"><select id="coordFormat"><option value="dms" ' + (state.settings.coordinateFormat === 'dms' ? 'selected' : '') + '>DMS (45°30\'15"N)</option><option value="dmm" ' + (state.settings.coordinateFormat === 'dmm' ? 'selected' : '') + '>DMM (45°30.25\'N)</option><option value="dd" ' + (state.settings.coordinateFormat === 'dd' ? 'selected' : '') + '>DD (45.5042°N)</option></select></div></div><div class="control-group"><label class="control-label"><span>Units</span></label><div class="select-wrap"><select id="unitsSelect"><option value="metric" ' + (state.settings.units === 'metric' ? 'selected' : '') + '>Metric (m, km)</option><option value="imperial" ' + (state.settings.units === 'imperial' ? 'selected' : '') + '>Imperial (ft, mi)</option></select></div></div><div class="control-group"><label class="switch-wrap"><span>Show FPS</span><label class="switch"><input type="checkbox" id="showFPS" ' + (state.settings.showFPS ? 'checked' : '') + '></label></label></div><div class="control-group"><label class="switch-wrap"><span>Show Attribution</span><label class="switch"><input type="checkbox" id="showCredits" ' + (state.settings.showCredits ? 'checked' : '') + '></label></label></div><div class="divider"></div><div class="control-group"><label class="control-label"><span>Theme</span></label><div class="select-wrap"><select id="themeSelect"><option value="dark" ' + (state.settings.theme === 'dark' ? 'selected' : '') + '>Dark</option><option value="light" ' + (state.settings.theme === 'light' ? 'selected' : '') + '>Light</option><option value="auto" ' + (state.settings.theme === 'auto' ? 'selected' : '') + '>Auto (system)</option></select></div></div><div class="control-group"><label class="control-label"><span>Language</span></label><div class="select-wrap"><select id="languageSelect"><option value="en" ' + (state.settings.language === 'en' ? 'selected' : '') + '>English</option><option value="es" ' + (state.settings.language === 'es' ? 'selected' : '') + '>Español</option><option value="fr" ' + (state.settings.language === 'fr' ? 'selected' : '') + '>Français</option><option value="de" ' + (state.settings.language === 'de' ? 'selected' : '') + '>Deutsch</option><option value="zh" ' + (state.settings.language === 'zh' ? 'selected' : '') + '>中文</option><option value="ja" ' + (state.settings.language === 'ja' ? 'selected' : '') + '>日本語</option><option value="pt" ' + (state.settings.language === 'pt' ? 'selected' : '') + '>Português</option><option value="ru" ' + (state.settings.language === 'ru' ? 'selected' : '') + '>Русский</option></select></div></div>';
  $('#coordFormat').onchange = (e) => { state.settings.coordinateFormat = e.target.value; saveSettings(state.settings); };
  $('#unitsSelect').onchange = (e) => { state.settings.units = e.target.value; saveSettings(state.settings); };
  $('#showFPS').onchange = (e) => { state.settings.showFPS = e.target.checked; saveSettings(state.settings); };
  $('#showCredits').onchange = (e) => { state.settings.showCredits = e.target.checked; saveSettings(state.settings); state.viewer._cesiumWidget._creditContainer.style.display = e.target.checked ? 'block' : 'none'; };
  $('#themeSelect').onchange = (e) => { state.settings.theme = e.target.value; applyTheme(e.target.value); saveSettings(state.settings); };
  $('#languageSelect').onchange = (e) => { state.settings.language = e.target.value; saveSettings(state.settings); };
  return section;
}

function createToolsSection() {
  const section = createSection('Tools', 'section-tools', '🛠️');
  const body = section.querySelector('.section-body');
  body.innerHTML = '<div class="btn-group"><button class="btn btn-primary" id="btnScreenshotFull" style="flex:1"><svg viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12z"/><circle cx="12" cy="12" r="3"/></svg>Screenshot</button><button class="btn" id="btnExportView" style="flex:1"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Export View</button></div><div class="btn-group" style="margin-top:8px;"><button class="btn" id="btnExportKML" style="flex:1"><svg viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>Export KML</button><button class="btn" id="btnShareView" style="flex:1"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share Link</button></div><div class="divider"></div><div class="control-group"><label class="control-label"><span>Measure Mode</span></label><div class="btn-group"><button class="btn" id="toolDistance" data-mode="distance"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>Distance</button><button class="btn" id="toolArea" data-mode="area"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M12 7.5l2.5 3.5L12 15.5 9.5 12z"/></svg>Area</button><button class="btn" id="toolHeight" data-mode="height"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17h6v-6H9v6zm2-8h2v4h-2z"/></svg>Height</button></div></div><div class="control-group"><label class="control-label"><span>Camera</span></label><div class="btn-group"><button class="btn" id="toolHome"><svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home</button><button class="btn" id="toolLocate"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>My Location</button><button class="btn" id="toolResetTilt"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Reset Tilt</button><button class="btn" id="toolResetHeading"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>North Up</button></div></div>';
  $('#btnScreenshotFull').onclick = takeScreenshot;
  $('#btnExportView').onclick = exportView;
  $('#btnExportKML').onclick = exportKML;
  $('#btnShareView').onclick = shareView;
  $('#toolDistance').onclick = () => startMeasure('distance');
  $('#toolArea').onclick = () => startMeasure('area');
  $('#toolHeight').onclick = () => startMeasure('height');
  $('#toolHome').onclick = () => state.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(0, 30, 15000000), duration: 1.5 });
  $('#toolLocate').onclick = getUserLocation;
  $('#toolResetTilt').onclick = () => state.viewer.camera.flyTo({ destination: state.viewer.camera.position, pitch: -Cesium.Math.PI_OVER_TWO, duration: 1 });
  $('#toolResetHeading').onclick = () => state.viewer.camera.flyTo({ destination: state.viewer.camera.position, heading: 0, duration: 1 });
  return section;
}

function createAboutSection() {
  const section = createSection('About', 'section-about', 'ℹ️');
  const body = section.querySelector('.section-body');
  body.innerHTML = '<div style="font-size:12px;color:var(--fg-muted);line-height:1.7;"><p><strong>Free Globe</strong> — Professional open-source virtual globe</p><p>Built with <a href="https://cesium.com/platform/cesiumjs/" target="_blank" style="color:var(--accent);">CesiumJS</a> and open data</p><div class="divider"></div><p><strong>Data Sources:</strong></p><ul style="margin-left:16px;margin-top:4px;font-size:11px;"><li>Basemaps: OpenStreetMap, Esri, CartoDB, Stamen, OpenTopoMap, Thunderforest, MapTiler, NASA GIBS, Sentinel-2</li><li>Vectors: Natural Earth, world-atlas, OpenFlights</li><li>Live: USGS Earthquakes</li><li>Terrain: Cesium World Terrain (Cesium Ion free tier)</li></ul><div class="divider"></div><p><strong>Keyboard Shortcuts:</strong></p><ul style="margin-left:16px;margin-top:4px;font-size:11px;"><li><kbd style="background:var(--bg);border:1px solid var(--border);padding:1px 4px;border-radius:3px;font-family:monospace;">H</kbd> Home view</li><li><kbd style="background:var(--bg);border:1px solid var(--border);padding:1px 4px;border-radius:3px;font-family:monospace;">M</kbd> Measure distance</li><li><kbd style="background:var(--bg);border:1px solid var(--border);padding:1px 4px;border-radius:3px;font-family:monospace;">Shift+M</kbd> Measure area</li><li><kbd style="background:var(--bg);border:1px solid var(--border);padding:1px 4px;border-radius:3px;font-family:monospace;">S</kbd> Screenshot</li><li><kbd style="background:var(--bg);border:1px solid var(--border);padding:1px 4px;border-radius:3px;font-family:monospace;">L</kbd> Toggle layers</li><li><kbd style="background:var(--bg);border:1px solid var(--border);padding:1px 4px;border-radius:3px;font-family:monospace;">,</kbd> Settings</li><li><kbd style="background:var(--bg);border:1px solid var(--border);padding:1px 4px;border-radius:3px;font-family:monospace;">Esc</kbd> Cancel measure/close modals</li></ul><div class="divider"></div><p style="font-size:10px;">Version 1.0.0 • No API keys required • MIT License</p><p style="font-size:10px;">Not affiliated with Google Earth • Educational/research use</p></div>';
  return section;
}