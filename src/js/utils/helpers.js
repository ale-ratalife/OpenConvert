const $ = (sel, ctx = document) => (typeof ctx === 'string' ? document.querySelector(ctx) : ctx).querySelector(sel);
const $$ = (sel, ctx = document) => [...(typeof ctx === 'string' ? document.querySelector(ctx) : ctx).querySelectorAll(sel)];

const formatCoordinate = (deg, isLat, format = 'dms') => {
  const abs = Math.abs(deg);
  const degInt = Math.floor(abs);
  const minFloat = (abs - degInt) * 60;
  const minInt = Math.floor(minFloat);
  const sec = (minFloat - minInt) * 60;
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
  switch (format) {
    case 'dms':
      return `${degInt}°${minInt.toString().padStart(2, '0')}'${sec.toFixed(2).padStart(5, '0')}"${dir}`;
    case 'dmm':
      return `${degInt}°${minFloat.toFixed(4).padStart(7, '0')}'${dir}`;
    case 'dd':
      return `${deg.toFixed(6)}°${dir}`;
    default:
      return `${deg.toFixed(4)}°`;
  }
};

const formatDistance = (meters, units = 'metric') => {
  if (units === 'imperial') {
    const feet = meters * 3.28084;
    if (feet < 1000) return `${feet.toFixed(0)} ft`;
    const miles = feet / 5280;
    return `${miles.toFixed(2)} mi`;
  }
  if (meters < 1000) return `${meters.toFixed(0)} m`;
  if (meters < 100000) return `${(meters / 1000).toFixed(2)} km`;
  return `${(meters / 1000).toFixed(0)} km`;
};

const formatArea = (sqMeters, units = 'metric') => {
  if (units === 'imperial') {
    const acres = sqMeters / 4046.86;
    if (acres < 1) return `${(sqMeters * 10.764).toFixed(0)} sq ft`;
    if (acres < 640) return `${acres.toFixed(1)} acres`;
    return `${(acres / 640).toFixed(2)} sq mi`;
  }
  if (sqMeters < 10000) return `${sqMeters.toFixed(0)} m²`;
  if (sqMeters < 1e6) return `${(sqMeters / 1e4).toFixed(2)} ha`;
  if (sqMeters < 1e8) return `${(sqMeters / 1e6).toFixed(2)} km²`;
  return `${(sqMeters / 1e6).toFixed(0)} km²`;
};

const formatAltitude = (meters, units = 'metric') => {
  if (units === 'imperial') return `${(meters * 3.28084).toFixed(0)} ft`;
  return `${meters.toFixed(0)} m`;
};

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const throttle = (fn, ms) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const showToast = (message, type = 'info', duration = 4000) => {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    success: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    danger: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  };
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span><button class="toast-close" aria-label="Dismiss"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  toast.querySelector('.toast-close').onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

const openModal = (id) => $('#' + id).classList.add('open');
const closeModal = (id) => $('#' + id).classList.remove('open');
const openDropdown = (el) => el.classList.add('open');
const closeDropdown = (el) => el.classList.remove('open');

const saveSettings = (settings) => {
  try { localStorage.setItem('freeGlobeSettings', JSON.stringify(settings)); } catch {}
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('freeGlobeSettings');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

const saveLayers = (layers) => {
  try { localStorage.setItem('freeGlobeLayers', JSON.stringify(layers)); } catch {}
};

const loadLayers = () => {
  try {
    const saved = localStorage.getItem('freeGlobeLayers');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'light') {
    root.style.setProperty('--bg', '#f8f9fa');
    root.style.setProperty('--bg-elevated', '#ffffff');
    root.style.setProperty('--bg-hover', '#e9ecef');
    root.style.setProperty('--border', '#dee2e6');
    root.style.setProperty('--border-bright', '#ced4da');
    root.style.setProperty('--fg', '#212529');
    root.style.setProperty('--fg-muted', '#6c757d');
    root.style.setProperty('--fg-subtle', '#adb5bd');
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyAutoTheme(prefersDark);
  } else {
    root.style.setProperty('--bg', '#0a0d12');
    root.style.setProperty('--bg-elevated', '#12161d');
    root.style.setProperty('--bg-hover', '#1a202c');
    root.style.setProperty('--border', '#2a2f3a');
    root.style.setProperty('--border-bright', '#3a3f4a');
    root.style.setProperty('--fg', '#e8eaed');
    root.style.setProperty('--fg-muted', '#9aa0a6');
    root.style.setProperty('--fg-subtle', '#6b737c');
  }
};

const applyAutoTheme = (dark) => {
  const root = document.documentElement;
  if (dark) {
    root.style.setProperty('--bg', '#0a0d12');
    root.style.setProperty('--bg-elevated', '#12161d');
    root.style.setProperty('--bg-hover', '#1a202c');
    root.style.setProperty('--border', '#2a2f3a');
    root.style.setProperty('--border-bright', '#3a3f4a');
    root.style.setProperty('--fg', '#e8eaed');
    root.style.setProperty('--fg-muted', '#9aa0a6');
    root.style.setProperty('--fg-subtle', '#6b737c');
  } else {
    root.style.setProperty('--bg', '#f8f9fa');
    root.style.setProperty('--bg-elevated', '#ffffff');
    root.style.setProperty('--bg-hover', '#e9ecef');
    root.style.setProperty('--border', '#dee2e6');
    root.style.setProperty('--border-bright', '#ced4da');
    root.style.setProperty('--fg', '#212529');
    root.style.setProperty('--fg-muted', '#6c757d');
    root.style.setProperty('--fg-subtle', '#adb5bd');
  }
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else current += char;
  }
  result.push(current);
  return result;
};

const csvToGeoJSON = (text) => {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const latIdx = headers.findIndex(h => /lat/i.test(h));
  const lonIdx = headers.findIndex(h => /lon|lng/i.test(h));
  const features = lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    if (cols.length < headers.length) return null;
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    if (isNaN(lat) || isNaN(lon)) return null;
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: Object.fromEntries(headers.map((h, i) => [h, cols[i]]))
    };
  }).filter(Boolean);
  return { type: 'FeatureCollection', features };
};

const gpxToGeoJSON = (text) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');
  const features = [];
  xml.querySelectorAll('trkpt').forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat'));
    const lon = parseFloat(pt.getAttribute('lon'));
    if (!isNaN(lat) && !isNaN(lon)) {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { type: 'trackpoint' } });
    }
  });
  xml.querySelectorAll('wpt').forEach(wpt => {
    const lat = parseFloat(wpt.getAttribute('lat'));
    const lon = parseFloat(wpt.getAttribute('lon'));
    const name = wpt.querySelector('name')?.textContent || 'Waypoint';
    if (!isNaN(lat) && !isNaN(lon)) {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { name, type: 'waypoint' } });
    }
  });
  xml.querySelectorAll('rtept').forEach(rte => {
    const lat = parseFloat(rte.getAttribute('lat'));
    const lon = parseFloat(rte.getAttribute('lon'));
    if (!isNaN(lat) && !isNaN(lon)) {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { type: 'routepoint' } });
    }
  });
  return { type: 'FeatureCollection', features };
};