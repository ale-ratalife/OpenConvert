function setupClock() {
  const clock = state.viewer.clock;
  switch (state.settings.clockMode) {
    case 'realtime':
      clock.clockRange = Cesium.ClockRange.CLAMPED;
      clock.shouldAnimate = true;
      clock.multiplier = 1;
      clock.currentTime = Cesium.JulianDate.fromDate(new Date());
      break;
    case 'fixed':
      clock.clockRange = Cesium.ClockRange.CLAMPED;
      clock.shouldAnimate = false;
      const date = new Date();
      date.setUTCHours(state.settings.timeOfDay, 0, 0, 0);
      clock.currentTime = Cesium.JulianDate.fromDate(date);
      break;
    case 'simulation':
      clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      clock.shouldAnimate = true;
      clock.multiplier = state.settings.timeMultiplier;
      const startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      clock.startTime = Cesium.JulianDate.fromDate(startDate);
      const endDate = new Date();
      endDate.setUTCHours(24, 0, 0, 0);
      clock.stopTime = Cesium.JulianDate.fromDate(endDate);
      clock.currentTime = clock.startTime;
      break;
  }
}

function updateClockTime(hours) {
  state.settings.timeOfDay = hours;
  const date = new Date();
  date.setUTCHours(hours, 0, 0, 0);
  state.viewer.clock.currentTime = Cesium.JulianDate.fromDate(date);
  if (state.settings.clockMode === 'fixed') state.viewer.clock.shouldAnimate = false;
}

function updateTerrain() {
  const globe = state.viewer.scene.globe;
  globe.show = true;
  globe.terrainExaggeration = state.settings.terrainExaggeration;
  if (globe.terrainProvider instanceof Cesium.CesiumTerrainProvider) {
    globe.terrainProvider._requestWaterMask = state.settings.showWater;
  }
}

function updateAtmosphere() {
  const scene = state.viewer.scene;
  scene.skyAtmosphere.show = state.settings.atmosphere;
  scene.fog.enabled = state.settings.fog;
  state.viewer.shadows = state.settings.shadows;
}