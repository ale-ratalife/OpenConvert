loadSettings();
loadLayers();
applyTheme(state.settings.theme);

if (window.matchMedia('(prefers-color-scheme: dark)').matches && state.settings.theme === 'auto') applyAutoTheme(true);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { if (state.settings.theme === 'auto') applyAutoTheme(e.matches); });

setInterval(() => { saveSettings(state.settings); saveLayers({ basemaps: Object.fromEntries(Object.entries(state.layers.basemaps).map(([k, v]) => [k, { enabled: v.enabled }])), overlays: Object.fromEntries(Object.entries(state.layers.overlays).map(([k, v]) => [k, { enabled: v.enabled }])) }); }, CONFIG.AUTO_SAVE_INTERVAL);

initViewer().catch(err => {
  console.error('Failed to initialize:', err);
  $('#splash').innerHTML = '<div style="color:var(--danger);text-align:center;"><h2>Initialization Failed</h2><p>' + err.message + '</p><button class="btn btn-primary" onclick="location.reload()">Retry</button></div>';
});