(function () {
  'use strict';

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };
  var STORAGE_KEY = 'matze-desktop-v3';
  var zCounter = 100;
  var windowCascade = 0;
  var selectedDesktopIds = new Set();
  var selectedFileId = null;
  var draggedFileId = null;
  var runtimeMedia = new Map();
  var openWindows = new Map();
  var explorerHistory = [];
  var explorerHistoryIndex = -1;
  var detectedGames = [];
  var localGameScan = { status: 'idle', roots: [], error: '' };
  var gameDirectoryHandles = new Map();
  var chatDrafts = Object.create(null);
  var chatPollTimer = null;
  var chatBusy = false;
  var taskbarSuppressClickUntil = 0;

  var ICONS = {
    search: '<path d="m21 21-4.35-4.35"/><circle cx="11" cy="11" r="7"/>',
    power: '<path d="M12 2v10"/><path d="M18.36 6.64a9 9 0 1 1-12.72 0"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8M8 13h5"/>',
    game: '<path d="M8.5 7h7a5.5 5.5 0 0 1 5.1 7.55l-1.1 2.75a2.4 2.4 0 0 1-4.05.7L13.7 16h-3.4l-1.75 2a2.4 2.4 0 0 1-4.05-.7l-1.1-2.75A5.5 5.5 0 0 1 8.5 7Z"/><path d="M8 10v4M6 12h4M16 11h.01M18 13h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.96 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.96a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3h4v.08A1.7 1.7 0 0 0 15.04 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.24.62.84 1.03 1.5 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    forward: '<path d="m9 18 6-6-6-6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>',
    restore: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    sort: '<path d="M3 6h18M6 12h12M10 18h4"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    scissors: '<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.7 8.4 12.3 6.1M8.7 15.6 21 9.5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.07.07l2-2A5 5 0 0 0 12 4l-1.15 1.15"/><path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'
  };

  var APP_DEFS = {
    home: { name: 'Desktop', title: 'Desktop - Datei-Explorer', icon: '🖥️', kind: 'desktop' },
    images: { name: 'Bilder', title: 'Bilder', icon: '🖼️', kind: 'folder' },
    videos: { name: 'Videos', title: 'Videos', icon: '🎬', kind: 'folder' },
    music: { name: 'Musik', title: 'Musik', icon: '🎵', kind: 'folder' },
    documents: { name: 'Dokumente', title: 'Dokumente', icon: '📄', kind: 'folder' },
    media: { name: 'Medienarchiv', title: 'Medienarchiv', icon: '🗂️', kind: 'media', internal: true },
    games: { name: 'Games', title: 'Games', icon: '🎮', kind: 'games' },
    chat: { name: 'Raum-Chat', title: 'Nachtlounge - Raum-Chat', icon: '💬', kind: 'chat' },
    settings: { name: 'Einstellungen', title: 'Einstellungen', icon: '⚙️', kind: 'settings' },
    profile: { name: 'Benutzerprofil', title: 'Benutzerprofil', icon: '👤', kind: 'profile' },
    trash: { name: 'Papierkorb', title: 'Papierkorb', icon: '🗑️', kind: 'trash' },
    links: { name: 'Webseitenlinks', title: 'Webseitenverknüpfungen', icon: '🌐', kind: 'links' },
    viewer: { name: 'Medienanzeige', title: 'Medienanzeige', icon: '🖼️', kind: 'viewer', internal: true }
  };

  var DEFAULT_STATE = {
    version: 4,
    settings: {
      accent: '#e51627',
      iconSize: 42,
      showIcons: true,
      compactTaskbar: false,
      centerTaskbar: true,
      startSearchEnabled: true,
      quickLinksEnabled: true,
      privacyEnabled: false,
      databaseEnabled: false,
      autoEmptyDays: 0,
      wallpaper: '',
      mediaView: 'grid',
      darkMode: true
    },
    profile: {
      username: 'Patrick',
      email: 'patrick@example.local',
      phone: '',
      website: '',
      social: '',
      bio: 'Willkommen auf meinem persönlichen Desktop.',
      avatar: '',
      cover: ''
    },
    desktopPositions: {
      home: { x: 118, y: 18 },
      images: { x: 1684, y: 20 },
      videos: { x: 1684, y: 120 },
      music: { x: 1684, y: 220 },
      documents: { x: 1684, y: 320 },
      games: { x: 1684, y: 735 },
      chat: { x: 930, y: 535 },
      settings: { x: 930, y: 650 },
      profile: { x: 118, y: 110 },
      trash: { x: 118, y: 835 }
    },
    hiddenApps: [],
    trashedShortcuts: [],
    taskbarItems: ['home', 'chat', 'games'],
    files: [
      { id: 'f-welcome', name: 'Willkommen.txt', type: 'text', location: 'desktop', size: 1840, modified: '2026-07-17T00:30:00Z', content: 'Willkommen auf deinem interaktiven Windows-Desktop.\\n\\nÖffne Start oder doppelklicke auf ein Symbol.' },
      { id: 'f-project', name: 'Desktop-Webseite', type: 'folder', location: 'desktop', size: 0, modified: '2026-07-17T00:31:00Z' }
    ],
    media: [
      { id: 'm-wallpaper', name: 'Samurai Wallpaper.png', type: 'image', mime: 'image/png', size: 12849214, src: 'assets/images/samurai-wallpaper.png', modified: '2026-07-08T09:15:40Z' }
    ],
    games: [
      { id: 'g-ml', name: 'M-L - Locals', path: '', url: '', lastUsed: '', size: '', icon: '🏎️' },
      { id: 'g-wlc', name: 'WLC - Locals', path: '', url: '', lastUsed: '', size: '', icon: '🚘' },
      { id: 'g-samurai', name: 'Samurai Arena', path: '', url: '', lastUsed: '2026-07-16T22:10:00Z', size: 'Demo', icon: '⚔️' }
    ],
    links: [
      { id: 'l-google', name: 'Google', url: 'https://www.google.de', icon: 'G' },
      { id: 'l-youtube', name: 'YouTube', url: 'https://www.youtube.com', icon: '▶' },
      { id: 'l-github', name: 'GitHub', url: 'https://github.com', icon: '⌘' },
      { id: 'l-mail', name: 'E-Mail', url: 'https://mail.google.com', icon: '✉' },
      { id: 'l-radio', name: 'Radio', url: 'https://radio.garden', icon: '♫' },
      { id: 'l-help', name: 'Hilfe', url: 'README.md', icon: '?' }
    ],
    recent: [
      { app: 'images', name: 'Samurai Wallpaper.png', detail: 'Bild' },
      { app: 'games', name: 'Games', detail: 'Ordner' },
      { app: 'chat', name: 'Nachtlounge', detail: 'Chatraum' },
      { app: 'settings', name: 'Personalisierung', detail: 'Einstellung' }
    ],
    chat: {
      room: 1,
      localMessages: [
        { id: 1, room: 1, username: 'System', role: 'system', body: 'Willkommen in der Nachtlounge. Registrierte Mitglieder erscheinen automatisch in der Benutzerliste.', created_at: '2026-07-17T00:20:00Z' }
      ]
    }
  };

  var state = loadState();
  var chatSession = { backend: false, user: null, csrf: '', rooms: defaultRooms(), users: defaultUsers(), messages: [], lastId: 0 };
  var chatProfileState = { open: false, editing: false, user: null };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return clone(DEFAULT_STATE);
      return migrateState(mergeState(clone(DEFAULT_STATE), parsed));
    } catch (error) {
      return clone(DEFAULT_STATE);
    }
  }

  function migrateState(value) {
    if (value && value.profile) {
      if (value.profile.username === 'Matze') value.profile.username = 'Patrick';
      if (value.profile.email === 'matze@example.local') value.profile.email = 'patrick@example.local';
    }
    if (value && value.chat && Array.isArray(value.chat.localMessages)) {
      var removedDemoNames = ['Luna', 'Ryu', 'James', 'Akira'];
      value.chat.localMessages = value.chat.localMessages.filter(function (message) {
        return removedDemoNames.indexOf(String(message.username || '')) === -1;
      });
    }
    if (value) {
      value.version = 4;
      value.desktopPositions = value.desktopPositions || {};
      if (!value.desktopPositions.images && value.desktopPositions.media) value.desktopPositions.images = value.desktopPositions.media;
      if (!value.desktopPositions.videos) value.desktopPositions.videos = clone(DEFAULT_STATE.desktopPositions.videos);
      if (!value.desktopPositions.music) value.desktopPositions.music = clone(DEFAULT_STATE.desktopPositions.music);
      if (!value.desktopPositions.documents) value.desktopPositions.documents = clone(DEFAULT_STATE.desktopPositions.documents);
      delete value.desktopPositions.media;
      if (Array.isArray(value.taskbarItems)) value.taskbarItems = value.taskbarItems.map(function (id) { return id === 'media' ? 'images' : id; });
      if (Array.isArray(value.recent)) value.recent.forEach(function (entry) { if (entry.app === 'media') entry.app = 'images'; });
      if (Array.isArray(value.hiddenApps)) value.hiddenApps = value.hiddenApps.filter(function (id) { return id !== 'media'; });
    }
    return value;
  }

  function mergeState(base, incoming) {
    Object.keys(incoming || {}).forEach(function (key) {
      if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key]) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        base[key] = mergeState(base[key], incoming[key]);
      } else {
        base[key] = incoming[key];
      }
    });
    return base;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      toast('Speicher fast voll', 'Große Medien werden nur für diese Sitzung bereitgehalten.', '⚠️');
      return false;
    }
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  }

  function formatBytes(bytes) {
    var value = Number(bytes || 0);
    if (!value) return '0 Bytes';
    var units = ['Bytes', 'KB', 'MB', 'GB'];
    var index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    return (value / Math.pow(1024, index)).toLocaleString('de-DE', { maximumFractionDigits: index ? 1 : 0 }) + ' ' + units[index];
  }

  function formatDate(value, withTime) {
    var date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return 'Unbekannt';
    return new Intl.DateTimeFormat('de-DE', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date);
  }

  function iconSvg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>';
  }

  function hydrateIcons(root) {
    $$('[data-icon]', root || document).forEach(function (node) {
      node.innerHTML = iconSvg(node.getAttribute('data-icon'));
    });
  }

  function appGraphic(id, desktop) {
    var def = APP_DEFS[id] || { icon: '📄', kind: 'file' };
    if (def.kind === 'folder' || def.kind === 'media' || def.kind === 'games') {
      var extra = def.kind === 'media' ? ' media' : def.kind === 'games' ? ' games' : '';
      return '<span class="glyph-folder' + extra + '"></span>';
    }
    var label = def.icon;
    if (id === 'trash' && (state.files.some(function (file) { return file.location === 'trash'; }) || state.trashedShortcuts.length)) label = '🗑️';
    return '<span class="glyph-icon" aria-hidden="true">' + label + '</span>';
  }

  function applyTheme() {
    var accent = state.settings.accent || '#e51627';
    var rgb = hexToRgb(accent);
    var iconMetrics = desktopIconMetrics();
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-rgb', rgb.join(', '));
    document.documentElement.style.setProperty('--icon-size', iconMetrics.iconSize + 'px');
    document.documentElement.style.setProperty('--desktop-icon-width', iconMetrics.width + 'px');
    document.documentElement.style.setProperty('--desktop-icon-height', iconMetrics.height + 'px');
    document.documentElement.style.setProperty('--desktop-icon-gap', iconMetrics.gap + 'px');
    document.documentElement.style.setProperty('--desktop-label-width', iconMetrics.labelWidth + 'px');
    document.documentElement.style.setProperty('--desktop-label-size', iconMetrics.labelSize + 'px');
    document.documentElement.style.setProperty('--desktop-label-line-height', iconMetrics.lineHeight + 'px');
    document.documentElement.style.setProperty('--desktop-glyph-scale', (iconMetrics.iconSize / 42).toFixed(3));
    if (state.settings.wallpaper) {
      document.documentElement.style.setProperty('--custom-wallpaper', 'url("' + state.settings.wallpaper.replace(/"/g, '%22') + '")');
    } else {
      document.documentElement.style.removeProperty('--custom-wallpaper');
    }
    $('#desktopIcons').style.display = state.settings.showIcons === false ? 'none' : 'block';
    document.body.classList.toggle('compact-taskbar', !!state.settings.compactTaskbar);
    document.body.classList.toggle('taskbar-left-aligned', state.settings.centerTaskbar === false);
    document.body.classList.toggle('start-search-disabled', state.settings.startSearchEnabled === false);
    document.body.classList.toggle('quick-links-disabled', state.settings.quickLinksEnabled === false);
  }

  function hexToRgb(hex) {
    var clean = String(hex || '').replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(function (c) { return c + c; }).join('');
    var value = parseInt(clean, 16);
    return Number.isFinite(value) ? [(value >> 16) & 255, (value >> 8) & 255, value & 255] : [229, 22, 39];
  }

  function desktopIconMetrics(size) {
    var iconSize = clamp(Number(size || state.settings.iconSize || 42), 32, 64);
    var labelSize = Math.round((10 + ((iconSize - 32) / 32) * 6) * 10) / 10;
    var lineHeight = Math.round(labelSize * 1.25);
    var gap = clamp(Math.round(iconSize * 5 / 42), 4, 8);
    var width = Math.round(iconSize + 50);
    var height = Math.round(iconSize + gap + lineHeight * 2 + 10);
    return {
      iconSize: iconSize,
      width: width,
      height: height,
      gap: gap,
      labelWidth: Math.round(iconSize + 46),
      labelSize: labelSize,
      lineHeight: lineHeight,
      columnStep: width + 4,
      rowStep: height + 4
    };
  }

  function desktopRowsPerColumn(metrics) {
    var taskbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height'), 10) || 48;
    return Math.max(1, Math.floor((window.innerHeight - taskbarHeight - 36) / metrics.rowStep));
  }

  function init() {
    hydrateIcons(document);
    applyTheme();
    renderDesktopIcons();
    renderStartMenu();
    renderQuickLinks();
    renderTaskbarPinned();
    bindGlobalEvents();
    updateClock();
    window.setInterval(updateClock, 1000);
    autoEmptyTrash();
    probeChatBackend();
    restorePersistentImports();
    requestPersistentMediaStorage();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' }).then(function (registration) {
        return registration.update();
      }).catch(function () {});
    }
    toast('Desktop bereit', 'Doppelklick öffnet Apps, Rechtsklick zeigt weitere Aktionen.', '✓');
  }


  function requestPersistentMediaStorage() {
    if (!window.PatrickFileStore || typeof window.PatrickFileStore.requestPersistentStorage !== 'function') return;
    window.PatrickFileStore.requestPersistentStorage().catch(function () {});
  }

  function revokeRuntimeMediaUrl(id) {
    var source = runtimeMedia.get(id);
    if (source && String(source).indexOf('blob:') === 0) {
      try { URL.revokeObjectURL(source); } catch (error) {}
    }
    runtimeMedia.delete(id);
  }

  function setRuntimeMediaBlob(id, blob) {
    revokeRuntimeMediaUrl(id);
    var source = URL.createObjectURL(blob);
    runtimeMedia.set(id, source);
    return source;
  }

  function persistentMediaIdsInState() {
    var ids = new Set(state.media.map(function (item) { return String(item.id); }));
    state.files.forEach(function (file) {
      if (file.mediaSnapshot && file.mediaSnapshot.id) ids.add(String(file.mediaSnapshot.id));
    });
    return ids;
  }

  function restorePersistentImports() {
    if (!window.PatrickFileStore || typeof window.PatrickFileStore.getAll !== 'function') return;
    window.PatrickFileStore.getAll().then(function (records) {
      var validIds = persistentMediaIdsInState();
      var restored = 0;
      (records || []).forEach(function (record) {
        if (!record || !record.id || !(record.blob instanceof Blob)) return;
        if (!validIds.has(String(record.id))) {
          window.PatrickFileStore.delete(record.id).catch(function () {});
          return;
        }
        setRuntimeMediaBlob(String(record.id), record.blob);
        restored += 1;
      });
      if (restored) {
        refreshExplorers();
        if (openWindows.has('viewer')) refreshWindow('viewer');
      }
    }).catch(function () {
      toast('Dateispeicher nicht verfügbar', 'Gespeicherte Importe konnten nicht aus der Browser-Datenbank geladen werden.', '⚠️');
    });
  }

  function ensurePersistentMediaSource(item) {
    var current = runtimeMedia.get(item.id) || item.src || '';
    if (current) return Promise.resolve(current);
    if (!item.stored || !window.PatrickFileStore || typeof window.PatrickFileStore.get !== 'function') return Promise.resolve('');
    return window.PatrickFileStore.get(item.id).then(function (record) {
      if (!record || !(record.blob instanceof Blob)) return '';
      return setRuntimeMediaBlob(item.id, record.blob);
    });
  }

  function deletePersistentMedia(id) {
    revokeRuntimeMediaUrl(id);
    if (!window.PatrickFileStore || typeof window.PatrickFileStore.delete !== 'function') return Promise.resolve();
    return window.PatrickFileStore.delete(id).catch(function () {});
  }

  function renderDesktopIcons() {
    var container = $('#desktopIcons');
    container.innerHTML = '';
    var positionsChanged = false;
    var metrics = desktopIconMetrics();
    var rowsPerColumn = desktopRowsPerColumn(metrics);
    var visibleApps = Object.keys(APP_DEFS).filter(function (id) {
      return id !== 'links' && !APP_DEFS[id].internal && state.hiddenApps.indexOf(id) === -1;
    });

    visibleApps.forEach(function (id, index) {
      var def = APP_DEFS[id];
      var pos = mobileDesktopPosition(index, metrics) || state.desktopPositions[id] || { x: 18 + Math.floor(index / rowsPerColumn) * metrics.columnStep, y: 18 + (index % rowsPerColumn) * metrics.rowStep };
      appendDesktopIcon(container, { id: id, app: id, name: def.name, graphic: appGraphic(id, true), position: pos });
    });

    state.files.filter(function (file) { return file.location === 'desktop'; }).forEach(function (file, fileIndex) {
      var pos = mobileDesktopPosition(visibleApps.length + fileIndex, metrics) || state.desktopPositions[file.id];
      if (!pos) {
        pos = findFreeDesktopPosition(file.id);
        state.desktopPositions[file.id] = pos;
        positionsChanged = true;
      }
      appendDesktopIcon(container, { id: file.id, file: file.id, name: file.name, graphic: desktopFileGraphic(file), position: pos });
    });

    if (positionsChanged) saveState();
  }

  function mobileDesktopPosition(index, metrics) {
    if (!window.matchMedia('(max-width: 800px)').matches) return null;
    var columns = Math.max(2, Math.floor((window.innerWidth - 16) / metrics.width));
    var gap = Math.max(2, Math.floor((window.innerWidth - columns * metrics.width) / (columns + 1)));
    return { x: gap + (index % columns) * (metrics.width + gap), y: 10 + Math.floor(index / columns) * metrics.rowStep };
  }

  function appendDesktopIcon(container, item) {
    var metrics = desktopIconMetrics();
    var button = document.createElement('button');
    button.className = 'desktop-icon';
    button.type = 'button';
    button.dataset.desktopId = item.id;
    if (item.app) button.dataset.app = item.app;
    if (item.file) button.dataset.fileId = item.file;
    button.setAttribute('aria-label', item.name);
    button.style.left = clamp(item.position.x, 0, Math.max(0, window.innerWidth - metrics.width)) + 'px';
    button.style.top = clamp(item.position.y, 0, Math.max(0, window.innerHeight - metrics.height - 58)) + 'px';
    button.innerHTML = '<span class="desktop-icon-graphic">' + item.graphic + '</span><span class="desktop-label">' + escapeHtml(item.name) + '</span>';
    if (selectedDesktopIds.has(item.id)) button.classList.add('selected');
    container.appendChild(button);
    bindDesktopIcon(button);
  }

  function desktopFileGraphic(file) {
    if (file.type === 'folder') return '<span class="glyph-folder"></span>';
    return '<span class="glyph-icon" aria-hidden="true">📄</span>';
  }

  function findFreeDesktopPosition(excludeId) {
    var metrics = desktopIconMetrics();
    var maxX = Math.max(0, window.innerWidth - metrics.width);
    var taskbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height'), 10) || 48;
    var maxY = Math.max(18, window.innerHeight - taskbarHeight - metrics.height);
    var preferredX = clamp(Number((state.desktopPositions.home || {}).x || 18), 0, maxX);
    var occupiedIds = Object.keys(APP_DEFS).filter(function (id) {
      return id !== 'links' && !APP_DEFS[id].internal && state.hiddenApps.indexOf(id) === -1;
    }).concat(state.files.filter(function (file) {
      return file.location === 'desktop';
    }).map(function (file) { return file.id; }));
    var occupied = occupiedIds.filter(function (id) {
      return id !== excludeId && state.desktopPositions[id];
    }).map(function (id) { return state.desktopPositions[id]; });
    var columns = [preferredX];
    for (var x = 18; x <= maxX; x += metrics.columnStep) {
      if (Math.abs(x - preferredX) > 4) columns.push(x);
    }
    for (var column = 0; column < columns.length; column += 1) {
      for (var y = 18; y <= maxY; y += metrics.rowStep) {
        var candidate = { x: columns[column], y: y };
        var overlaps = occupied.some(function (pos) {
          return Math.abs(pos.x - candidate.x) < metrics.width && Math.abs(pos.y - candidate.y) < metrics.height;
        });
        if (!overlaps) return candidate;
      }
    }
    return { x: preferredX, y: 18 };
  }

  function bindDesktopIcon(button) {
    var id = button.dataset.desktopId;
    var appId = button.dataset.app;
    var fileId = button.dataset.fileId;
    button.addEventListener('dblclick', function () { openDesktopItem(id); });
    button.addEventListener('click', function (event) {
      if (!event.ctrlKey) selectedDesktopIds.clear();
      selectedDesktopIds.add(id);
      if (fileId) selectedFileId = fileId;
      syncDesktopSelection();
    });
    button.addEventListener('contextmenu', function (event) {
      event.preventDefault();
      selectedDesktopIds.clear();
      selectedDesktopIds.add(id);
      if (fileId) selectedFileId = fileId;
      syncDesktopSelection();
      showContextMenu(event.clientX, event.clientY, fileId ? fileContextItems('file', fileId) : iconContextItems(appId));
    });
    button.addEventListener('pointerdown', startDesktopIconDrag);
    button.addEventListener('dragover', function (event) {
      if (appId === 'trash' && draggedFileId) {
        event.preventDefault();
        button.classList.add('drop-target');
      }
    });
    button.addEventListener('dragleave', function () { button.classList.remove('drop-target'); });
    button.addEventListener('drop', function (event) {
      if (appId === 'trash' && draggedFileId) {
        event.preventDefault();
        var itemId = draggedFileId;
        clearFileDragState();
        moveFileToTrash(itemId);
      }
    });
  }

  function openDesktopItem(id) {
    var file = state.files.find(function (item) { return item.id === id && item.location === 'desktop'; });
    if (file) openVirtualFile(id);
    else if (APP_DEFS[id]) openApp(id);
  }

  function trashDesktopItem(id) {
    var file = state.files.find(function (item) { return item.id === id && item.location === 'desktop'; });
    if (file) moveFileToTrash(id);
    else if (APP_DEFS[id]) trashDesktopShortcut(id);
  }

  function startDesktopIconDrag(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    var node = event.currentTarget;
    var id = node.dataset.desktopId;
    var startX = event.clientX;
    var startY = event.clientY;
    var rect = node.getBoundingClientRect();
    var originX = rect.left;
    var originY = rect.top;
    var moved = false;

    function move(moveEvent) {
      var dx = moveEvent.clientX - startX;
      var dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      node.classList.add('dragging');
      var x = clamp(originX + dx, 0, window.innerWidth - node.offsetWidth);
      var y = clamp(originY + dy, 0, window.innerHeight - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height'), 10) - node.offsetHeight);
      node.style.left = x + 'px';
      node.style.top = y + 'px';
      var trash = $('[data-desktop-id="trash"]');
      if (trash && id !== 'trash') trash.classList.toggle('drop-target', rectanglesOverlap(node.getBoundingClientRect(), trash.getBoundingClientRect()));
      var taskbarDrop = $('#taskbarPinnedApps');
      if (taskbarDrop) taskbarDrop.classList.toggle('drop-target', pointInRectangle(moveEvent.clientX, moveEvent.clientY, taskbarDrop.getBoundingClientRect()));
    }

    function end(endEvent) {
      if (!moved) {
        if (window.matchMedia('(pointer: coarse)').matches) openDesktopItem(id);
        return;
      }
      node.dataset.justDragged = 'true';
      window.setTimeout(function () { if (node.isConnected) delete node.dataset.justDragged; }, 0);
      node.classList.remove('dragging');
      var trash = $('[data-desktop-id="trash"]');
      var inTrash = trash && id !== 'trash' && rectanglesOverlap(node.getBoundingClientRect(), trash.getBoundingClientRect());
      var taskbarDrop = $('#taskbarPinnedApps');
      var inTaskbar = !!(endEvent && taskbarDrop && pointInRectangle(endEvent.clientX, endEvent.clientY, taskbarDrop.getBoundingClientRect()));
      if (trash) trash.classList.remove('drop-target');
      if (taskbarDrop) taskbarDrop.classList.remove('drop-target');
      if (inTaskbar) {
        pinTaskbarItem(id);
        renderDesktopIcons();
      } else if (inTrash) {
        trashDesktopItem(id);
      } else {
        state.desktopPositions[id] = { x: parseInt(node.style.left, 10), y: parseInt(node.style.top, 10) };
        saveState();
      }
    }
    trackPointerDrag(node, event.pointerId, move, end);
  }

  function trackPointerDrag(target, pointerId, onMove, onEnd) {
    var active = true;
    function move(event) {
      if (active && event.pointerId === pointerId) onMove(event);
    }
    function end(event) {
      if (!active) return;
      if (event && typeof event.pointerId === 'number' && event.pointerId !== pointerId) return;
      active = false;
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
      window.removeEventListener('blur', end);
      target.removeEventListener('lostpointercapture', end);
      try {
        if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
      } catch (error) {}
      onEnd(event);
    }
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
    window.addEventListener('blur', end);
    target.addEventListener('lostpointercapture', end);
    try { target.setPointerCapture(pointerId); } catch (error) {}
    return end;
  }

  function rectanglesOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function pointInRectangle(x, y, rectangle) {
    return x >= rectangle.left && x <= rectangle.right && y >= rectangle.top && y <= rectangle.bottom;
  }

  function syncDesktopSelection() {
    $$('.desktop-icon').forEach(function (node) {
      node.classList.toggle('selected', selectedDesktopIds.has(node.dataset.desktopId));
    });
  }

  function trashDesktopShortcut(id) {
    if (['trash'].indexOf(id) !== -1) return;
    if (state.hiddenApps.indexOf(id) === -1) state.hiddenApps.push(id);
    state.trashedShortcuts.push({ id: uid('shortcut'), app: id, name: APP_DEFS[id].name, deletedAt: new Date().toISOString(), from: 'desktop' });
    saveState();
    renderDesktopIcons();
    refreshWindow('trash');
    toast('In den Papierkorb verschoben', APP_DEFS[id].name, '🗑️');
  }

  function renderStartMenu(filter) {
    var query = String(filter || '').trim().toLowerCase();
    var ids = Object.keys(APP_DEFS).filter(function (id) { return !APP_DEFS[id].internal; });
    var pinned = $('#pinnedApps');
    pinned.innerHTML = ids.filter(function (id) {
      return !query || APP_DEFS[id].name.toLowerCase().indexOf(query) !== -1 || APP_DEFS[id].title.toLowerCase().indexOf(query) !== -1;
    }).map(function (id) {
      return '<button class="start-app" type="button" data-app="' + id + '" role="listitem"><span class="app-graphic">' + appGraphic(id) + '</span><span class="app-label">' + escapeHtml(APP_DEFS[id].name) + '</span></button>';
    }).join('');
    if (!pinned.children.length) pinned.innerHTML = '<div class="empty-state"><div><div class="empty-icon">⌕</div><h3>Keine Treffer</h3><p>Versuche einen anderen Suchbegriff.</p></div></div>';
    var recent = $('#recommendedItems');
    recent.innerHTML = state.recent.filter(function (item) {
      return !query || item.name.toLowerCase().indexOf(query) !== -1 || item.detail.toLowerCase().indexOf(query) !== -1;
    }).slice(0, 4).map(function (item) {
      var def = APP_DEFS[item.app] || APP_DEFS.home;
      return '<button class="recommended-item" type="button" data-app="' + item.app + '"><span class="rec-icon">' + def.icon + '</span><span><span>' + escapeHtml(item.name) + '</span><small>' + escapeHtml(item.detail) + '</small></span></button>';
    }).join('');
    updateProfileSurfaces();
  }

  function renderQuickLinks() {
    $('#quickLinksGrid').innerHTML = state.links.map(function (link) {
      return '<button class="quick-link" type="button" data-link-id="' + escapeHtml(link.id) + '" title="' + escapeHtml(link.url) + '"><span class="link-icon">' + escapeHtml(link.icon || '🌐') + '</span><span class="link-label">' + escapeHtml(link.name) + '</span></button>';
    }).join('');
  }

  function updateProfileSurfaces() {
    var profile = state.profile;
    $('#startUsername').textContent = profile.username || 'Benutzer';
    var avatar = $('#startAvatar');
    avatar.innerHTML = profile.avatar ? '<img src="' + escapeHtml(profile.avatar) + '" alt="">' : escapeHtml((profile.username || 'B').charAt(0).toUpperCase());
  }

  function bindGlobalEvents() {
    $('#desktop').addEventListener('pointerdown', desktopPointerDown);
    $('#desktop').addEventListener('contextmenu', function (event) {
      if (event.target.closest('.desktop-icon, .app-window')) return;
      event.preventDefault();
      selectedDesktopIds.clear();
      syncDesktopSelection();
      showContextMenu(event.clientX, event.clientY, desktopContextItems());
    });
    $('#desktop').addEventListener('click', function (event) {
      if (!event.target.closest('.desktop-icon')) {
        selectedDesktopIds.clear();
        syncDesktopSelection();
      }
      hideFloatingPanels(event);
    });

    $('#taskbar').addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      if (Date.now() < taskbarSuppressClickUntil) return;
      if (button.dataset.taskbarId) activateTaskbarItem(button.dataset.taskbarId);
      if (button.dataset.app) openApp(button.dataset.app);
      if (button.dataset.command === 'start') toggleStart(false);
      if (button.dataset.command === 'search' && state.settings.startSearchEnabled !== false) toggleStart(true);
      if (button.dataset.command === 'quick-links' && state.settings.quickLinksEnabled !== false) toggleQuickLinks();
    });
    $('#taskbarPinnedApps').addEventListener('pointerdown', startTaskbarReorder);
    $('#taskbarPinnedApps').addEventListener('contextmenu', function (event) {
      var button = event.target.closest('[data-taskbar-id]');
      if (!button) return;
      event.preventDefault();
      var id = button.dataset.taskbarId;
      showContextMenu(event.clientX, event.clientY, [{ icon: 'trash', label: 'Von Taskleiste lösen', action: function () { unpinTaskbarItem(id); } }]);
    });
    $('#pinnedApps').addEventListener('click', startAppClick);
    $('#recommendedItems').addEventListener('click', startAppClick);
    $('#startProfile').addEventListener('click', function () { closeStart(); openApp('profile'); });
    $('#startSearch').addEventListener('input', function (event) { renderStartMenu(event.target.value); });
    $('#allAppsButton').addEventListener('click', function () { $('#startSearch').focus(); $('#startSearch').value = ''; renderStartMenu(); });
    $('#powerButton').addEventListener('click', powerMenu);
    $('#editLinks').addEventListener('click', function () { closeQuickLinks(); openApp('settings', { section: 'links' }); });
    $('#quickLinksGrid').addEventListener('click', function (event) {
      var button = event.target.closest('[data-link-id]');
      if (!button) return;
      var link = state.links.find(function (item) { return item.id === button.dataset.linkId; });
      if (link) window.open(link.url, '_blank', 'noopener,noreferrer');
    });
    $('#mediaInput').addEventListener('change', importMediaFiles);
    $('#wallpaperInput').addEventListener('change', importWallpaper);
    $('#stateImportInput').addEventListener('change', importState);
    document.addEventListener('click', function (event) {
      if (!event.target.closest('#contextMenu')) hideContextMenu();
    });
    document.addEventListener('dragend', clearFileDragState, true);
    document.addEventListener('keydown', keyboardShortcuts);
    window.addEventListener('resize', keepWindowsVisible);
    window.addEventListener('blur', clearFileDragState);
    window.addEventListener('beforeunload', saveState);
  }

  function startAppClick(event) {
    var button = event.target.closest('[data-app]');
    if (!button) return;
    closeStart();
    openApp(button.dataset.app);
  }

  function desktopPointerDown(event) {
    if (event.button !== 0 || event.target.closest('.desktop-icon, .app-window')) return;
    event.preventDefault();
    var desktop = $('#desktop');
    var box = $('#selectionBox');
    var rect = desktop.getBoundingClientRect();
    var startX = clamp(event.clientX - rect.left, 0, rect.width);
    var startY = clamp(event.clientY - rect.top, 0, rect.height);
    var moved = false;

    function move(moveEvent) {
      var x = clamp(moveEvent.clientX - rect.left, 0, rect.width);
      var y = clamp(moveEvent.clientY - rect.top, 0, rect.height);
      if (!moved && Math.hypot(x - startX, y - startY) < 4) return;
      moved = true;
      box.hidden = false;
      box.style.left = Math.min(startX, x) + 'px';
      box.style.top = Math.min(startY, y) + 'px';
      box.style.width = Math.abs(x - startX) + 'px';
      box.style.height = Math.abs(y - startY) + 'px';
      var boxRect = box.getBoundingClientRect();
      selectedDesktopIds.clear();
      $$('.desktop-icon').forEach(function (icon) {
        if (rectanglesOverlap(boxRect, icon.getBoundingClientRect())) selectedDesktopIds.add(icon.dataset.desktopId);
      });
      syncDesktopSelection();
    }
    function end() {
      box.hidden = true;
    }
    trackPointerDrag(desktop, event.pointerId, move, end);
  }

  function keyboardShortcuts(event) {
    if (event.key === 'Escape') {
      closeStart();
      closeQuickLinks();
      hideContextMenu();
      return;
    }
    if (event.key === 'Meta' || (event.ctrlKey && event.key.toLowerCase() === 'escape')) {
      event.preventDefault();
      toggleStart();
      return;
    }
    if (event.key === 'Delete' && selectedDesktopIds.size === 1 && !event.target.matches('input, textarea')) {
      event.preventDefault();
      trashDesktopItem(Array.from(selectedDesktopIds)[0]);
    }
    if (event.key === 'Enter' && selectedDesktopIds.size === 1 && !event.target.matches('input, textarea')) openDesktopItem(Array.from(selectedDesktopIds)[0]);
    if (event.ctrlKey && event.key.toLowerCase() === 'a' && document.activeElement === $('#desktop')) {
      event.preventDefault();
      $$('.desktop-icon').forEach(function (node) { selectedDesktopIds.add(node.dataset.desktopId); });
      syncDesktopSelection();
    }
  }

  function toggleStart(focusSearch) {
    closeQuickLinks();
    var menu = $('#startMenu');
    var open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    $('.start-button').classList.toggle('active', open);
    if (open && focusSearch) window.setTimeout(function () { $('#startSearch').focus(); }, 80);
  }

  function closeStart() {
    $('#startMenu').classList.remove('open');
    $('#startMenu').setAttribute('aria-hidden', 'true');
    $('.start-button').classList.remove('active');
  }

  function toggleQuickLinks() {
    closeStart();
    var panel = $('#quickLinks');
    var open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    $('.tray-chevron').setAttribute('aria-expanded', String(open));
  }

  function closeQuickLinks() {
    $('#quickLinks').classList.remove('open');
    $('#quickLinks').setAttribute('aria-hidden', 'true');
    $('.tray-chevron').setAttribute('aria-expanded', 'false');
  }

  function hideFloatingPanels(event) {
    if (!event || !event.target.closest('#startMenu, .start-button')) closeStart();
    if (!event || !event.target.closest('#quickLinks, .tray-chevron')) closeQuickLinks();
  }

  function updateClock() {
    var now = new Date();
    $('#clockTime').textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    $('#clockDate').textContent = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    $('#clockButton').title = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function powerMenu() {
    showDialog({
      icon: '⏻',
      title: 'Energiesparmenü',
      message: 'Die Webseite kann den Computer nicht herunterfahren. Du kannst den Web-Desktop sperren oder neu laden.',
      fields: [{ name: 'action', label: 'Aktion', type: 'select', options: [['lock', 'Desktop sperren'], ['reload', 'Web-Desktop neu laden']] }],
      confirmText: 'Ausführen'
    }).then(function (result) {
      if (!result) return;
      if (result.action === 'reload') location.reload();
      else lockDesktop();
    });
  }

  function lockDesktop() {
    closeStart();
    var lock = document.createElement('div');
    lock.className = 'viewer';
    lock.style.position = 'fixed';
    lock.style.zIndex = '120000';
    lock.style.background = 'rgba(4,4,6,.84)';
    lock.style.backdropFilter = 'blur(20px)';
    lock.innerHTML = '<div class="viewer-content"><div style="text-align:center"><div class="avatar" style="width:92px;height:92px;margin:0 auto 16px;font-size:34px">' + escapeHtml((state.profile.username || 'M').charAt(0)) + '</div><h1 style="margin:0 0 7px">' + escapeHtml(state.profile.username) + '</h1><p class="muted">Desktop gesperrt</p><button class="button primary" type="button">Anmelden</button></div></div>';
    lock.querySelector('button').addEventListener('click', function () { lock.remove(); });
    document.body.appendChild(lock);
  }

  function openApp(id, options) {
    options = options || {};
    if (id === 'links') return openApp('settings', { section: 'links' });
    if (!APP_DEFS[id]) return;
    closeStart();
    closeQuickLinks();
    var existing = openWindows.get(id);
    if (existing) {
      existing.classList.remove('minimized');
      if (options.section) existing.dataset.section = options.section;
      if (id === 'viewer' && options.mediaId) {
        existing.dataset.mediaId = options.mediaId;
        renderWindowBody(existing);
      }
      if (id === 'home') {
        navigateHomeFolder(Object.prototype.hasOwnProperty.call(options, 'folderId') ? (options.folderId || '') : '', true, !!options.fromExplorerHistory);
      } else if (isExplorerApp(id)) {
        if (!options.fromExplorerHistory) recordExplorerVisit(id, '');
        refreshWindow(id);
      }
      if (id === 'games') scanLocalGames(false);
      focusWindow(existing);
      if (options.section) refreshWindow(id);
      return existing;
    }
    var template = $('#windowTemplate');
    var node = template.content.firstElementChild.cloneNode(true);
    node.dataset.app = id;
    if (id === 'profile') {
      node.classList.add('profile-fixed-window');
      var profileMaximizeButton = $('.window-control.maximize', node);
      if (profileMaximizeButton) profileMaximizeButton.remove();
    }
    if (options.section) node.dataset.section = options.section;
    if (id === 'viewer' && options.mediaId) node.dataset.mediaId = options.mediaId;
    if (id === 'home') {
      selectedFileId = null;
      node.dataset.folderId = options.folderId || '';
      node._folderHistory = [node.dataset.folderId];
      node._folderHistoryIndex = 0;
    }
    if (isExplorerApp(id) && !options.fromExplorerHistory) recordExplorerVisit(id, id === 'home' ? (node.dataset.folderId || '') : '');
    $('.window-title', node).textContent = APP_DEFS[id].title;
    $('.window-app-icon', node).innerHTML = APP_DEFS[id].icon;
    var width = id === 'chat' ? 980 : id === 'settings' ? 940 : id === 'profile' ? 800 : id === 'viewer' ? 920 : 900;
    var height = id === 'chat' ? 650 : id === 'settings' ? 650 : id === 'viewer' ? 650 : 610;
    node.style.width = Math.min(width, window.innerWidth - 50) + 'px';
    node.style.height = Math.min(height, window.innerHeight - 90) + 'px';
    node.style.left = Math.max(0, (window.innerWidth - Math.min(width, window.innerWidth - 50)) / 2 + (windowCascade % 5) * 18 - 35) + 'px';
    node.style.top = Math.max(0, 28 + (windowCascade % 5) * 18) + 'px';
    windowCascade += 1;
    $('#windowLayer').appendChild(node);
    openWindows.set(id, node);
    renderWindowBody(node);
    bindWindow(node);
    focusWindow(node);
    renderRunningTasks();
    addRecent(id, APP_DEFS[id].name, id === 'chat' ? 'Chatraum' : 'App');
    if (id === 'chat') startChatPolling();
    if (id === 'games') scanLocalGames(false);
    return node;
  }

  function bindWindow(node) {
    $('.window-controls', node).addEventListener('click', function (event) {
      var button = event.target.closest('[data-window-action]');
      if (!button) return;
      windowAction(node, button.dataset.windowAction);
    });
    $('.titlebar', node).addEventListener('dblclick', function (event) {
      if (node.dataset.app !== 'profile' && !event.target.closest('.window-controls')) windowAction(node, 'maximize');
    });
    $('.titlebar', node).addEventListener('pointerdown', startWindowDrag);
    node.addEventListener('pointerdown', function () { focusWindow(node); });
  }

  function startWindowDrag(event) {
    if (event.button !== 0 || event.target.closest('.window-controls')) return;
    var node = event.currentTarget.closest('.app-window');
    if (node.classList.contains('maximized')) return;
    event.preventDefault();
    var handle = event.currentTarget;
    var rect = node.getBoundingClientRect();
    var startX = event.clientX;
    var startY = event.clientY;
    function move(moveEvent) {
      node.style.left = clamp(rect.left + moveEvent.clientX - startX, -node.offsetWidth + 130, window.innerWidth - 130) + 'px';
      node.style.top = clamp(rect.top + moveEvent.clientY - startY, 0, window.innerHeight - 90) + 'px';
    }
    function end() {}
    trackPointerDrag(handle, event.pointerId, move, end);
  }

  function windowAction(node, action) {
    var id = node.dataset.app;
    if (id === 'profile' && action === 'maximize') return;
    if (action === 'minimize') {
      node.classList.add('minimized');
      renderRunningTasks();
      focusTopWindow();
    } else if (action === 'maximize') {
      if (!node.classList.contains('maximized')) {
        node.dataset.restore = JSON.stringify({ left: node.style.left, top: node.style.top, width: node.style.width, height: node.style.height });
        node.classList.add('maximized');
      } else {
        node.classList.remove('maximized');
        try {
          var restore = JSON.parse(node.dataset.restore);
          Object.assign(node.style, restore);
        } catch (error) {}
      }
      focusWindow(node);
    } else if (action === 'close') {
      node.classList.add('closing');
      window.setTimeout(function () {
        node.remove();
        openWindows.delete(id);
        renderRunningTasks();
        if (id === 'chat' && !openWindows.has('chat')) stopChatPolling();
        focusTopWindow();
      }, 120);
    }
  }

  function focusWindow(node) {
    zCounter += 1;
    node.style.zIndex = zCounter;
    $$('.app-window').forEach(function (win) { win.classList.toggle('inactive', win !== node); });
    renderRunningTasks(node.dataset.app);
  }

  function focusTopWindow() {
    var top = Array.from(openWindows.values()).filter(function (node) { return !node.classList.contains('minimized'); }).sort(function (a, b) { return Number(b.style.zIndex) - Number(a.style.zIndex); })[0];
    if (top) focusWindow(top);
  }

  function validTaskbarItem(id) {
    return !!(APP_DEFS[id] && !APP_DEFS[id].internal) || state.files.some(function (file) { return file.id === id && file.location !== 'trash'; });
  }

  function taskbarItemInfo(id) {
    if (APP_DEFS[id]) return { name: APP_DEFS[id].name, icon: APP_DEFS[id].icon };
    var file = state.files.find(function (item) { return item.id === id; });
    return file ? { name: file.name, icon: file.type === 'folder' ? '📁' : '📄' } : null;
  }

  function renderTaskbarPinned() {
    var holder = $('#taskbarPinnedApps');
    if (!holder) return;
    state.taskbarItems = (Array.isArray(state.taskbarItems) ? state.taskbarItems : ['home', 'chat', 'games']).filter(function (id, index, list) {
      return validTaskbarItem(id) && list.indexOf(id) === index;
    });
    holder.innerHTML = state.taskbarItems.map(function (id) {
      var info = taskbarItemInfo(id);
      return '<button class="taskbar-button taskbar-pinned-item" type="button" data-taskbar-id="' + escapeHtml(id) + '" aria-label="' + escapeHtml(info.name) + '" title="' + escapeHtml(info.name) + '"><span class="taskbar-item-graphic" aria-hidden="true">' + escapeHtml(info.icon) + '</span></button>';
    }).join('');
  }

  function activateTaskbarItem(id) {
    if (APP_DEFS[id]) {
      var node = openWindows.get(id);
      if (node && !node.classList.contains('minimized') && !node.classList.contains('inactive')) {
        node.classList.add('minimized');
        renderRunningTasks();
        focusTopWindow();
      } else openApp(id);
      return;
    }
    openVirtualFile(id);
  }

  function pinTaskbarItem(id) {
    if (!validTaskbarItem(id)) return;
    if (state.taskbarItems.indexOf(id) !== -1) return toast('Bereits angeheftet', taskbarItemInfo(id).name + ' ist schon in der Taskleiste.', '✓');
    state.taskbarItems.push(id);
    saveState();
    renderTaskbarPinned();
    renderRunningTasks();
    toast('An Taskleiste angeheftet', taskbarItemInfo(id).name, '📌');
  }

  function unpinTaskbarItem(id) {
    state.taskbarItems = state.taskbarItems.filter(function (item) { return item !== id; });
    saveState();
    renderTaskbarPinned();
    renderRunningTasks();
  }

  function startTaskbarReorder(event) {
    if (event.button !== 0) return;
    var button = event.target.closest('[data-taskbar-id]');
    if (!button) return;
    var id = button.dataset.taskbarId;
    var startX = event.clientX;
    var startY = event.clientY;
    var moved = false;
    function move(moveEvent) {
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 5) return;
      moved = true;
      button.classList.add('dragging');
    }
    function end(endEvent) {
      button.classList.remove('dragging');
      if (!moved || !endEvent) return;
      var buttons = $$('[data-taskbar-id]', $('#taskbarPinnedApps'));
      var originalIndex = state.taskbarItems.indexOf(id);
      var targetIndex = buttons.findIndex(function (item) { return endEvent.clientX < item.getBoundingClientRect().left + item.offsetWidth / 2; });
      if (targetIndex < 0) targetIndex = buttons.length;
      state.taskbarItems.splice(originalIndex, 1);
      if (targetIndex > originalIndex) targetIndex -= 1;
      state.taskbarItems.splice(clamp(targetIndex, 0, state.taskbarItems.length), 0, id);
      taskbarSuppressClickUntil = Date.now() + 250;
      saveState(); renderTaskbarPinned(); renderRunningTasks();
    }
    trackPointerDrag(button, event.pointerId, move, end);
  }

  function renderRunningTasks(activeId) {
    var holder = $('#runningTasks');
    holder.innerHTML = '';
    if (!activeId) {
      var activeWindow = Array.from(openWindows.values()).find(function (node) { return !node.classList.contains('minimized') && !node.classList.contains('inactive'); });
      activeId = activeWindow ? activeWindow.dataset.app : '';
    }
    $$('.taskbar-pinned-item').forEach(function (button) { button.classList.remove('running', 'active'); });
    openWindows.forEach(function (node, id) {
      var pinned = $('.taskbar-pinned-item[data-taskbar-id="' + id + '"]');
      if (pinned) {
        pinned.classList.add('running');
        pinned.classList.toggle('active', activeId === id && !node.classList.contains('minimized'));
        return;
      }
      var button = document.createElement('button');
      button.className = 'taskbar-button running' + (activeId === id && !node.classList.contains('minimized') ? ' active' : '');
      button.type = 'button';
      button.dataset.runningApp = id;
      button.title = APP_DEFS[id].name;
      button.innerHTML = '<span class="taskbar-item-graphic" aria-hidden="true">' + APP_DEFS[id].icon + '</span>';
      button.addEventListener('click', function () { activateTaskbarItem(id); });
      holder.appendChild(button);
    });
  }

  function keepWindowsVisible() {
    openWindows.forEach(function (node) {
      if (node.classList.contains('maximized')) return;
      var rect = node.getBoundingClientRect();
      node.style.left = clamp(rect.left, -rect.width + 130, window.innerWidth - 130) + 'px';
      node.style.top = clamp(rect.top, 0, window.innerHeight - 90) + 'px';
    });
    renderDesktopIcons();
  }

  function renderWindowBody(node) {
    var app = node.dataset.app;
    var body = $('.window-body', node);
    if (app === 'home') {
      var folderId = validFolderId(node.dataset.folderId) ? node.dataset.folderId : '';
      node.dataset.folderId = folderId;
      $('.window-title', node).textContent = folderId ? folderName(folderId) + ' - Datei-Explorer' : APP_DEFS.home.title;
      body.innerHTML = renderExplorer(app, folderId, node);
    }
    else if (['media', 'images', 'videos', 'music', 'documents', 'games', 'trash'].indexOf(app) !== -1) body.innerHTML = renderExplorer(app, '', node);
    else if (app === 'settings') body.innerHTML = renderSettings(node.dataset.section || 'system');
    else if (app === 'profile') body.innerHTML = renderProfile(node);
    else if (app === 'chat') body.innerHTML = renderChat();
    else if (app === 'links') body.innerHTML = renderSettings('links');
    else if (app === 'viewer') body.innerHTML = renderMediaViewer(node);
    bindAppBody(node);
    hydrateIcons(node);
  }

  function refreshWindow(id) {
    var node = openWindows.get(id);
    if (!node) return;
    renderWindowBody(node);
  }

  function refreshExplorers() {
    ['home', 'images', 'videos', 'music', 'documents', 'media', 'games', 'trash'].forEach(refreshWindow);
    renderDesktopIcons();
    renderStartMenu($('#startSearch').value);
    renderTaskbarPinned();
    renderRunningTasks();
  }

  function explorerToolbar(app, folderId) {
    var parts = [];
    var currentSelection = selectedItemFor(app, folderId);
    if (app === 'home') {
      parts.push(commandButton('plus', 'Neu', 'new-item'));
      parts.push('<span class="command-separator"></span>');
      parts.push(commandButton('scissors', 'Ausschneiden', 'cut-file', !currentSelection));
      parts.push(commandButton('copy', 'Kopieren', 'copy-file', !currentSelection));
      parts.push(commandButton('trash', 'Löschen', 'delete-file', !currentSelection));
    } else if (isLibraryApp(app)) {
      parts.push(commandButton('upload', app === 'documents' ? 'Dokument importieren' : 'Importieren', 'import-library'));
      if (app !== 'documents' && app !== 'media') parts.push(commandButton('link', 'URL einbetten', 'embed-library'));
      parts.push(commandButton('eye', 'Öffnen', 'open-selected', !currentSelection));
      parts.push(commandButton('trash', 'Papierkorb', 'delete-library', !currentSelection));
    } else if (app === 'games') {
      parts.push(commandButton('plus', 'Spiel hinzufügen', 'add-game'));
      parts.push(commandButton('search', 'Geräteordner scannen', 'scan-games'));
      parts.push(commandButton('edit', 'Bearbeiten', 'edit-game', !currentSelection || !!detectedGameById(selectedFileId)));
      parts.push(commandButton('trash', 'Entfernen', 'delete-game', !currentSelection || !!detectedGameById(selectedFileId)));
    } else if (app === 'trash') {
      parts.push(commandButton('restore', 'Wiederherstellen', 'restore-selected', !currentSelection));
      parts.push(commandButton('trash', 'Endgültig löschen', 'delete-permanent', !currentSelection));
      parts.push('<span class="command-separator"></span>');
      parts.push('<button class="command-button danger" type="button" data-action="empty-trash"><span class="ui-icon" data-icon="trash"></span><span class="command-label">PAPIERKORB LEEREN</span></button>');
    }
    parts.push('<span style="flex:1"></span>');
    if (isLibraryApp(app)) {
      parts.push('<button class="command-button" type="button" data-action="media-view-grid" title="Kachelansicht"><span class="ui-icon" data-icon="grid"></span></button>');
      parts.push('<button class="command-button" type="button" data-action="media-view-list" title="Listenansicht"><span class="ui-icon" data-icon="list"></span></button>');
    }
    parts.push(commandButton('sort', 'Sortieren', 'sort-items'));
    return parts.join('');
  }

  function commandButton(icon, label, action, disabled) {
    return '<button class="command-button" type="button" data-action="' + action + '"' + (disabled ? ' disabled' : '') + '><span class="ui-icon" data-icon="' + icon + '"></span><span class="command-label">' + label + '</span></button>';
  }

  function isLibraryApp(app) {
    return ['media', 'images', 'videos', 'music', 'documents'].indexOf(app) !== -1;
  }

  function isExplorerApp(app) {
    return ['home', 'images', 'videos', 'music', 'documents', 'media', 'games', 'trash'].indexOf(app) !== -1;
  }

  function recordExplorerVisit(app, folderId) {
    if (!isExplorerApp(app)) return;
    var entry = { app: app, folderId: app === 'home' ? (folderId || '') : '' };
    var current = explorerHistory[explorerHistoryIndex];
    if (current && current.app === entry.app && current.folderId === entry.folderId) {
      updateExplorerNavigationButtons();
      return;
    }
    explorerHistory = explorerHistory.slice(0, explorerHistoryIndex + 1);
    explorerHistory.push(entry);
    explorerHistoryIndex = explorerHistory.length - 1;
    updateExplorerNavigationButtons();
  }

  function navigateExplorerHistory(direction) {
    var next = explorerHistoryIndex + direction;
    if (next < 0 || next >= explorerHistory.length) return;
    explorerHistoryIndex = next;
    var entry = explorerHistory[next];
    if (entry.app === 'home') openApp('home', { folderId: entry.folderId || '', fromExplorerHistory: true });
    else openApp(entry.app, { fromExplorerHistory: true });
    updateExplorerNavigationButtons();
  }

  function updateExplorerNavigationButtons() {
    openWindows.forEach(function (node, app) {
      if (!isExplorerApp(app)) return;
      var back = $('[data-action="nav-back"]', node);
      var forward = $('[data-action="nav-forward"]', node);
      if (back) back.disabled = explorerHistoryIndex <= 0;
      if (forward) forward.disabled = explorerHistoryIndex < 0 || explorerHistoryIndex >= explorerHistory.length - 1;
    });
  }

  function selectedItemFor(app, folderId) {
    if (!selectedFileId) return null;
    if (app === 'home') {
      var location = folderId || 'desktop';
      return state.files.find(function (file) { return file.id === selectedFileId && file.location === location; }) || null;
    }
    if (isLibraryApp(app)) {
      var libraryFile = app === 'documents' ? state.files.find(function (item) { return item.id === selectedFileId && item.type === 'text' && item.location !== 'trash'; }) : null;
      return libraryFile || state.media.find(function (item) { return item.id === selectedFileId && mediaBelongsToLibrary(item, app); }) || null;
    }
    if (app === 'games') return allGames().find(function (item) { return item.id === selectedFileId; }) || null;
    if (app === 'trash') return state.files.find(function (file) { return file.id === selectedFileId && file.location === 'trash'; }) || state.trashedShortcuts.find(function (item) { return item.id === selectedFileId; }) || null;
    return null;
  }

  function folderById(id) {
    return state.files.find(function (file) { return file.id === id && file.type === 'folder' && file.location !== 'trash'; });
  }

  function validFolderId(id) {
    return !id || !!folderById(id);
  }

  function folderName(id) {
    var folder = folderById(id);
    return folder ? folder.name : 'Desktop';
  }

  function homeFolderPath(folderId) {
    var parts = [];
    var current = folderById(folderId);
    var visited = new Set();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      parts.unshift(current.name);
      current = folderById(current.location);
    }
    return ['Dieser PC', 'Desktop'].concat(parts).join(' > ');
  }

  function navigateHomeFolder(folderId, addToHistory, fromExplorerHistory) {
    var node = openWindows.get('home');
    if (!node) return openApp('home', { folderId: folderId || '' });
    var destination = validFolderId(folderId) ? (folderId || '') : '';
    if (!Array.isArray(node._folderHistory)) {
      node._folderHistory = [node.dataset.folderId || ''];
      node._folderHistoryIndex = 0;
    }
    if (addToHistory !== false && destination !== (node.dataset.folderId || '')) {
      node._folderHistory = node._folderHistory.slice(0, Number(node._folderHistoryIndex || 0) + 1);
      node._folderHistory.push(destination);
      node._folderHistoryIndex = node._folderHistory.length - 1;
    }
    node.dataset.folderId = destination;
    if (!fromExplorerHistory) recordExplorerVisit('home', destination);
    selectedFileId = null;
    renderWindowBody(node);
    focusWindow(node);
    return node;
  }

  function parentFolderId(folderId) {
    var folder = folderById(folderId);
    return folder && folderById(folder.location) ? folder.location : '';
  }

  function locationLabel(location) {
    if (!location || location === 'desktop') return 'Desktop';
    var folder = state.files.find(function (file) { return file.id === location && file.type === 'folder'; });
    return folder ? 'Desktop > ' + folder.name : String(location);
  }

  function renderExplorer(app, folderId, node) {
    var label = app === 'home' && folderId ? folderName(folderId) : APP_DEFS[app].name;
    var path = app === 'home' ? homeFolderPath(folderId) : 'Dieser PC > ' + label;
    var canGoBack = explorerHistoryIndex > 0;
    var canGoForward = explorerHistoryIndex >= 0 && explorerHistoryIndex < explorerHistory.length - 1;
    var canGoUp = app !== 'home' || !!folderId;
    var dropLocation = app === 'home' ? (folderId ? 'folder:' + folderId : 'home') : app;
    return '<div class="explorer-shell" data-explorer="' + app + '">' +
      '<div class="explorer-commandbar">' + explorerToolbar(app, folderId) + '</div>' +
      '<div class="explorer-navrow"><div class="nav-buttons"><button class="nav-button" type="button" data-action="nav-back" title="Zurück"' + (canGoBack ? '' : ' disabled') + '><span class="ui-icon" data-icon="back"></span></button><button class="nav-button" type="button" data-action="nav-forward" title="Vorwärts"' + (canGoForward ? '' : ' disabled') + '><span class="ui-icon" data-icon="forward"></span></button><button class="nav-button" type="button" data-action="nav-up" title="Nach oben"' + (canGoUp ? '' : ' disabled') + '><span class="ui-icon" data-icon="up"></span></button><button class="nav-button" type="button" data-action="refresh" title="Aktualisieren"><span class="ui-icon" data-icon="refresh"></span></button></div>' +
      '<div class="address-bar"><span>🖥️</span><span>' + escapeHtml(path) + '</span></div>' +
      '<label class="explorer-search"><span class="ui-icon" data-icon="search"></span><input type="search" data-role="explorer-search" placeholder="' + escapeHtml(label) + ' durchsuchen" aria-label="' + escapeHtml(label) + ' durchsuchen"></label></div>' +
      '<div class="explorer-main">' + explorerSidebar(app) +
      '<section class="explorer-content" data-drop-location="' + dropLocation + '">' + renderExplorerContent(app, '', folderId) + '</section></div>' +
      '<footer class="statusbar"><span>' + itemCount(app, folderId) + ' Elemente</span><span>' + (selectedItemFor(app, folderId) ? '1 Element ausgewählt' : '') + '</span></footer></div>';
  }

  function explorerSidebar(active) {
    return '<nav class="explorer-sidebar" aria-label="Explorer-Navigation">' +
      sidebarButton('home', '🖥️', 'Desktop', active) +
      sidebarButton('images', '🖼️', 'Bilder', active) +
      sidebarButton('videos', '🎬', 'Videos', active) +
      sidebarButton('music', '🎵', 'Musik', active) +
      sidebarButton('documents', '📄', 'Dokumente', active) +
      sidebarButton('games', '🎮', 'Games', active) +
      sidebarButton('chat', '💬', 'Raum-Chat', active) +
      sidebarButton('trash', '🗑️', 'Papierkorb', active) +
      '<div class="settings-section-title" style="margin:14px 9px 5px">Schnellzugriff</div>' +
      sidebarButton('profile', '👤', state.profile.username, active) +
      sidebarButton('settings', '⚙️', 'Einstellungen', active) + '</nav>';
  }

  function sidebarButton(app, icon, label, active) {
    return '<button class="sidebar-item' + (app === active ? ' active' : '') + '" type="button" data-app="' + app + '"><span class="sidebar-icon">' + icon + '</span><span>' + escapeHtml(label) + '</span></button>';
  }

  function homeVirtualItems(query) {
    return [
      { id: 'virtual-images', name: 'Bilder', type: 'folder', app: 'images' },
      { id: 'virtual-videos', name: 'Videos', type: 'folder', app: 'videos' },
      { id: 'virtual-music', name: 'Musik', type: 'folder', app: 'music' },
      { id: 'virtual-documents', name: 'Dokumente', type: 'folder', app: 'documents' },
      { id: 'virtual-games', name: 'Games', type: 'folder', app: 'games' },
      { id: 'virtual-chat', name: 'Raum-Chat', type: 'shortcut', app: 'chat' },
      { id: 'virtual-settings', name: 'Einstellungen', type: 'shortcut', app: 'settings' }
    ].filter(function (item) { return matchesQuery(item, query); });
  }

  function itemCount(app, folderId) {
    if (app === 'home') {
      var location = folderId || 'desktop';
      var count = state.files.filter(function (file) { return file.location === location; }).length;
      return count + (folderId ? 0 : homeVirtualItems('').length);
    }
    if (isLibraryApp(app)) return libraryEntries(app, '').length;
    if (app === 'games') return allGames().length;
    if (app === 'trash') return state.files.filter(function (file) { return file.location === 'trash'; }).length + state.trashedShortcuts.length;
    return 0;
  }

  function renderExplorerContent(app, query, folderId) {
    if (app === 'home') return renderHomeFiles(query, folderId);
    if (isLibraryApp(app)) return renderLibrary(app, query);
    if (app === 'games') return renderGames(query);
    if (app === 'trash') return renderTrash(query);
    return '';
  }

  function renderHomeFiles(query, folderId) {
    var location = folderId || 'desktop';
    var items = state.files.filter(function (file) { return file.location === location && matchesQuery(file, query); });
    var folders = folderId ? [] : homeVirtualItems(query);
    var all = folders.concat(items);
    if (!all.length) return emptyState('📂', 'Dieser Ordner ist leer', 'Erstelle einen neuen Ordner oder eine Datei.');
    return '<div class="content-heading"><h2>' + escapeHtml(folderId ? folderName(folderId) : 'Desktop') + '</h2><small>' + all.length + ' Elemente</small></div><div class="file-grid">' + all.map(fileTile).join('') + '</div>';
  }

  function matchesQuery(item, query) {
    return !query || String(item.name || '').toLowerCase().indexOf(String(query).toLowerCase()) !== -1;
  }

  function fileTile(item) {
    var icon = item.type === 'folder' ? '📁' : item.type === 'text' ? '📄' : item.type === 'shortcut' ? '🔗' : '📦';
    return '<button class="file-item' + (selectedFileId === item.id ? ' selected' : '') + '" draggable="' + (!item.app) + '" type="button" data-file-id="' + escapeHtml(item.id) + '"' + (item.app ? ' data-app="' + item.app + '"' : '') + ' data-file-type="' + item.type + '"><span class="file-icon">' + icon + '</span><span class="file-name">' + escapeHtml(item.name) + '</span></button>';
  }

  function mediaBelongsToLibrary(item, app) {
    if (!item) return false;
    if (app === 'media') return true;
    if (app === 'images') return item.type === 'image';
    if (app === 'videos') return item.type === 'video' || item.type === 'embed';
    if (app === 'music') return item.type === 'audio';
    if (app === 'documents') return item.type === 'document';
    return false;
  }

  function libraryLabel(app) {
    return { media: 'Medienarchiv', images: 'Bilder', videos: 'Videos', music: 'Musik', documents: 'Dokumente' }[app] || 'Medien';
  }

  function libraryIcon(app) {
    return { media: '🗂️', images: '🖼️', videos: '🎬', music: '🎵', documents: '📄' }[app] || '📦';
  }

  function libraryEntries(app, query) {
    var entries = state.media.filter(function (item) {
      return mediaBelongsToLibrary(item, app) && matchesQuery(item, query);
    }).map(function (item) { return { kind: 'media', item: item }; });
    if (app === 'documents') {
      state.files.filter(function (file) {
        return file.type === 'text' && file.location !== 'trash' && matchesQuery(file, query);
      }).forEach(function (file) { entries.push({ kind: 'file', item: file }); });
    }
    return entries;
  }

  function renderMedia(query) {
    return renderLibrary('media', query);
  }

  function renderLibrary(app, query) {
    var entries = libraryEntries(app, query);
    var label = libraryLabel(app);
    if (!entries.length) {
      var copy = app === 'documents' ? 'Erstelle eine Textdatei oder importiere ein Dokument.' : app === 'music' ? 'Importiere Audiodateien oder füge eine direkte Audio-Adresse hinzu.' : 'Importiere Dateien oder bette eine passende Web-Adresse ein.';
      return emptyState(libraryIcon(app), 'Noch keine ' + label, copy);
    }
    if (state.settings.mediaView === 'list') {
      return '<div class="content-heading"><h2>' + escapeHtml(label) + '</h2><small>' + entries.length + ' Elemente</small></div><table class="file-list"><thead><tr><th>Name</th><th>Typ</th><th>Größe</th><th>Geändert</th></tr></thead><tbody>' + entries.map(function (entry) {
        var item = entry.item;
        var attrs = entry.kind === 'file' ? ' data-file-id="' + escapeHtml(item.id) + '" data-file-type="text"' : ' data-media-id="' + escapeHtml(item.id) + '"';
        var icon = entry.kind === 'file' ? '📄' : mediaItemIcon(item);
        var type = entry.kind === 'file' ? 'Textdokument' : mediaTypeLabel(item);
        var size = entry.kind === 'file' ? formatBytes(item.size || new Blob([item.content || '']).size) : mediaSizeLabel(item);
        return '<tr' + attrs + ' draggable="true"><td><span class="name-cell"><span>' + icon + '</span>' + escapeHtml(item.name) + '</span></td><td>' + escapeHtml(type) + '</td><td>' + escapeHtml(size) + '</td><td>' + formatDate(item.modified) + '</td></tr>';
      }).join('') + '</tbody></table>';
    }
    return '<div class="content-heading"><h2>' + escapeHtml(label) + '</h2><small>' + entries.length + ' Elemente</small></div><div class="media-grid">' + entries.map(function (entry) {
      var item = entry.item;
      if (entry.kind === 'file') {
        return '<button class="media-card' + (selectedFileId === item.id ? ' selected' : '') + '" type="button" draggable="true" data-file-id="' + escapeHtml(item.id) + '" data-file-type="text"><span class="media-preview"><span class="media-embed-preview">📄</span><span class="media-type-badge">TEXT</span></span><span class="media-info"><strong>' + escapeHtml(item.name) + '</strong><span>' + formatBytes(item.size || new Blob([item.content || '']).size) + ' · ' + formatDate(item.modified) + '</span></span></button>';
      }
      var source = runtimeMedia.get(item.id) || item.src || '';
      var preview = item.type === 'embed' ? '<span class="media-embed-preview">▶</span>' : item.type === 'video' ? (source ? '<video src="' + escapeHtml(source) + '" preload="metadata" muted></video>' : '🎬') : item.type === 'image' ? (source ? '<img src="' + escapeHtml(source) + '" alt="">' : '🖼️') : '<span class="media-embed-preview">' + mediaItemIcon(item) + '</span>';
      return '<button class="media-card' + (selectedFileId === item.id ? ' selected' : '') + '" type="button" draggable="true" data-media-id="' + escapeHtml(item.id) + '"><span class="media-preview">' + preview + '<span class="media-type-badge">' + escapeHtml(mediaBadgeLabel(item)) + '</span></span><span class="media-info"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(mediaSizeLabel(item)) + ' · ' + formatDate(item.modified) + '</span></span></button>';
    }).join('') + '</div>';
  }

  function mediaItemIcon(item) {
    if (item.type === 'embed' || item.type === 'video') return '🎬';
    if (item.type === 'audio') return '🎵';
    if (item.type === 'document') return '📄';
    return '🖼️';
  }

  function mediaTypeLabel(item) {
    if (item.type === 'embed') return 'Eingebettetes Webvideo';
    if (item.type === 'video') return item.embedded ? 'Video über URL' : (item.mime || 'Video');
    if (item.type === 'audio') return item.embedded ? 'Audio über URL' : (item.mime || 'Audiodatei');
    if (item.type === 'document') return item.mime || 'Dokument';
    return item.embedded ? 'Bild über URL' : (item.mime || 'Bild');
  }

  function mediaBadgeLabel(item) {
    return item.type === 'embed' ? 'WEBVIDEO' : item.type === 'video' ? 'VIDEO' : item.type === 'audio' ? 'MUSIK' : item.type === 'document' ? 'DOKUMENT' : 'BILD';
  }

  function mediaSizeLabel(item) {
    return item.embedded ? 'Web-Link' : formatBytes(item.size);
  }

  function renderGames(query) {
    var items = allGames().filter(function (item) { return matchesQuery(item, query); });
    if (!items.length) return emptyState('🎮', 'Keine Games eingetragen', 'Füge ein Spiel mit Name und Link oder Installationspfad hinzu.');
    var scanCopy = localGameScan.status === 'loading' ? 'Der ausgewählte Geräteordner wird durchsucht …' : localGameScan.status === 'ready' ? detectedGames.length + ' Installation(en) auf diesem Gerät erkannt' : localGameScan.error || 'Klicke auf „Geräteordner scannen“ und wähle deinen Steam-, Xbox- oder Spieleordner aus.';
    return '<div class="content-heading"><div><h2>Spielebibliothek</h2><small class="library-scan">' + escapeHtml(scanCopy) + '</small></div><small>' + items.length + ' Games</small></div><div class="game-grid">' + items.map(function (game) {
      var source = game.detected ? (game.source === 'steam' ? 'STEAM' : game.source === 'xbox' ? 'XBOX' : 'GERÄT') : 'MANUELL';
      return '<article class="game-card' + (selectedFileId === game.id ? ' selected' : '') + '" data-game-id="' + escapeHtml(game.id) + '" draggable="' + (!game.detected) + '"><div class="game-cover"><span>' + escapeHtml(game.icon || '🎮') + '</span><span class="game-source-badge">' + source + '</span></div><div class="game-card-body"><h3>' + escapeHtml(game.name) + '</h3><p title="' + escapeHtml(game.path || game.url || 'Kein Startziel hinterlegt') + '">' + escapeHtml(game.path || game.url || 'Startziel noch nicht hinterlegt') + '</p><div class="game-actions"><span class="muted">' + escapeHtml(gameSizeLabel(game)) + '</span><button class="button primary small" type="button" data-action="launch-game" data-game-id="' + escapeHtml(game.id) + '">Starten</button></div></div></article>';
    }).join('') + '</div>';
  }

  function detectedGameById(id) {
    return detectedGames.find(function (game) { return game.id === id; });
  }

  function allGames() {
    var seen = new Set();
    return state.games.concat(detectedGames).filter(function (game) {
      var key = String(game.path || game.name || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function gameSizeLabel(game) {
    if (typeof game.size === 'number') return formatBytes(game.size);
    return game.size || (game.lastUsed ? 'Zuletzt ' + formatDate(game.lastUsed) : 'Bereit');
  }

  function scanLocalGames(showResult) {
    if (!showResult) {
      if (localGameScan.status === 'loading') localGameScan.status = 'idle';
      refreshWindow('games');
      return Promise.resolve(detectedGames);
    }
    if (typeof window.showDirectoryPicker !== 'function') {
      localGameScan = { status: 'error', roots: [], error: 'Dieser Browser unterstützt keine Geräteordner-Auswahl. Verwende Chrome oder Edge über HTTPS.' };
      refreshWindow('games');
      refreshWindow('settings');
      toast('Ordnerscan nicht unterstützt', localGameScan.error, '⚠️');
      return Promise.resolve([]);
    }
    localGameScan = { status: 'loading', roots: localGameScan.roots || [], error: '' };
    refreshWindow('games');
    return window.showDirectoryPicker({ id: 'patrick-desktop-games', mode: 'read' }).then(function (handle) {
      return scanDeviceGameFolder(handle);
    }).then(function (result) {
      var newGames = result.games || [];
      var byPath = new Map();
      detectedGames.concat(newGames).forEach(function (game) {
        byPath.set(String(game.path || game.name || '').toLowerCase(), game);
      });
      detectedGames = Array.from(byPath.values());
      var existingRoots = (localGameScan.roots || []).filter(function (root) { return root.label !== result.root.label; });
      existingRoots.push(result.root);
      localGameScan = { status: 'ready', roots: existingRoots, error: '' };
      selectedFileId = detectedGameById(selectedFileId) ? null : selectedFileId;
      refreshWindow('games');
      refreshWindow('settings');
      toast('Geräteordner durchsucht', newGames.length + ' Spieleintrag/-einträge in „' + result.root.label + '“ erkannt.', '🎮');
      return detectedGames;
    }).catch(function (error) {
      if (error && error.name === 'AbortError') {
        localGameScan.status = detectedGames.length ? 'ready' : 'idle';
        refreshWindow('games');
        refreshWindow('settings');
        return detectedGames;
      }
      localGameScan = { status: 'error', roots: localGameScan.roots || [], error: error && error.message ? error.message : 'Der ausgewählte Geräteordner konnte nicht gelesen werden.' };
      refreshWindow('games');
      refreshWindow('settings');
      toast('Ordnerscan fehlgeschlagen', localGameScan.error, '⚠️');
      return detectedGames;
    });
  }

  async function scanDeviceGameFolder(rootHandle) {
    if (!rootHandle || rootHandle.kind !== 'directory') throw new Error('Bitte wähle einen Ordner aus.');
    var rootName = rootHandle.name || 'Ausgewählter Ordner';
    var lowerName = rootName.toLowerCase();
    var source = lowerName.indexOf('xbox') !== -1 ? 'xbox' : lowerName.indexOf('steam') !== -1 || lowerName === 'steamapps' || lowerName === 'common' ? 'steam' : 'device';
    var games = [];
    gameDirectoryHandles.set('root:' + rootName, rootHandle);

    if (lowerName === 'steamapps' || lowerName.indexOf('steamapps') !== -1) {
      games = await scanSteamAppsDirectory(rootHandle, rootName);
    } else {
      games = await scanGameParentDirectory(rootHandle, rootName, source);
    }

    if (!games.length) {
      var looksLikeGame = await directoryContainsGameFiles(rootHandle);
      if (looksLikeGame) games.push(makeDetectedGame(rootName, rootName, source, rootHandle));
    }
    return { games: games, root: { label: rootName, available: true, count: games.length } };
  }

  async function scanSteamAppsDirectory(rootHandle, rootName) {
    var manifests = [];
    var commonHandle = null;
    var commonNames = new Set();
    try { commonHandle = await rootHandle.getDirectoryHandle('common'); } catch (error) {}
    if (commonHandle) {
      for await (var commonEntry of commonHandle.values()) {
        if (commonEntry.kind === 'directory' && !isIgnoredGameFolder(commonEntry.name)) commonNames.add(commonEntry.name);
      }
    }
    for await (var entry of rootHandle.values()) {
      if (entry.kind !== 'file' || !/^appmanifest_\d+\.acf$/i.test(entry.name)) continue;
      try {
        var text = await (await entry.getFile()).text();
        var nameMatch = text.match(/"name"\s+"([^"]+)"/i);
        var dirMatch = text.match(/"installdir"\s+"([^"]+)"/i);
        var sizeMatch = text.match(/"SizeOnDisk"\s+"?(\d+)"?/i);
        var updatedMatch = text.match(/"LastUpdated"\s+"?(\d+)"?/i);
        var gameName = nameMatch ? nameMatch[1] : dirMatch ? dirMatch[1] : entry.name.replace(/\.acf$/i, '');
        var installDir = dirMatch ? dirMatch[1] : gameName;
        var path = rootName + '/common/' + installDir;
        var handle = null;
        if (commonHandle) {
          try { handle = await commonHandle.getDirectoryHandle(installDir); } catch (error) {}
        }
        var game = makeDetectedGame(gameName, path, 'steam', handle);
        if (sizeMatch) game.size = Number(sizeMatch[1]);
        if (updatedMatch) game.lastUsed = new Date(Number(updatedMatch[1]) * 1000).toISOString();
        manifests.push(game);
        commonNames.delete(installDir);
      } catch (error) {}
    }
    commonNames.forEach(function (folderName) {
      manifests.push(makeDetectedGame(folderName, rootName + '/common/' + folderName, 'steam', null));
    });
    return manifests;
  }

  async function scanGameParentDirectory(rootHandle, rootName, source) {
    var games = [];
    for await (var entry of rootHandle.values()) {
      if (entry.kind !== 'directory' || isIgnoredGameFolder(entry.name)) continue;
      var path = rootName + '/' + entry.name;
      var looksLikeGame = source === 'steam' || source === 'xbox' ? true : await directoryContainsGameFiles(entry);
      if (looksLikeGame) games.push(makeDetectedGame(entry.name, path, source, entry));
    }
    if (!games.length && source === 'device') {
      for await (var fallbackEntry of rootHandle.values()) {
        if (fallbackEntry.kind === 'directory' && !isIgnoredGameFolder(fallbackEntry.name)) {
          games.push(makeDetectedGame(fallbackEntry.name, rootName + '/' + fallbackEntry.name, source, fallbackEntry));
        }
      }
    }
    return games;
  }

  async function directoryContainsGameFiles(handle) {
    var checked = 0;
    try {
      for await (var entry of handle.values()) {
        checked += 1;
        if (entry.kind === 'file' && /\.(?:exe|xex|appx|msix|pak|vdf)$/i.test(entry.name)) return true;
        if (entry.kind === 'file' && /^(?:steam_appid|goggame-|game)\b/i.test(entry.name)) return true;
        if (checked >= 250) break;
      }
    } catch (error) {}
    return false;
  }

  function isIgnoredGameFolder(name) {
    return /^(?:\.|_CommonRedist|redist|support|tools|temp|cache|content|program files)$/i.test(String(name || ''));
  }

  function makeDetectedGame(name, path, source, handle) {
    var id = 'device-' + stableDeviceGameId(path);
    if (handle) gameDirectoryHandles.set(id, handle);
    return {
      id: id,
      name: name,
      path: path,
      url: '',
      lastUsed: '',
      size: 'Auf Gerät erkannt',
      icon: source === 'steam' ? '🎮' : source === 'xbox' ? '🟩' : '🕹️',
      source: source || 'device',
      detected: true,
      deviceSelected: true
    };
  }

  function stableDeviceGameId(value) {
    var text = String(value || 'game').toLowerCase();
    var hash = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function renderTrash(query) {
    var files = state.files.filter(function (file) { return file.location === 'trash' && matchesQuery(file, query); });
    var shortcuts = state.trashedShortcuts.filter(function (item) { return matchesQuery(item, query); }).map(function (item) {
      return { id: item.id, name: item.name, type: 'shortcut-trash', deletedAt: item.deletedAt, app: item.app };
    });
    var items = files.concat(shortcuts);
    if (!items.length) return emptyState('🗑️', 'Der Papierkorb ist leer', 'Gelöschte Dateien, Ordner und Verknüpfungen werden hier angezeigt.');
    return '<div class="content-heading"><h2>Papierkorb</h2><small>' + items.length + ' Elemente</small></div><table class="file-list"><thead><tr><th>Name</th><th>Ursprünglicher Ort</th><th>Gelöscht am</th><th>Größe</th></tr></thead><tbody>' + items.map(function (item) {
      return '<tr data-trash-id="' + item.id + '" class="' + (selectedFileId === item.id ? 'selected' : '') + '"><td><span class="name-cell"><span>' + (item.type === 'folder' ? '📁' : item.type === 'shortcut-trash' ? '🔗' : '📄') + '</span>' + escapeHtml(item.name) + '</span></td><td>' + escapeHtml(locationLabel(item.deletedFrom || 'desktop')) + '</td><td>' + formatDate(item.deletedAt, true) + '</td><td>' + (item.type === 'shortcut-trash' ? 'Verknüpfung' : formatBytes(item.size)) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }

  function emptyState(icon, title, copy) {
    return '<div class="empty-state"><div><div class="empty-icon">' + icon + '</div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(copy) + '</p></div></div>';
  }

  function bindAppBody(node) {
    var body = $('.window-body', node);
    if (!body.dataset.appEventsBound) {
      body.dataset.appEventsBound = 'true';
      body.addEventListener('click', function (event) { handleAppClick(event, node); });
      body.addEventListener('dblclick', function (event) { handleAppDoubleClick(event, node); });
      body.addEventListener('contextmenu', function (event) { handleAppContextMenu(event, node); });
    }
    var search = $('[data-role="explorer-search"]', body);
    if (search) search.addEventListener('input', function (event) {
      $('.explorer-content', body).innerHTML = renderExplorerContent(node.dataset.app, event.target.value, node.dataset.folderId || '');
      bindDraggables(node);
    });
    bindDraggables(node);
    if (node.dataset.app === 'settings' || node.dataset.app === 'links') bindSettings(node);
    if (node.dataset.app === 'profile') bindProfile(node);
    if (node.dataset.app === 'chat') bindChat(node);
  }

  function bindDraggables(node) {
    $$('[draggable="true"]', node).forEach(function (item) {
      if (item.dataset.dragEventsBound === 'true') return;
      item.dataset.dragEventsBound = 'true';
      item.addEventListener('dragstart', function (event) {
        draggedFileId = item.dataset.fileId || item.dataset.mediaId || item.dataset.gameId;
        event.dataTransfer.setData('text/plain', draggedFileId || '');
        event.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', clearFileDragState);
    });
    $$('[data-drop-location]', node).forEach(function (drop) {
      if (drop.dataset.dropEventsBound === 'true') return;
      drop.dataset.dropEventsBound = 'true';
      drop.addEventListener('dragover', function (event) { if (draggedFileId) { event.preventDefault(); drop.classList.add('drop-over'); } });
      drop.addEventListener('dragleave', function () { drop.classList.remove('drop-over'); });
      drop.addEventListener('drop', function (event) {
        event.preventDefault();
        var itemId = draggedFileId;
        var location = drop.dataset.dropLocation;
        clearFileDragState();
        if (!itemId) return;
        if (location === 'trash') moveFileToTrash(itemId);
        else moveVirtualItem(itemId, location);
      });
    });
    $$('[data-file-id][data-file-type="folder"]', node).forEach(function (folder) {
      if (folder.dataset.folderDropEventsBound === 'true') return;
      folder.dataset.folderDropEventsBound = 'true';
      folder.addEventListener('dragover', function (event) {
        if (draggedFileId && draggedFileId !== folder.dataset.fileId) { event.preventDefault(); folder.classList.add('drop-over'); }
      });
      folder.addEventListener('dragleave', function () { folder.classList.remove('drop-over'); });
      folder.addEventListener('drop', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var itemId = draggedFileId;
        var folderId = folder.dataset.fileId;
        clearFileDragState();
        if (itemId) moveVirtualItem(itemId, 'folder:' + folderId);
      });
    });
  }

  function clearFileDragState() {
    draggedFileId = null;
    $$('.drop-over, .drop-target').forEach(function (drop) {
      drop.classList.remove('drop-over', 'drop-target');
    });
  }

  function handleAppClick(event, node) {
    var appButton = event.target.closest('button[data-app]');
    if (appButton) { openApp(appButton.dataset.app); return; }
    var actionButton = event.target.closest('[data-action]');
    if (actionButton) { handleAction(actionButton.dataset.action, actionButton, node); return; }
    var file = event.target.closest('[data-file-id]');
    var media = event.target.closest('[data-media-id]');
    var game = event.target.closest('[data-game-id]');
    var trash = event.target.closest('[data-trash-id]');
    var selectedNode = file || media || game || trash;
    selectedFileId = file ? file.dataset.fileId : media ? media.dataset.mediaId : game ? game.dataset.gameId : trash ? trash.dataset.trashId : null;
    if (selectedFileId && selectedNode) {
      $$('.selected', node).forEach(function (item) { item.classList.remove('selected'); });
      selectedNode.classList.add('selected');
      updateExplorerSelection(node);
    }
  }

  function updateExplorerSelection(node) {
    var app = node.dataset.app;
    var actions = app === 'home' ? ['cut-file', 'copy-file', 'delete-file'] : isLibraryApp(app) ? ['open-selected', 'delete-library'] : app === 'games' ? ['edit-game', 'delete-game'] : app === 'trash' ? ['restore-selected', 'delete-permanent'] : [];
    actions.forEach(function (action) {
      var control = $('[data-action="' + action + '"]', node);
      if (!control) return;
      control.disabled = !selectedFileId || (app === 'games' && !!detectedGameById(selectedFileId) && action !== 'open-selected');
    });
    var status = $('.statusbar span:last-child', node);
    if (status) status.textContent = selectedFileId ? '1 Element ausgewählt' : '';
  }

  function handleAppDoubleClick(event, node) {
    var app = event.target.closest('button[data-app]');
    if (app) { openApp(app.dataset.app); return; }
    var fileNode = event.target.closest('[data-file-id]');
    var mediaNode = event.target.closest('[data-media-id]');
    var gameNode = event.target.closest('[data-game-id]');
    if (fileNode) openVirtualFile(fileNode.dataset.fileId);
    if (mediaNode) openMedia(mediaNode.dataset.mediaId);
    if (gameNode) launchGame(gameNode.dataset.gameId);
  }

  function handleAppContextMenu(event, node) {
    var target = event.target.closest('[data-file-id], [data-media-id], [data-game-id], [data-trash-id]');
    if (!target) return;
    event.preventDefault();
    selectedFileId = target.dataset.fileId || target.dataset.mediaId || target.dataset.gameId || target.dataset.trashId;
    var type = target.dataset.mediaId ? 'media' : target.dataset.gameId ? 'game' : target.dataset.trashId ? 'trash' : 'file';
    showContextMenu(event.clientX, event.clientY, fileContextItems(type, selectedFileId));
  }

  function handleAction(action, button, node) {
    var app = node.dataset.app;
    if (action === 'nav-back') navigateExplorerHistory(-1);
    else if (action === 'nav-forward') navigateExplorerHistory(1);
    else if (action === 'nav-up') {
      if (app === 'home') navigateHomeFolder(parentFolderId(node.dataset.folderId || ''), true);
      else openApp('home', { folderId: '' });
    }
    else if (action === 'refresh') {
      if (app === 'games') scanLocalGames(true);
      else { refreshWindow(app); toast('Aktualisiert', APP_DEFS[app].name + ' wurde aktualisiert.', '↻'); }
    }
    else if (action === 'sort-items') sortItems(app);
    else if (action === 'new-item') createItemDialog(null, node.dataset.folderId || 'desktop');
    else if (action === 'cut-file' && selectedFileId) { moveFileToTrash(selectedFileId); toast('Ausgeschnitten', 'Das Element liegt im Papierkorb und kann wiederhergestellt werden.', '✂️'); }
    else if (action === 'copy-file' && selectedFileId) duplicateFile(selectedFileId);
    else if (action === 'delete-file' && selectedFileId) moveFileToTrash(selectedFileId);
    else if (action === 'import-library') prepareLibraryImport(app);
    else if (action === 'import-media') prepareLibraryImport('images');
    else if (action === 'embed-library') mediaUrlDialog(app);
    else if (action === 'embed-media') mediaUrlDialog('images');
    else if (action === 'media-view-grid' || action === 'media-view-list') {
      state.settings.mediaView = action.endsWith('list') ? 'list' : 'grid'; saveState(); refreshWindow(app);
    } else if (action === 'open-selected' && selectedFileId) openLibraryItem(selectedFileId);
    else if (action === 'delete-library' && selectedFileId) deleteLibraryItem(selectedFileId);
    else if (action === 'delete-media' && selectedFileId) deleteLibraryItem(selectedFileId);
    else if (action === 'add-game') gameDialog();
    else if (action === 'scan-games') scanLocalGames(true);
    else if (action === 'edit-game' && selectedFileId) gameDialog(selectedFileId);
    else if (action === 'delete-game' && selectedFileId) deleteGame(selectedFileId);
    else if (action === 'launch-game') launchGame(button.dataset.gameId);
    else if (action === 'restore-selected' && selectedFileId) restoreTrashItem(selectedFileId);
    else if (action === 'delete-permanent' && selectedFileId) permanentlyDelete(selectedFileId);
    else if (action === 'empty-trash') emptyTrash();
    else if (action === 'settings-section') { node.dataset.section = button.dataset.section; renderWindowBody(node); }
    else if (action === 'choose-wallpaper') $('#wallpaperInput').click();
    else if (action === 'reset-wallpaper') { state.settings.wallpaper = ''; saveState(); applyTheme(); refreshWindow('settings'); toast('Hintergrund wiederhergestellt', 'Das originale Samurai-Hintergrundbild ist aktiv.', '🖼️'); }
    else if (action === 'reset-layout') resetDesktopLayout();
    else if (action === 'export-state') exportState();
    else if (action === 'import-state') $('#stateImportInput').click();
    else if (action === 'clear-local-data') clearLocalData();
    else if (action === 'add-link') linkDialog();
    else if (action === 'edit-link') linkDialog(button.dataset.linkId);
    else if (action === 'remove-link') removeLink(button.dataset.linkId);
    else if (action === 'chat-login') chatAuthDialog('login');
    else if (action === 'chat-register') chatAuthDialog('register');
    else if (action === 'chat-logout') chatLogout();
    else if (action === 'chat-profile') openChatProfile(chatSession.user && chatSession.user.id);
    else if (action === 'chat-profile-close') closeChatProfile();
    else if (action === 'chat-profile-edit') { chatProfileState.editing = true; refreshWindow('chat'); }
    else if (action === 'chat-profile-cancel') { chatProfileState.editing = false; refreshWindow('chat'); }
    else if (action === 'chat-profile-avatar-change') {
      var avatarInput = $('[data-chat-avatar-input]', node);
      if (avatarInput) avatarInput.click();
    }
    else if (action === 'chat-profile-private') openPrivateChat(button.dataset.username);
    else if (action === 'chat-room') switchChatRoom(Number(button.dataset.roomId));
    else if (action === 'chat-send') sendChatFrom(node);
    else if (action === 'chat-emoji') {
      var chatInput = $('[data-chat-input]', node);
      if (chatInput) { chatInput.value += ' 😊'; chatInput.focus(); }
    }
    else if (action === 'chat-user') openChatProfile(button.dataset.userId);
  }

  function createItemDialog(presetType, location) {
    var initialType = presetType === 'text' ? 'text' : 'folder';
    var targetLocation = location && location !== 'home' ? location : 'desktop';
    showDialog({
      icon: initialType === 'folder' ? '📁' : '📄',
      title: 'Neues Element',
      message: 'Erstelle eine Datei oder einen Ordner in „' + locationLabel(targetLocation) + '“.',
      fields: [
        { name: 'type', label: 'Typ', type: 'select', value: initialType, options: [['folder', 'Ordner'], ['text', 'Textdokument']] },
        { name: 'name', label: 'Name', type: 'text', value: initialType === 'folder' ? 'Neuer Ordner' : 'Neues Textdokument.txt', required: true }
      ],
      confirmText: 'Erstellen'
    }).then(function (result) {
      if (!result) return;
      var name = result.name.trim();
      if (!name) return toast('Name fehlt', 'Bitte gib einen Namen ein.', '⚠️');
      if (result.type === 'text' && !name.toLowerCase().endsWith('.txt')) name += '.txt';
      var file = { id: uid('file'), name: name, type: result.type, location: targetLocation, size: 0, modified: new Date().toISOString(), content: '' };
      state.files.push(file);
      if (targetLocation === 'desktop') state.desktopPositions[file.id] = findFreeDesktopPosition(file.id);
      selectedDesktopIds.clear();
      selectedDesktopIds.add(file.id);
      selectedFileId = file.id;
      saveState(); refreshExplorers(); toast('Erstellt', name, result.type === 'folder' ? '📁' : '📄');
    });
  }

  function openVirtualFile(id) {
    var file = state.files.find(function (item) { return item.id === id; });
    if (!file) return;
    if (file.type === 'folder') {
      openApp('home', { folderId: file.id });
      return;
    }
    if (file.type === 'text') {
      var blob = new Blob([file.content || ''], { type: 'text/plain;charset=utf-8' });
      downloadBrowserFile(blob, file.name || 'Dokument.txt');
      toast('Textdatei bereitgestellt', 'Die Datei wurde heruntergeladen. Beim Öffnen verwendet dein Betriebssystem das eingestellte Standardprogramm.', '📄');
      return;
    }
    toast('Dateityp nicht unterstützt', file.name, '⚠️');
  }

  function downloadBrowserFile(source, filename) {
    var url = source instanceof Blob ? URL.createObjectURL(source) : String(source || '');
    if (!url) return false;
    var link = document.createElement('a');
    link.href = url;
    link.download = filename || 'Datei';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (source instanceof Blob) window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    return true;
  }

  function openLibraryItem(id) {
    if (state.files.some(function (item) { return item.id === id; })) return openVirtualFile(id);
    return openMedia(id);
  }

  function deleteLibraryItem(id) {
    if (state.files.some(function (item) { return item.id === id; })) return moveFileToTrash(id);
    return deleteMedia(id);
  }

  function duplicateFile(id) {
    var file = state.files.find(function (item) { return item.id === id; });
    if (!file) return;
    var copy = clone(file);
    copy.id = uid('file');
    copy.name = file.name.replace(/(\.[^.]+)?$/, ' - Kopie$1');
    copy.modified = new Date().toISOString();
    state.files.push(copy);
    if (copy.location === 'desktop') state.desktopPositions[copy.id] = findFreeDesktopPosition(copy.id);
    selectedDesktopIds.clear(); selectedDesktopIds.add(copy.id);
    saveState(); selectedFileId = copy.id; refreshExplorers(); toast('Kopie erstellt', copy.name, '📄');
  }

  function moveVirtualItem(id, location) {
    var file = state.files.find(function (item) { return item.id === id; });
    if (file) {
      var target = location === 'home' ? 'desktop' : String(location || 'desktop');
      if (target.indexOf('folder:') === 0) target = target.slice(7);
      if (target !== 'desktop' && !folderById(target)) return toast('Ziel nicht verfügbar', 'Dieser Ordner wurde nicht gefunden.', '⚠️');
      if (file.type === 'folder' && (target === file.id || isFolderInside(target, file.id))) {
        return toast('Verschieben nicht möglich', 'Ein Ordner kann nicht in sich selbst oder einen Unterordner verschoben werden.', '⚠️');
      }
      if (file.location === target) return;
      file.location = target;
      file.modified = new Date().toISOString();
      if (target !== 'desktop') delete state.desktopPositions[file.id];
      else if (!state.desktopPositions[file.id]) state.desktopPositions[file.id] = findFreeDesktopPosition(file.id);
      saveState(); refreshExplorers(); toast('Element verschoben', file.name + ' → ' + locationLabel(target), '✓');
      return;
    }
    if (location === 'trash') {
      if (state.media.some(function (item) { return item.id === id; })) deleteMedia(id);
      if (state.games.some(function (item) { return item.id === id; })) deleteGame(id);
    } else {
      toast('Ablage nicht möglich', 'Medien und Games werden in ihren Bibliotheken verwaltet.', 'ℹ️');
    }
  }

  function isFolderInside(folderId, possibleParentId) {
    var current = folderById(folderId);
    var visited = new Set();
    while (current && !visited.has(current.id)) {
      if (current.id === possibleParentId) return true;
      visited.add(current.id);
      current = folderById(current.location);
    }
    return false;
  }

  function descendantFileIds(folderId) {
    var result = new Set();
    var pending = [folderId];
    while (pending.length) {
      var parent = pending.shift();
      state.files.forEach(function (file) {
        if (file.location === parent && !result.has(file.id)) {
          result.add(file.id);
          if (file.type === 'folder') pending.push(file.id);
        }
      });
    }
    return result;
  }

  function moveFileToTrash(id) {
    var file = state.files.find(function (item) { return item.id === id; });
    if (file) {
      file.deletedFrom = file.location;
      file.location = 'trash';
      file.deletedAt = new Date().toISOString();
      selectedDesktopIds.delete(id);
      if (selectedFileId === id) selectedFileId = null;
      saveState(); refreshExplorers(); toast('In den Papierkorb verschoben', file.name, '🗑️'); return;
    }
    if (state.media.some(function (item) { return item.id === id; })) deleteMedia(id);
    else if (state.games.some(function (item) { return item.id === id; })) deleteGame(id);
  }

  function prepareLibraryImport(app) {
    var target = isLibraryApp(app) && app !== 'media' ? app : 'images';
    var input = $('#mediaInput');
    input.dataset.libraryTarget = target;
    input.accept = target === 'images' ? 'image/*' : target === 'videos' ? 'video/*' : target === 'music' ? 'audio/*' : '.txt,.md,.pdf,.rtf,.csv,.json,.doc,.docx,.odt,.ods,.xls,.xlsx,.ppt,.pptx,text/*,application/pdf,application/rtf,application/json,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    input.click();
  }

  function importMediaFiles(event) {
    var target = event.target.dataset.libraryTarget || 'images';
    var files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    var accepted = files.filter(function (file) {
      if (target === 'images') return String(file.type || '').startsWith('image/');
      if (target === 'videos') return String(file.type || '').startsWith('video/');
      if (target === 'music') return String(file.type || '').startsWith('audio/');
      return target === 'documents';
    });
    if (!accepted.length) return toast('Keine passende Datei', 'Die ausgewählten Dateien passen nicht zu „' + libraryLabel(target) + '“.', '⚠️');

    toast('Import läuft', accepted.length + ' Datei(en) werden dauerhaft im Browser gespeichert.', libraryIcon(target));
    Promise.all(accepted.map(function (file) {
      var type = target === 'videos' ? 'video' : target === 'music' ? 'audio' : target === 'documents' ? 'document' : 'image';
      var item = {
        id: uid('media'),
        name: file.name,
        type: type,
        mime: file.type || (type === 'document' ? 'application/octet-stream' : ''),
        size: file.size,
        modified: new Date(file.lastModified || Date.now()).toISOString(),
        src: '',
        stored: false,
        storage: ''
      };
      return persistImportedFile(item, file).then(function () {
        state.media.push(item);
        return item;
      });
    })).then(function (items) {
      saveState();
      refreshExplorers();
      refreshWindow('settings');
      var permanentCount = items.filter(function (item) { return item.stored; }).length;
      var detail = permanentCount === items.length
        ? items.length + ' Datei(en) bleiben nach dem Neuladen erhalten.'
        : permanentCount + ' von ' + items.length + ' Datei(en) wurden dauerhaft gespeichert.';
      toast(libraryLabel(target) + ' importiert', detail, libraryIcon(target));
    }).catch(function (error) {
      saveState();
      refreshExplorers();
      toast('Import teilweise fehlgeschlagen', error && error.message ? error.message : 'Mindestens eine Datei konnte nicht gespeichert werden.', '⚠️');
    });
  }

  function persistImportedFile(item, file) {
    if (window.PatrickFileStore && typeof window.PatrickFileStore.put === 'function') {
      return window.PatrickFileStore.put(item.id, file, {
        name: item.name,
        mime: item.mime,
        size: item.size,
        modified: item.modified,
        library: item.type
      }).then(function () {
        item.stored = true;
        item.storage = 'indexeddb';
        item.src = '';
        setRuntimeMediaBlob(item.id, file);
      }).catch(function () {
        return fallbackImportedFile(item, file);
      });
    }
    return fallbackImportedFile(item, file);
  }

  function fallbackImportedFile(item, file) {
    return new Promise(function (resolve) {
      if (file.size <= 3.5 * 1024 * 1024) {
        var reader = new FileReader();
        reader.onload = function () {
          item.src = reader.result;
          item.storage = 'localstorage';
          resolve();
        };
        reader.onerror = function () {
          item.src = '';
          item.storage = 'session';
          setRuntimeMediaBlob(item.id, file);
          resolve();
        };
        reader.readAsDataURL(file);
      } else {
        item.storage = 'session';
        setRuntimeMediaBlob(item.id, file);
        resolve();
      }
    });
  }

  function mediaUrlDialog(targetApp) {
    var target = ['images', 'videos', 'music'].indexOf(targetApp) !== -1 ? targetApp : 'images';
    var fields = [
      { name: 'name', label: 'Anzeigename', type: 'text', required: true }
    ];
    if (target === 'videos') fields.push({ name: 'kind', label: 'Videoart', type: 'select', value: 'video', options: [['video', 'Direkte Video-Datei'], ['youtube', 'YouTube-Video']] });
    fields.push({ name: 'url', label: target === 'music' ? 'Audio-Adresse' : target === 'videos' ? 'Video-Adresse' : 'Bild-Adresse', type: 'text', value: 'https://', required: true });
    showDialog({
      icon: libraryIcon(target),
      title: libraryLabel(target) + ' über URL hinzufügen',
      message: target === 'videos' ? 'Füge eine direkte Video-Adresse oder einen YouTube-Link hinzu.' : 'Füge eine direkte HTTP- oder HTTPS-Adresse hinzu.',
      fields: fields,
      confirmText: 'Einbetten'
    }).then(function (result) {
      if (!result) return;
      var name = result.name.trim();
      var address = normalizeHttpAddress(result.url);
      if (!name || !address) return toast('Ungültige Adresse', 'Bitte gib eine gültige HTTP- oder HTTPS-Adresse ein.', '⚠️');
      var type = target === 'music' ? 'audio' : target === 'videos' ? 'video' : 'image';
      var source = address;
      if (target === 'videos' && result.kind === 'youtube') {
        source = youtubeEmbedAddress(address);
        if (!source) return toast('YouTube-Link nicht erkannt', 'Unterstützt werden normale YouTube-, Kurz- und youtu.be-Links.', '⚠️');
        type = 'embed';
      }
      state.media.push({
        id: uid('media'),
        name: name,
        type: type,
        mime: type === 'embed' ? 'text/html' : type === 'video' ? 'video/url' : type === 'audio' ? 'audio/url' : 'image/url',
        size: 0,
        modified: new Date().toISOString(),
        src: source,
        originalUrl: address,
        embedded: true
      });
      saveState(); refreshExplorers(); refreshWindow('settings');
      toast('Hinzugefügt', name, libraryIcon(target));
    });
  }

  function normalizeHttpAddress(value) {
    var address = String(value || '').trim();
    if (!address) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(address)) address = 'https://' + address;
    try {
      var parsed = new URL(address);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch (error) {
      return '';
    }
  }

  function youtubeEmbedAddress(value) {
    var address = normalizeHttpAddress(value);
    if (!address) return '';
    try {
      var parsed = new URL(address);
      var host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      var videoId = '';
      if (host === 'youtu.be') videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
      else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v') || '';
        else {
          var match = parsed.pathname.match(/^\/(?:shorts|embed)\/([^/?#]+)/);
          videoId = match ? match[1] : '';
        }
      }
      return /^[a-z0-9_-]{6,}$/i.test(videoId) ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId) : '';
    } catch (error) {
      return '';
    }
  }

  function openMedia(id) {
    var item = state.media.find(function (media) { return media.id === id; });
    if (!item) return;
    ensurePersistentMediaSource(item).then(function (source) {
      if (!source) {
        toast('Datei nicht verfügbar', item.stored ? 'Die gespeicherte Datei fehlt in der Browser-Datenbank.' : 'Diese Datei war nur für die letzte Sitzung verfügbar.', '⚠️');
        return;
      }
      if (item.type === 'document') {
        downloadBrowserFile(source, item.name || 'Dokument');
        toast('Dokument bereitgestellt', 'Nach dem Download kannst du es mit dem Standardprogramm deines Geräts öffnen.', '📄');
        return;
      }
      openApp('viewer', { mediaId: id });
    }).catch(function () {
      toast('Datei nicht verfügbar', 'Die Datei konnte nicht aus dem Browser-Speicher gelesen werden.', '⚠️');
    });
  }

  function renderMediaViewer(node) {
    var item = state.media.find(function (media) { return media.id === node.dataset.mediaId; });
    var title = item ? item.name : APP_DEFS.viewer.title;
    $('.window-title', node).textContent = title;
    if (!item) {
      return '<div class="media-window-empty"><div><div class="empty-icon">🖼️</div><h3>Medium nicht gefunden</h3><p>Die Datei wurde möglicherweise entfernt.</p></div></div>';
    }
    var source = runtimeMedia.get(item.id) || item.src;
    if (!source && item.stored) {
      ensurePersistentMediaSource(item).then(function (restoredSource) {
        if (restoredSource && openWindows.has('viewer')) refreshWindow('viewer');
      }).catch(function () {});
      return '<div class="media-window-empty"><div><span class="spinner"></span><h3>Datei wird geladen</h3><p>Der Inhalt wird aus der Browser-Datenbank gelesen.</p></div></div>';
    }
    if (!source) {
      return '<div class="media-window-empty"><div><div class="empty-icon">⚠️</div><h3>Datei nicht verfügbar</h3><p>Diese Datei war nur für die letzte Sitzung verfügbar.</p></div></div>';
    }
    var markup = item.type === 'embed'
      ? '<iframe src="' + escapeHtml(source) + '" title="' + escapeHtml(item.name) + '" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
      : item.type === 'video'
        ? '<video src="' + escapeHtml(source) + '" controls autoplay playsinline></video>'
        : item.type === 'audio'
          ? '<div class="media-window-empty"><div><div class="empty-icon">🎵</div><h3>' + escapeHtml(item.name) + '</h3><audio src="' + escapeHtml(source) + '" controls autoplay style="width:min(620px,80vw)"></audio></div></div>'
          : '<img src="' + escapeHtml(source) + '" alt="' + escapeHtml(item.name) + '">';
    return '<div class="media-window-viewer" aria-label="' + escapeHtml(item.name) + '">' + markup + '</div>';
  }

  function deleteMedia(id) {
    var item = state.media.find(function (media) { return media.id === id; });
    if (!item) return;
    showDialog({ icon: '🗑️', title: 'Medium in den Papierkorb?', message: item.name + ' wird aus der Medienbibliothek entfernt und kann im Papierkorb wiederhergestellt werden.', confirmText: 'Verschieben', danger: true }).then(function (result) {
      if (!result) return;
      state.files.push({ id: uid('trash-media'), name: item.name, type: 'media-ref', location: 'trash', deletedFrom: libraryLabel(item.type === 'image' ? 'images' : item.type === 'video' || item.type === 'embed' ? 'videos' : item.type === 'audio' ? 'music' : 'documents'), deletedAt: new Date().toISOString(), size: item.size, mediaSnapshot: item });
      state.media = state.media.filter(function (media) { return media.id !== id; });
      selectedFileId = null; saveState(); refreshExplorers(); toast('In den Papierkorb verschoben', item.name, '🗑️');
    });
  }

  function gameDialog(id) {
    if (detectedGameById(id)) return toast('Automatisch erkannt', 'Lokale Steam-/Xbox-Einträge sind schreibgeschützt.', 'ℹ️');
    var game = state.games.find(function (item) { return item.id === id; });
    showDialog({
      icon: '🎮',
      title: game ? 'Spiel bearbeiten' : 'Spiel hinzufügen',
      message: 'Webseiten können lokale Programme nicht ohne Nachfrage starten. Hinterlege deshalb einen Web-Link oder dokumentiere den lokalen Installationspfad.',
      fields: [
        { name: 'name', label: 'Spielname', type: 'text', value: game ? game.name : '', required: true },
        { name: 'url', label: 'Start-Link (https:// oder benutzerdefiniertes Protokoll)', type: 'url', value: game ? game.url : '' },
        { name: 'path', label: 'Installationspfad (Information)', type: 'text', value: game ? game.path : '' },
        { name: 'icon', label: 'Symbol / Emoji', type: 'text', value: game ? game.icon : '🎮' }
      ],
      confirmText: game ? 'Speichern' : 'Hinzufügen'
    }).then(function (result) {
      if (!result || !result.name.trim()) return;
      if (game) Object.assign(game, result);
      else state.games.push({ id: uid('game'), name: result.name, url: result.url, path: result.path, icon: result.icon || '🎮', lastUsed: '', size: '' });
      saveState(); selectedFileId = null; refreshWindow('games'); refreshWindow('settings');
      toast(game ? 'Spiel aktualisiert' : 'Spiel hinzugefügt', result.name, '🎮');
    });
  }

  function launchGame(id) {
    var game = allGames().find(function (item) { return item.id === id; });
    if (!game) return;
    if (!game.detected) {
      game.lastUsed = new Date().toISOString();
      saveState();
    }
    if (game.url) {
      window.open(game.url, '_blank', 'noopener,noreferrer');
      toast('Spiel wird geöffnet', game.name, '🎮');
    } else {
      if (game.detected && game.deviceSelected) {
        toast('Spiel auf dem Gerät erkannt', 'Webseiten dürfen lokale Programme nicht direkt starten. Freigegebener Ordner: ' + (game.path || game.name), 'ℹ️');
      } else {
        toast(game.detected ? 'Installation erkannt' : 'Kein Start-Link hinterlegt', game.path ? 'Installationspfad: ' + game.path : 'Öffne „Bearbeiten“ und füge einen Start-Link hinzu.', 'ℹ️');
      }
    }
  }

  function deleteGame(id) {
    if (detectedGameById(id)) return toast('Lokales Spiel geschützt', 'Erkannte Installationen werden nur angezeigt und nicht verändert.', 'ℹ️');
    var game = state.games.find(function (item) { return item.id === id; });
    if (!game) return;
    showDialog({ icon: '🗑️', title: 'Spiel entfernen?', message: game.name + ' wird aus der Bibliothek entfernt. Es wird kein lokales Programm deinstalliert.', confirmText: 'Entfernen', danger: true }).then(function (result) {
      if (!result) return;
      state.files.push({ id: uid('trash-game'), name: game.name, type: 'game-ref', location: 'trash', deletedFrom: 'Games', deletedAt: new Date().toISOString(), size: 0, gameSnapshot: game });
      state.games = state.games.filter(function (item) { return item.id !== id; });
      selectedFileId = null; saveState(); refreshExplorers();
    });
  }

  function restoreTrashItem(id) {
    var shortcut = state.trashedShortcuts.find(function (item) { return item.id === id; });
    if (shortcut) {
      state.hiddenApps = state.hiddenApps.filter(function (app) { return app !== shortcut.app; });
      state.trashedShortcuts = state.trashedShortcuts.filter(function (item) { return item.id !== id; });
      selectedFileId = null; saveState(); refreshExplorers(); toast('Wiederhergestellt', shortcut.name + ' ist wieder auf dem Desktop.', '↩'); return;
    }
    var file = state.files.find(function (item) { return item.id === id && item.location === 'trash'; });
    if (!file) return;
    if (file.mediaSnapshot) state.media.push(file.mediaSnapshot);
    else if (file.gameSnapshot) state.games.push(file.gameSnapshot);
    else {
      var restoreLocation = file.deletedFrom || 'desktop';
      var restoreParent = folderById(restoreLocation);
      file.location = restoreLocation === 'desktop' || restoreParent ? restoreLocation : 'desktop';
      delete file.deletedAt; delete file.deletedFrom;
      if (file.location === 'desktop' && !state.desktopPositions[file.id]) state.desktopPositions[file.id] = findFreeDesktopPosition(file.id);
      saveState(); selectedFileId = null; refreshExplorers(); toast('Wiederhergestellt', file.name, '↩'); return;
    }
    state.files = state.files.filter(function (item) { return item.id !== id; });
    selectedFileId = null; saveState(); refreshExplorers(); toast('Wiederhergestellt', file.name, '↩');
  }

  function permanentlyDelete(id) {
    var item = state.files.find(function (file) { return file.id === id; }) || state.trashedShortcuts.find(function (entry) { return entry.id === id; });
    if (!item) return;
    showDialog({ icon: '⚠️', title: 'Endgültig löschen?', message: item.name + ' kann danach nicht wiederhergestellt werden.', confirmText: 'Endgültig löschen', danger: true }).then(function (result) {
      if (!result) return;
      var removeIds = item.type === 'folder' ? descendantFileIds(id) : new Set();
      removeIds.add(id);
      var storedMediaIds = state.files.filter(function (file) { return removeIds.has(file.id) && file.mediaSnapshot && file.mediaSnapshot.id; }).map(function (file) { return file.mediaSnapshot.id; });
      storedMediaIds.forEach(deletePersistentMedia);
      state.files = state.files.filter(function (file) { return !removeIds.has(file.id); });
      state.trashedShortcuts = state.trashedShortcuts.filter(function (entry) { return entry.id !== id; });
      removeIds.forEach(function (fileId) { delete state.desktopPositions[fileId]; });
      selectedFileId = null; saveState(); refreshExplorers(); toast('Endgültig gelöscht', item.name, '✓');
    });
  }

  function emptyTrash() {
    var count = itemCount('trash');
    if (!count) return toast('Papierkorb ist leer', 'Es gibt nichts zu löschen.', '🗑️');
    showDialog({ icon: '⚠️', title: 'Papierkorb leeren?', message: count + ' Element(e) werden endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.', confirmText: 'PAPIERKORB LEEREN', danger: true }).then(function (result) {
      if (!result) return;
      var removeIds = new Set();
      var storedMediaIds = [];
      state.files.filter(function (file) { return file.location === 'trash'; }).forEach(function (file) {
        removeIds.add(file.id);
        if (file.mediaSnapshot && file.mediaSnapshot.id) storedMediaIds.push(file.mediaSnapshot.id);
        if (file.type === 'folder') descendantFileIds(file.id).forEach(function (childId) { removeIds.add(childId); });
      });
      storedMediaIds.forEach(deletePersistentMedia);
      removeIds.forEach(function (fileId) { delete state.desktopPositions[fileId]; });
      state.files = state.files.filter(function (file) { return !removeIds.has(file.id); });
      state.trashedShortcuts = [];
      selectedFileId = null; saveState(); refreshExplorers(); toast('Papierkorb geleert', count + ' Element(e) wurden endgültig gelöscht.', '🗑️');
    });
  }

  function autoEmptyTrash() {
    var days = Number(state.settings.autoEmptyDays || 0);
    if (!days) return;
    var limit = Date.now() - days * 86400000;
    state.files.filter(function (file) {
      return file.location === 'trash' && new Date(file.deletedAt || 0).getTime() <= limit && file.mediaSnapshot && file.mediaSnapshot.id;
    }).forEach(function (file) { deletePersistentMedia(file.mediaSnapshot.id); });
    state.files = state.files.filter(function (file) { return file.location !== 'trash' || new Date(file.deletedAt || 0).getTime() > limit; });
    state.trashedShortcuts = state.trashedShortcuts.filter(function (item) { return new Date(item.deletedAt || 0).getTime() > limit; });
    saveState();
  }

  function sortItems(app) {
    if (isLibraryApp(app)) {
      state.media.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
      if (app === 'documents') state.files.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    }
    else if (app === 'games') state.games.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    else state.files.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    saveState(); refreshWindow(app); toast('Sortiert', 'Nach Name (A–Z)', '↕');
  }

  function renderSettings(section) {
    var actual = section || 'system';
    return '<div class="settings-shell" data-settings-section="' + actual + '"><nav class="settings-nav"><div class="settings-profile-card"><span class="avatar">' + avatarMarkup() + '</span><span><strong>' + escapeHtml(state.profile.username) + '</strong><span>' + escapeHtml(state.profile.email) + '</span></span></div><label class="settings-search"><input type="search" placeholder="Einstellung suchen" aria-label="Einstellung suchen"></label>' +
      settingsNavButton('system', '◈', 'System', actual) +
      settingsNavButton('personalization', '🎨', 'Personalisierung', actual) +
      settingsNavButton('desktop', '🖥️', 'Desktop-Symbole', actual) +
      settingsNavButton('taskbar', '▭', 'Taskleiste & Start', actual) +
      settingsNavButton('profile', '👤', 'Benutzerprofil', actual) +
      settingsNavButton('links', '🌐', 'Webseitenlinks', actual) +
      settingsNavButton('games', '🎮', 'Games', actual) +
      settingsNavButton('media', '🗂️', 'Medien & Dokumente', actual) +
      settingsNavButton('chat', '💬', 'Chat', actual) +
      settingsNavButton('storage', '💾', 'Speicher & Papierkorb', actual) +
      settingsNavButton('privacy', '🔒', 'Datenschutz', actual) +
      settingsNavButton('database', '🗄️', 'Datenbank', actual) +
      settingsNavButton('import', '↕', 'Import & Export', actual) +
      '</nav><section class="settings-content">' + renderSettingsSection(actual) + '</section></div>';
  }

  function settingsNavButton(section, icon, label, active) {
    return '<button class="settings-nav-button' + (section === active ? ' active' : '') + '" type="button" data-action="settings-section" data-section="' + section + '"><span class="settings-nav-icon">' + icon + '</span><span>' + label + '</span></button>';
  }

  function renderSettingsSection(section) {
    if (section === 'personalization') {
      return '<h1>Personalisierung</h1><div class="settings-hero"><div class="wallpaper-preview"></div><div><h2 style="font-size:16px;margin:0 0 7px">Desktop-Vorschau</h2><p class="muted">Samurai-Hintergrund · Dark Mode · Windows-11-Stil</p></div></div>' +
        settingCard('Hintergrundbild', 'Eigenes Bild auswählen oder Original wiederherstellen.', '<button class="button secondary small" type="button" data-action="choose-wallpaper">Durchsuchen</button><button class="button secondary small" type="button" data-action="reset-wallpaper">Original</button>') +
        settingCard('Akzentfarbe', 'Wird für Auswahl, Schalter und aktive Elemente verwendet.', '<input type="color" data-setting="accent" value="' + escapeHtml(state.settings.accent) + '">') +
        settingCard('Dark Mode', 'Die Oberfläche verwendet durchgängig das dunkle Theme.', toggleControl('darkMode', true, true));
    }
    if (section === 'desktop') {
      return '<h1>Desktop-Symbole</h1>' +
        settingCard('Desktop-Symbole anzeigen', 'Alle sichtbaren Verknüpfungen ein- oder ausblenden.', toggleControl('showIcons', state.settings.showIcons !== false)) +
        settingCard('Symbolgröße', 'Größe der Desktop-Symbole anpassen.', '<input type="range" min="32" max="64" step="2" data-setting="iconSize" value="' + Number(state.settings.iconSize) + '"><span>' + Number(state.settings.iconSize) + ' px</span>') +
        settingCard('Desktop-Anordnung', 'Alle Symbole auf die Ausgangspositionen zurücksetzen.', '<button class="button secondary small" type="button" data-action="reset-layout">Zurücksetzen</button>');
    }
    if (section === 'links') {
      return '<h1>Webseitenverlinkungen</h1><p class="muted" style="margin:-15px 0 20px">Diese Links erscheinen im Drop-up-Menü rechts in der Taskleiste.</p>' +
        state.links.map(function (link) { return settingCard((link.icon || '🌐') + '  ' + link.name, link.url, '<button class="button secondary small" type="button" data-action="edit-link" data-link-id="' + link.id + '">Bearbeiten</button><button class="button danger-button small" type="button" data-action="remove-link" data-link-id="' + link.id + '">Entfernen</button>'); }).join('') +
        '<button class="button primary" type="button" data-action="add-link" style="margin-top:10px">Link hinzufügen</button>';
    }
    if (section === 'games') {
      var rootSummary = (localGameScan.roots || []).map(function (root) { return root.label + ': ' + (root.available ? root.count + ' erkannt' : 'nicht erreichbar'); }).join(' · ');
      return '<h1>Games</h1><p class="muted">Nach deiner ausdrücklichen Ordnerfreigabe wird ein Spieleordner auf deinem Endgerät ausschließlich lesend durchsucht.</p>' +
        settingCard(allGames().length + ' Spiele verfügbar', detectedGames.length + ' automatisch erkannt, ' + state.games.length + ' manuell eingetragen.', '<button class="button primary small" type="button" data-app="games">Games öffnen</button>') +
        settingCard('Freigegebene Geräteordner', rootSummary || localGameScan.error || 'Noch kein Ordner freigegeben.', '<button class="button secondary small" type="button" data-action="scan-games">Geräteordner auswählen</button>');
    }
    if (section === 'media') {
      var total = state.media.reduce(function (sum, item) { return sum + Number(item.size || 0); }, 0);
      return '<h1>Medien & Dokumente</h1>' +
        settingCard('Bilder', itemCount('images') + ' Elemente', '<button class="button primary small" type="button" data-app="images">Öffnen</button>') +
        settingCard('Videos', itemCount('videos') + ' Elemente', '<button class="button primary small" type="button" data-app="videos">Öffnen</button>') +
        settingCard('Musik', itemCount('music') + ' Elemente', '<button class="button primary small" type="button" data-app="music">Öffnen</button>') +
        settingCard('Dokumente', itemCount('documents') + ' Elemente', '<button class="button primary small" type="button" data-app="documents">Öffnen</button>') +
        settingCard('Belegter Medien-Speicher', formatBytes(total) + ' lokal gespeicherte oder temporär geladene Daten.', '<span class="muted">Browser-Speicher</span>') +
        settingCard('Ansicht', 'Standardansicht für Bilder, Videos, Musik und Dokumente.', '<select data-setting="mediaView"><option value="grid"' + (state.settings.mediaView === 'grid' ? ' selected' : '') + '>Kacheln / Galerie</option><option value="list"' + (state.settings.mediaView === 'list' ? ' selected' : '') + '>Liste</option></select>');
    }
    if (section === 'profile') {
      return '<h1>Benutzerprofil</h1>' + settingCard(state.profile.username, state.profile.email, '<button class="button primary small" type="button" data-app="profile">Profil bearbeiten</button>');
    }
    if (section === 'chat') {
      return '<h1>Raum-Chat</h1>' +
        settingCard('Echtzeit-Verbindung', chatSession.backend ? 'Browser-Backend mit IndexedDB aktiv.' : 'Browser-Speicher ist aktiv. Daten bleiben auf diesem Gerät und in diesem Browser.', '<span class="' + (chatSession.backend ? 'success' : 'muted') + '">' + (chatSession.backend ? 'Verbunden' : 'Offline') + '</span>') +
        settingCard('Chat öffnen', 'Räume, Benutzerliste, private Nachrichten und Moderation.', '<button class="button primary small" type="button" data-app="chat">Öffnen</button>');
    }
    if (section === 'storage') {
      return '<h1>Speicher & Papierkorb</h1>' +
        settingCard('Papierkorb', itemCount('trash') + ' Element(e)', '<button class="button secondary small" type="button" data-app="trash">Öffnen</button>') +
        settingCard('Automatisch leeren', 'Elemente nach der gewählten Anzahl Tage endgültig löschen.', '<select data-setting="autoEmptyDays"><option value="0"' + (!state.settings.autoEmptyDays ? ' selected' : '') + '>Nie</option><option value="7"' + (Number(state.settings.autoEmptyDays) === 7 ? ' selected' : '') + '>7 Tage</option><option value="30"' + (Number(state.settings.autoEmptyDays) === 30 ? ' selected' : '') + '>30 Tage</option></select>') +
        settingCard('Lokale App-Daten', 'Setzt Dateisystem, Profil und Einstellungen vollständig zurück.', '<button class="button danger-button small" type="button" data-action="clear-local-data">Daten zurücksetzen</button>');
    }
    if (section === 'database') {
      return '<h1>Datenbank</h1>' +
        settingCard('Datenbank-Informationen aktivieren', 'Details bleiben standardmäßig verborgen und werden nur während des Gedrückthaltens sichtbar.', toggleControl('databaseEnabled', !!state.settings.databaseEnabled, false, 'Datenbank-Informationen aktivieren')) +
        (state.settings.databaseEnabled ? protectedSettingsPanel([
          ['Verbindungsstatus', chatSession.backend ? 'Browser-Backend verbunden' : 'Browser-Backend wird initialisiert'],
          ['Datenbanktyp', 'IndexedDB im Browser'],
          ['Speicherort', 'Geschützter Website-Speicher dieses Browsers'],
          ['Struktur', 'Benutzer, Profile, Chat, Medien, Rollen und Moderation']
        ]) : lockedSettingsNotice('Datenbank-Details sind deaktiviert.'));
    }
    if (section === 'privacy') {
      return '<h1>Datenschutz</h1>' +
        settingCard('Datenschutz-Informationen aktivieren', 'Private Angaben bleiben standardmäßig verborgen und werden nur während des Gedrückthaltens sichtbar.', toggleControl('privacyEnabled', !!state.settings.privacyEnabled, false, 'Datenschutz-Informationen aktivieren')) +
        (state.settings.privacyEnabled ? protectedSettingsPanel([
          ['Angemeldetes Profil', chatSession.user ? chatSession.user.username : 'Nicht im Chat angemeldet'],
          ['E-Mail-Adresse', chatSession.user && chatSession.user.email ? chatSession.user.email : 'Keine Chat-E-Mail verfügbar'],
          ['Browser-Speicher', 'Lokaler Speicher dieses Browsers'],
          ['Lokale Inhalte', state.files.length + ' Dateien/Ordner · ' + state.media.length + ' Medien'],
          ['Passwortschutz', 'Nur Passwort-Hash – Klartext wird niemals angezeigt']
        ]) : lockedSettingsNotice('Datenschutz-Details sind deaktiviert.'));
    }
    if (section === 'import') {
      return '<h1>Import & Export</h1>' +
        settingCard('Konfiguration exportieren', 'Einstellungen, Profil, Links, Games und virtuelles Dateisystem sichern.', '<button class="button secondary small" type="button" data-action="export-state">JSON exportieren</button>') +
        settingCard('Konfiguration importieren', 'Eine zuvor exportierte JSON-Datei wiederherstellen.', '<button class="button secondary small" type="button" data-action="import-state">JSON importieren</button>');
    }
    if (section === 'taskbar') {
      return '<h1>Taskleiste & Startmenü</h1>' +
        settingCard('Zentrierte Symbole', 'Die App-Symbole sitzen wie unter Windows 11 in der Mitte.', toggleControl('centerTaskbar', state.settings.centerTaskbar !== false, false, 'Zentrierte Taskleisten-Symbole')) +
        settingCard('Startmenü-Suche', 'Blendet die Suche in Taskleiste und Startmenü ein oder aus.', toggleControl('startSearchEnabled', state.settings.startSearchEnabled !== false, false, 'Startmenü-Suche')) +
        settingCard('Webseiten-Drop-up', 'Der Pfeil rechts öffnet bearbeitbare Schnelllinks.', toggleControl('quickLinksEnabled', state.settings.quickLinksEnabled !== false, false, 'Webseiten-Drop-up')) +
        settingCard('Kompakte Taskleiste', 'Verkleinert die Taskleiste und schafft mehr Platz auf kleinen Bildschirmen.', toggleControl('compactTaskbar', !!state.settings.compactTaskbar, false, 'Kompakte Taskleiste'));
    }
    return '<h1>System</h1>' +
      '<div class="settings-hero"><div class="wallpaper-preview"></div><div><h2 style="margin:0 0 6px;font-size:18px">' + escapeHtml(state.profile.username || 'Patrick') + ' Desktop</h2><p class="muted">Windows-11-Web-Desktop · Version 1.0</p></div></div>' +
      settingCard('Anzeige', window.innerWidth + ' × ' + window.innerHeight + ' Pixel', '<span class="success">Bereit</span>') +
      settingCard('Browser-Speicher', 'Einstellungen und virtuelles Dateisystem werden automatisch gespeichert.', '<span class="success">Aktiv</span>') +
      settingCard('Datenspeicher', chatSession.backend ? 'IndexedDB-Browser-Backend ist aktiv.' : 'Lokaler Browser-Speicher ist aktiv.', '<span class="success">Aktiv</span>');
  }

  function settingCard(title, detail, control) {
    return '<div class="setting-card"><div class="setting-copy"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(detail) + '</span></div><div class="setting-control">' + control + '</div></div>';
  }

  function toggleControl(name, checked, disabled, label) {
    return '<label class="toggle"><input type="checkbox" data-setting="' + name + '" aria-label="' + escapeHtml(label || name) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span></span></label>';
  }

  function lockedSettingsNotice(message) {
    return '<div class="protected-settings locked"><span class="protected-lock">🔒</span><div><strong>Informationen geschützt</strong><p>' + escapeHtml(message) + '</p></div></div>';
  }

  function protectedSettingsPanel(rows) {
    return '<div class="protected-settings" data-sensitive-panel><div class="protected-settings-heading"><div><strong>Sicherheitsrelevante Angaben</strong><p>Nur sichtbar, solange du die Taste gedrückt hältst.</p></div><button class="button secondary hold-reveal-button" type="button" data-sensitive-reveal aria-pressed="false">Gedrückt halten zum Anzeigen</button></div><div class="protected-settings-values">' + rows.map(function (row) {
      return '<div class="protected-settings-row"><span>' + escapeHtml(row[0]) + '</span><strong data-sensitive-value="' + escapeHtml(row[1]) + '">••••••••••••</strong></div>';
    }).join('') + '</div></div>';
  }

  function bindSettings(node) {
    $$('[data-setting]', node).forEach(function (input) {
      input.addEventListener('change', function () {
        var key = input.dataset.setting;
        var value = input.type === 'checkbox' ? input.checked : input.type === 'range' || key === 'autoEmptyDays' ? Number(input.value) : input.value;
        state.settings[key] = value;
        saveState(); applyTheme();
        if (key === 'showIcons' || key === 'iconSize') renderDesktopIcons();
        if (key === 'mediaView') refreshWindow('media');
        toast('Einstellung gespeichert', 'Änderungen bleiben nach dem Neuladen erhalten.', '✓');
        if (input.type === 'range' || ['databaseEnabled', 'privacyEnabled'].indexOf(key) !== -1) refreshWindow('settings');
      });
    });
    var search = $('.settings-search input', node);
    if (search) search.addEventListener('input', function (event) {
      var q = event.target.value.toLowerCase();
      $$('.settings-nav-button', node).forEach(function (button) { button.hidden = q && button.textContent.toLowerCase().indexOf(q) === -1; });
    });
    $$('[data-sensitive-reveal]', node).forEach(function (button) {
      var panel = button.closest('[data-sensitive-panel]');
      function reveal() {
        button.setAttribute('aria-pressed', 'true');
        $$('[data-sensitive-value]', panel).forEach(function (value) { value.textContent = value.dataset.sensitiveValue; });
      }
      function conceal() {
        button.setAttribute('aria-pressed', 'false');
        $$('[data-sensitive-value]', panel).forEach(function (value) { value.textContent = '••••••••••••'; });
      }
      button.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        reveal();
        try { button.setPointerCapture(event.pointerId); } catch (error) {}
      });
      button.addEventListener('pointerup', conceal);
      button.addEventListener('pointercancel', conceal);
      button.addEventListener('lostpointercapture', conceal);
      button.addEventListener('pointerleave', conceal);
      button.addEventListener('keydown', function (event) { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); reveal(); } });
      button.addEventListener('keyup', conceal);
      button.addEventListener('blur', conceal);
    });
  }

  function importWallpaper(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) return toast('Ungültige Datei', 'Bitte wähle ein Bild als Desktophintergrund aus.', '⚠️');
    if (file.size > 25 * 1024 * 1024) return toast('Bild ist zu groß', 'Bitte wähle ein Bild unter 25 MB.', '⚠️');
    toast('Hintergrund wird vorbereitet', file.name, '🖼️');
    optimizeWallpaper(file).then(function (wallpaper) {
      state.settings.wallpaper = wallpaper;
      var stored = saveState();
      applyTheme();
      refreshWindow('settings');
      toast('Hintergrund geändert', stored ? file.name + ' wurde dauerhaft eingestellt.' : file.name + ' ist für diese Sitzung eingestellt.', '🖼️');
    }).catch(function () {
      toast('Hintergrund konnte nicht geladen werden', 'Bitte versuche eine andere Bilddatei.', '⚠️');
    });
  }

  function optimizeWallpaper(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var image = new Image();
        image.onerror = reject;
        image.onload = function () {
          var maxWidth = 2560;
          var maxHeight = 1440;
          var scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          var context = canvas.getContext('2d');
          if (!context) return reject(new Error('Canvas nicht verfügbar'));
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          var result = canvas.toDataURL('image/jpeg', .86);
          if (result.length > 4 * 1024 * 1024) result = canvas.toDataURL('image/jpeg', .7);
          resolve(result);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function resetDesktopLayout() {
    showDialog({ icon: '🖥️', title: 'Desktop-Anordnung zurücksetzen?', message: 'Alle Symbole werden auf ihre ursprünglichen Positionen verschoben. Gelöschte Verknüpfungen bleiben im Papierkorb.', confirmText: 'Zurücksetzen' }).then(function (result) {
      if (!result) return;
      state.desktopPositions = clone(DEFAULT_STATE.desktopPositions);
      saveState(); renderDesktopIcons(); toast('Anordnung zurückgesetzt', 'Die Desktop-Symbole wurden neu ausgerichtet.', '✓');
    });
  }

  function exportState() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'patrick-desktop-sicherung-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    URL.revokeObjectURL(url);
    toast('Sicherung erstellt', 'Die Konfiguration wurde als JSON exportiert.', '💾');
  }

  function importState(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object' || !parsed.settings) throw new Error('Ungültig');
        state = mergeState(clone(DEFAULT_STATE), parsed);
        saveState(); applyTheme(); renderDesktopIcons(); renderStartMenu(); renderQuickLinks(); renderTaskbarPinned(); renderRunningTasks();
        openWindows.forEach(function (_, id) { refreshWindow(id); });
        toast('Sicherung importiert', 'Alle unterstützten Einstellungen wurden wiederhergestellt.', '✓');
      } catch (error) {
        toast('Import fehlgeschlagen', 'Die Datei ist keine gültige Desktop-Sicherung.', '⚠️');
      }
    };
    reader.readAsText(file);
  }

  function clearLocalData() {
    showDialog({ icon: '⚠️', title: 'Alle lokalen Daten zurücksetzen?', message: 'Profil, Einstellungen, Dateien, importierte Medien, Chat-Konten und Nachrichten werden auf den Auslieferungszustand gesetzt.', confirmText: 'Alles zurücksetzen', danger: true }).then(function (result) {
      if (!result) return;
      localStorage.removeItem(STORAGE_KEY);
      runtimeMedia.forEach(function (_, id) { revokeRuntimeMediaUrl(id); });
      var reset = window.PatrickBrowserBackend && typeof window.PatrickBrowserBackend.reset === 'function'
        ? window.PatrickBrowserBackend.reset()
        : window.PatrickFileStore && typeof window.PatrickFileStore.clear === 'function'
          ? window.PatrickFileStore.clear()
          : Promise.resolve();
      Promise.resolve(reset).catch(function () {}).finally(function () { location.reload(); });
    });
  }

  function linkDialog(id) {
    var existing = state.links.find(function (item) { return item.id === id; });
    showDialog({
      icon: '🌐',
      title: existing ? 'Webseitenlink bearbeiten' : 'Webseitenlink hinzufügen',
      message: 'Der Link erscheint mit dem Webseiten-Symbol im Pfeil-nach-oben-Menü der Taskleiste.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', value: existing ? existing.name : '', required: true },
        { name: 'url', label: 'Adresse', type: 'text', value: existing ? existing.url : 'https://', required: true }
      ],
      confirmText: existing ? 'Speichern' : 'Hinzufügen'
    }).then(function (result) {
      if (!result || !result.name.trim() || !result.url.trim()) return;
      var address = normalizeLinkAddress(result.url);
      if (!address) return toast('Ungültige Adresse', 'Bitte gib eine gültige HTTP- oder HTTPS-Adresse ein.', '⚠️');
      if (existing) {
        existing.name = result.name.trim();
        existing.url = address;
      } else {
        state.links.push({ id: uid('link'), name: result.name.trim(), url: address, icon: '🌐' });
      }
      saveState(); renderQuickLinks(); refreshWindow('settings'); toast(existing ? 'Link gespeichert' : 'Link hinzugefügt', result.name.trim(), '🌐');
    });
  }

  function normalizeLinkAddress(value) {
    var address = String(value || '').trim();
    if (!address) return '';
    if (address === 'README.md' || address.indexOf('./') === 0) return address;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(address)) address = 'https://' + address;
    try {
      var parsed = new URL(address);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch (error) {
      return '';
    }
  }

  function removeLink(id) {
    var link = state.links.find(function (item) { return item.id === id; });
    if (!link) return;
    state.links = state.links.filter(function (item) { return item.id !== id; });
    saveState(); renderQuickLinks(); refreshWindow('settings'); toast('Link entfernt', link.name, '✓');
  }

  function avatarMarkup() {
    return state.profile.avatar ? '<img src="' + escapeHtml(state.profile.avatar) + '" alt="">' : escapeHtml((state.profile.username || 'B').charAt(0).toUpperCase());
  }

  function profileCoverMarkup() {
    return state.profile.cover ? '<img src="' + escapeHtml(state.profile.cover) + '" alt="Individuelles Titelbild">' : '';
  }

  function renderProfile(node) {
    var p = state.profile;
    var editing = node && node.dataset.profileEditing === 'true';
    var actions = editing
      ? '<button class="button secondary" type="button" data-profile-action="choose-avatar">Profilbild ändern</button><button class="button secondary" type="button" data-profile-action="choose-cover">Titelbild ändern</button><button class="button primary" type="button" data-profile-action="save">Profil speichern</button>'
      : '<button class="button primary" type="button" data-profile-action="edit">Profil bearbeiten</button>';
    var panels = editing
      ? '<div class="profile-panels"><section class="profile-panel"><h2>Kontakt bearbeiten</h2>' +
        profileField('username', 'Benutzername', p.username, 'text') +
        profileField('email', 'E-Mail-Adresse', p.email, 'email') +
        profileField('phone', 'Telefonnummer', p.phone, 'tel') +
        profileField('website', 'Webseite', p.website, 'url') +
        '</section><section class="profile-panel"><h2>Über mich bearbeiten</h2>' +
        profileField('social', 'Social-Media-Link', p.social, 'url') +
        '<div class="profile-field"><label for="profile-bio">Profiltext</label><textarea id="profile-bio" data-profile="bio">' + escapeHtml(p.bio) + '</textarea></div>' +
        '</section></div>'
      : '<div class="profile-panels profile-view-panels"><section class="profile-panel"><h2>Kontakt</h2>' +
        profileViewField('E-Mail-Adresse', p.email) +
        profileViewField('Telefonnummer', p.phone) +
        profileViewField('Webseite', p.website) +
        '</section><section class="profile-panel"><h2>Über mich</h2>' +
        profileViewField('Social-Media-Link', p.social) +
        profileViewField('Profiltext', p.bio) +
        '</section></div>';
    return '<div class="profile-shell"><div class="profile-cover">' + profileCoverMarkup() + '</div><div class="profile-content"><div class="profile-header"><div class="profile-identity"><span class="avatar">' + avatarMarkup() + '</span><div><h1>' + escapeHtml(p.username) + '</h1><p>' + escapeHtml(p.email) + '</p></div></div><div class="profile-header-actions">' + actions + '</div></div><input id="profile-avatar" type="file" accept="image/*" data-profile-avatar hidden><input id="profile-cover-input" type="file" accept="image/*" data-profile-cover hidden>' + panels + '</div></div>';
  }

  function profileField(name, label, value, type) {
    return '<div class="profile-field"><label for="profile-' + name + '">' + label + '</label><input id="profile-' + name + '" type="' + type + '" data-profile="' + name + '" value="' + escapeHtml(value || '') + '"></div>';
  }

  function profileViewField(label, value) {
    var text = String(value || '').trim();
    return '<div class="profile-view-field' + (text ? '' : ' empty') + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(text || 'Nicht angegeben') + '</strong></div>';
  }

  function bindProfile(node) {
    var avatarInput = $('[data-profile-avatar]', node);
    var coverInput = $('[data-profile-cover]', node);
    if (avatarInput) avatarInput.addEventListener('change', function (event) { importProfileImage(node, event, 'avatar'); });
    if (coverInput) coverInput.addEventListener('change', function (event) { importProfileImage(node, event, 'cover'); });
    $$('[data-profile-action]', node).forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.dataset.profileAction;
        if (action === 'edit') { node.dataset.profileEditing = 'true'; renderWindowBody(node); }
        else if (action === 'choose-avatar' && avatarInput) avatarInput.click();
        else if (action === 'choose-cover' && coverInput) coverInput.click();
        else if (action === 'save') saveProfileFrom(node);
      });
    });
  }

  function importProfileImage(node, event, kind) {
    var input = event.target;
    var file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) return toast('Ungültige Datei', 'Bitte wähle eine Bilddatei aus.', '⚠️');
    var limit = kind === 'cover' ? 3 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > limit) return toast(kind === 'cover' ? 'Titelbild zu groß' : 'Profilbild zu groß', 'Bitte wähle ein Bild unter ' + (kind === 'cover' ? '3 MB' : '2 MB') + '.', '⚠️');
    var reader = new FileReader();
    reader.onload = function () {
      state.profile[kind] = reader.result;
      saveProfileFrom(node, kind === 'cover' ? 'Titelbild aktualisiert' : 'Profilbild aktualisiert', true);
    };
    reader.onerror = function () { toast('Bild konnte nicht geladen werden', file.name, '⚠️'); };
    reader.readAsDataURL(file);
  }

  function saveProfileFrom(node, message, stayEditing) {
    $$('[data-profile]', node).forEach(function (input) { state.profile[input.dataset.profile] = input.value.trim(); });
    if (!state.profile.username) state.profile.username = 'Benutzer';
    node.dataset.profileEditing = stayEditing ? 'true' : 'false';
    saveState(); updateProfileSurfaces(); renderStartMenu(); refreshWindow('profile'); refreshWindow('settings');
    toast('Profil gespeichert', message || 'Deine Profildaten wurden lokal aktualisiert.', '✓');
  }

  function defaultRooms() {
    return [
      { id: 1, name: 'Nachtlounge', description: 'Entspannt unterhalten' },
      { id: 2, name: 'Gaming', description: 'Games und Mitspieler' },
      { id: 3, name: 'Musik', description: 'Tracks und Empfehlungen' },
      { id: 4, name: 'Willkommen', description: 'Neue Mitglieder' }
    ];
  }

  function defaultUsers() {
    return [];
  }

  function renderChat() {
    var room = chatSession.rooms.find(function (item) { return Number(item.id) === Number(state.chat.room); }) || chatSession.rooms[0] || { id: 1, name: 'Nachtlounge', description: '' };
    var messages = chatSession.backend ? chatSession.messages : state.chat.localMessages.filter(function (item) { return Number(item.room) === Number(room.id); });
    var roomDraft = chatDrafts[String(room.id)] || '';
    return '<div class="chat-shell"><header class="chat-topbar"><div class="chat-room-title"><span style="font-size:22px">💬</span><span><strong># ' + escapeHtml(room.name) + '</strong><span>' + escapeHtml(room.description || 'Raum-Chat') + '</span></span></div><div class="chat-account-actions"><span class="connection-pill' + (chatSession.backend ? '' : ' offline') + '">' + (chatSession.backend ? '● Echtzeit' : '● Offline-Demo') + '</span>' + (chatSession.user ? '<button class="button secondary small" type="button" data-action="chat-profile">' + escapeHtml(chatSession.user.username) + ' · Profil</button><button class="button secondary small" type="button" data-action="chat-logout">Abmelden</button>' : '<button class="button secondary small" type="button" data-action="chat-login">Anmelden</button>') + '</div></header>' +
      (!chatSession.user ? '<div class="chat-login-banner"><span>Für den echten Mehrbenutzer-Chat bitte anmelden oder kostenlos registrieren.</span><button class="button primary small" type="button" data-action="chat-register">Registrieren</button></div>' : '') +
      '<div class="chat-grid"><nav class="room-list"><div class="chat-side-heading">Chaträume</div>' + chatSession.rooms.map(function (item) {
        return '<button class="room-button' + (Number(item.id) === Number(room.id) ? ' active' : '') + '" type="button" data-action="chat-room" data-room-id="' + item.id + '"><span class="room-hash">#</span><span><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.description || '') + '</small></span></button>';
      }).join('') + '</nav><section class="chat-center"><div class="message-list"><div class="chat-welcome"><h3>Willkommen in #' + escapeHtml(room.name) + '</h3><p>Öffentlicher Raum-Chat mit Zeitstempeln, Rollen, Benutzerliste, Befehlen und Moderationsschutz. Mit /help siehst du verfügbare Befehle.</p></div>' + messages.map(messageMarkup).join('') + '</div><div class="chat-composer"><div class="composer-box"><button class="icon-button" type="button" data-action="chat-emoji" title="Emoji">😊</button><textarea data-chat-input rows="1" maxlength="1000" placeholder="Nachricht an #' + escapeHtml(room.name) + '" aria-label="Chatnachricht">' + escapeHtml(roomDraft) + '</textarea><button class="send-button" type="button" data-action="chat-send" aria-label="Nachricht senden">' + iconSvg('send') + '</button></div></div></section><aside class="user-list"><div class="chat-side-heading">Online · ' + chatSession.users.length + '</div>' + chatSession.users.map(function (user) {
        return '<button class="user-button" type="button" data-action="chat-user" data-user-id="' + escapeHtml(user.id || '') + '" data-username="' + escapeHtml(user.username) + '">' + chatAvatarMarkup(user, 'user-avatar') + '<span><strong>' + escapeHtml(user.username) + '</strong><small>' + escapeHtml(roleLabel(user.role)) + '</small></span>' + (user.role === 'moderator' || user.role === 'admin' ? '<span class="role-badge">◆</span>' : '') + '</button>';
      }).join('') + '</aside></div>' + (chatProfileState.open ? renderChatProfilePanel() : '') + '</div>';
  }

  function messageMarkup(message) {
    if (message.role === 'system' || message.type === 'system') return '<div class="system-message">◆ ' + escapeHtml(message.body) + ' · ' + formatMessageTime(message.created_at) + '</div>';
    return '<article class="message" data-message-id="' + escapeHtml(message.id) + '">' + chatAvatarMarkup(message, 'message-avatar') + '<div><div class="message-meta"><strong>' + escapeHtml(message.username) + (message.role && message.role !== 'user' ? ' · ' + escapeHtml(roleLabel(message.role)) : '') + '</strong><time>' + formatMessageTime(message.created_at) + '</time></div><div class="message-body">' + formatChatBody(message.body) + '</div></div></article>';
  }

  function chatAvatarMarkup(user, className) {
    var name = String((user && user.username) || '?');
    var path = String((user && user.avatar_path) || '');
    return '<span class="' + className + '">' + (path ? '<img src="' + escapeHtml(path) + '" alt="">' : escapeHtml(name.charAt(0).toUpperCase())) + '</span>';
  }

  function renderChatProfilePanel() {
    var profile = chatProfileState.user;
    var closeButton = '<button class="button secondary" type="button" data-action="chat-profile-close">← Zurück / Schließen</button>';
    if (!profile) {
      return '<section class="chat-profile-panel"><div class="chat-profile-card loading"><span class="spinner"></span><p>Profil wird geladen…</p><div class="chat-profile-actions">' + closeButton + '</div></div></section>';
    }
    var ownProfile = !!(
      chatSession.user &&
      chatSession.user.id != null &&
      profile.id != null &&
      Number(profile.id) === Number(chatSession.user.id)
    );
    var avatar = chatAvatarMarkup(profile, 'chat-profile-avatar');
    var editMarkup = '<form class="chat-profile-form"><div class="chat-profile-fields"><label>Nickname<input name="username" maxlength="24" required value="' + escapeHtml(profile.username || '') + '"></label><label>E-Mail-Adresse<input name="email" type="email" maxlength="190" required value="' + escapeHtml(profile.email || '') + '"></label><label>Telefonnummer<input name="phone" maxlength="40" value="' + escapeHtml(profile.phone || '') + '"></label><label>Webseite<input name="website" type="url" maxlength="300" placeholder="https://" value="' + escapeHtml(profile.website || '') + '"></label><label>Social-Media-Link<input name="social" type="url" maxlength="300" placeholder="https://" value="' + escapeHtml(profile.social || '') + '"></label><label class="wide">Über mich<textarea name="bio" maxlength="500" rows="5">' + escapeHtml(profile.bio || '') + '</textarea></label></div><input class="visually-hidden" type="file" data-chat-avatar-input accept="image/jpeg,image/png,image/gif,image/webp"><div class="chat-profile-actions">' + closeButton + '<button class="button secondary" type="button" data-action="chat-profile-avatar-change">Profilbild ändern</button><span class="action-spacer"></span><button class="button secondary" type="button" data-action="chat-profile-cancel">Bearbeiten abbrechen</button><button class="button primary" type="submit">Profil speichern</button></div></form>';
    var profileAction = ownProfile
      ? '<button class="button primary" type="button" data-action="chat-profile-edit">Profil bearbeiten</button>'
      : '<button class="button primary" type="button" data-action="chat-profile-private" data-username="' + escapeHtml(profile.username) + '">Private Nachricht</button>';
    var viewMarkup = '<div class="chat-profile-details"><div><span>Rolle</span><strong>' + escapeHtml(roleLabel(profile.role)) + '</strong></div>' + (profile.website ? '<div><span>Webseite</span><a href="' + escapeHtml(profile.website) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(profile.website) + '</a></div>' : '') + (profile.social ? '<div><span>Social Media</span><a href="' + escapeHtml(profile.social) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(profile.social) + '</a></div>' : '') + '<div class="wide"><span>Über mich</span><p>' + escapeHtml(profile.bio || 'Noch kein Profiltext vorhanden.') + '</p></div></div><div class="chat-profile-actions">' + closeButton + '<span class="action-spacer"></span>' + profileAction + '</div>';
    return '<section class="chat-profile-panel" aria-label="Chat-Profil"><div class="chat-profile-card"><header><button class="icon-button chat-profile-close" type="button" data-action="chat-profile-close" aria-label="Profil schließen" title="Profil schließen">' + iconSvg('close') + '</button>' + avatar + '<div><h2>' + escapeHtml(profile.username) + '</h2><p>' + escapeHtml(roleLabel(profile.role)) + '</p></div></header>' + (chatProfileState.editing && ownProfile ? editMarkup : viewMarkup) + '</div></section>';
  }

  function formatChatBody(body) {
    var safe = escapeHtml(body);
    safe = safe.replace(/\*\*([^*]{1,120})\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/_([^_]{1,120})_/g, '<em>$1</em>');
    return safe;
  }

  function formatMessageTime(value) {
    var date = new Date(value || Date.now());
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  function roleLabel(role) {
    return { admin: 'Administrator', moderator: 'Moderator', system: 'System', user: 'Mitglied' }[role] || 'Mitglied';
  }

  function bindChat(node) {
    var input = $('[data-chat-input]', node);
    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendChatFrom(node);
        }
      });
      input.addEventListener('input', function () {
        chatDrafts[String(state.chat.room)] = input.value;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      });
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    }
    var list = $('.message-list', node);
    if (list) list.scrollTop = list.scrollHeight;
    var profileForm = $('.chat-profile-form', node);
    if (profileForm) profileForm.addEventListener('submit', function (event) {
      event.preventDefault();
      saveChatProfile(profileForm);
    });
    var avatarInput = $('[data-chat-avatar-input]', node);
    if (avatarInput) avatarInput.addEventListener('change', function () {
      if (avatarInput.files && avatarInput.files[0]) uploadChatAvatar(avatarInput.files[0]);
      avatarInput.value = '';
    });
    node.addEventListener('contextmenu', function (event) {
      var userButton = event.target.closest('[data-username]');
      var message = event.target.closest('[data-message-id]');
      if (!userButton && !message) return;
      event.preventDefault();
      if (userButton) {
        var username = userButton.dataset.username;
        var userId = Number(userButton.dataset.userId || 0);
        var items = [{ icon: 'eye', label: 'Profil ansehen', action: function () { openChatProfile(userId); } }, { icon: 'chat', label: 'Private Nachricht', action: function () { openPrivateChat(username); } }];
        if (chatSession.user && ['moderator', 'admin'].indexOf(chatSession.user.role) !== -1 && userId) {
          items.push({ separator: true });
          ['warn', 'mute', 'kick', 'ban'].forEach(function (action) {
            var labels = { warn: 'Verwarnen', mute: 'Stummschalten', kick: 'Aus Raum entfernen', ban: 'Sperren' };
            items.push({ icon: action === 'warn' ? 'info' : 'trash', label: labels[action], action: function () { moderateUser(userId, username, action); } });
          });
        }
        showContextMenu(event.clientX, event.clientY, items);
      } else {
        var messageId = Number(message.dataset.messageId || 0);
        var messageItems = [{ icon: 'info', label: 'Nachricht melden', action: function () { reportMessage(messageId); } }];
        if (chatSession.user && ['moderator', 'admin'].indexOf(chatSession.user.role) !== -1) {
          messageItems.push({ icon: 'trash', label: 'Nachricht löschen', action: function () { deleteChatMessage(messageId); } });
        }
        showContextMenu(event.clientX, event.clientY, messageItems);
      }
    });
  }

  function sendChatFrom(node) {
    var input = $('[data-chat-input]', node);
    var body = input ? input.value.trim() : '';
    var draftKey = String(state.chat.room);
    if (!body) return;
    if (body.charAt(0) === '/') {
      if (handleChatCommand(body, node)) { input.value = ''; chatDrafts[draftKey] = ''; return; }
    }
    if (chatSession.backend) {
      if (!chatSession.user) return chatAuthDialog('login');
      apiRequest('send', { room_id: state.chat.room, body: body, csrf: chatSession.csrf }).then(function () {
        input.value = '';
        chatDrafts[draftKey] = '';
        pollChat(true);
      }).catch(function (error) { toast('Nachricht nicht gesendet', error.message, '⚠️'); });
    } else {
      state.chat.localMessages.push({ id: uid('msg'), room: state.chat.room, username: state.profile.username || 'Gast', role: 'user', body: body, created_at: new Date().toISOString() });
      saveState(); input.value = ''; chatDrafts[draftKey] = ''; refreshWindow('chat');
    }
  }

  function handleChatCommand(command, node) {
    var parts = command.split(/\s+/);
    var name = parts.shift().toLowerCase();
    if (name === '/help') {
      toast('Chat-Befehle', '/me Text · /clear · /go Raumname · /msg Nick Text', '💬');
      return true;
    }
    if (name === '/clear') {
      if (!chatSession.backend) state.chat.localMessages = state.chat.localMessages.filter(function (message) { return Number(message.room) !== Number(state.chat.room); });
      saveState(); refreshWindow('chat'); return true;
    }
    if (name === '/me') {
      var input = $('[data-chat-input]', node);
      input.value = '_* ' + (state.profile.username || 'Gast') + ' ' + parts.join(' ') + '_';
      return false;
    }
    if (name === '/go') {
      var query = parts.join(' ').toLowerCase();
      var room = chatSession.rooms.find(function (item) { return item.name.toLowerCase() === query; });
      if (room) switchChatRoom(Number(room.id)); else toast('Raum nicht gefunden', query || 'Bitte Raumnamen angeben.', '⚠️');
      return true;
    }
    if (name === '/msg') {
      var user = parts.shift();
      if (!user || !parts.length) toast('Private Nachricht', 'Verwendung: /msg Nick Nachricht', 'ℹ️');
      else toast('Private Nachricht an ' + user, parts.join(' '), '✉');
      return true;
    }
    return false;
  }

  function switchChatRoom(id) {
    state.chat.room = id;
    chatSession.messages = [];
    chatSession.lastId = 0;
    saveState(); refreshWindow('chat');
    if (chatSession.backend) pollChat(true);
  }

  function openPrivateChat(username) {
    if (username === (chatSession.user ? chatSession.user.username : state.profile.username)) return;
    showDialog({ icon: '✉️', title: 'Private Nachricht an ' + username, message: 'Private Unterhaltungen werden im Backend separat und nur für die Beteiligten gespeichert.', fields: [{ name: 'body', label: 'Nachricht', type: 'text', required: true }], confirmText: 'Senden' }).then(function (result) {
      if (!result) return;
      if (chatSession.backend && chatSession.user) {
        apiRequest('private_send', { recipient: username, body: result.body, csrf: chatSession.csrf }).then(function () { toast('Private Nachricht gesendet', username, '✉️'); }).catch(function (error) { toast('Senden fehlgeschlagen', error.message, '⚠️'); });
      } else toast('Offline-Demo', 'Für private Nachrichten bitte den PHP-Server starten und anmelden.', 'ℹ️');
    });
  }

  function openChatProfile(userId) {
    if (!chatSession.backend || !chatSession.user) return chatAuthDialog('login');
    chatProfileState = { open: true, editing: false, user: null };
    refreshWindow('chat');
    var query = userId ? { user_id: userId } : {};
    apiRequest('profile', query, 'GET').then(function (data) {
      chatProfileState.user = data.profile;
      refreshWindow('chat');
    }).catch(function (error) {
      chatProfileState = { open: false, editing: false, user: null };
      refreshWindow('chat');
      toast('Profil nicht verfügbar', error.message, '⚠️');
    });
  }

  function closeChatProfile() {
    chatProfileState = { open: false, editing: false, user: null };
    refreshWindow('chat');
  }

  function saveChatProfile(form) {
    if (!chatProfileState.editing || !chatSession.user) return;
    var values = Object.fromEntries(new FormData(form).entries());
    values.csrf = chatSession.csrf;
    var submit = $('button[type="submit"]', form);
    if (submit) submit.disabled = true;
    apiRequest('profile_update', values).then(function (data) {
      chatSession.user = data.user;
      chatProfileState.user = data.profile;
      chatProfileState.editing = false;
      state.profile.username = data.user.username;
      if (data.user.email) state.profile.email = data.user.email;
      saveState();
      renderStartMenu($('#startSearch').value);
      refreshWindow('chat');
      toast('Profil gespeichert', 'Deine Änderungen sind jetzt im Chat sichtbar.', '✓');
    }).catch(function (error) {
      if (submit) submit.disabled = false;
      toast('Profil nicht gespeichert', error.message, '⚠️');
    });
  }

  function uploadChatAvatar(file) {
    if (!chatProfileState.editing || !chatSession.user || !file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) return toast('Bild nicht unterstützt', 'Erlaubt sind JPG, PNG, GIF und WebP.', '⚠️');
    if (file.size > 5 * 1024 * 1024) return toast('Bild zu groß', 'Das Profilbild darf höchstens 5 MB groß sein.', '⚠️');
    var payload = new FormData();
    payload.append('file', file);
    payload.append('purpose', 'chat-avatar');
    payload.append('csrf', chatSession.csrf);
    fetch('api/upload.php', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' }, body: payload }).then(function (response) {
      return response.json().catch(function () { throw new Error('Ungültige Serverantwort'); }).then(function (data) {
        if (!response.ok || data.ok === false) throw new Error(data.error || 'Upload fehlgeschlagen');
        return data;
      });
    }).then(function (data) {
      chatProfileState.user.avatar_path = data.avatar_path;
      chatSession.user.avatar_path = data.avatar_path;
      refreshWindow('chat');
      toast('Profilbild aktualisiert', 'Das neue Bild ist im Chat sichtbar.', '✓');
    }).catch(function (error) { toast('Profilbild nicht geändert', error.message, '⚠️'); });
  }

  function reportMessage(messageId) {
    if (!chatSession.backend || !chatSession.user) return chatAuthDialog('login');
    showDialog({ icon: '⚑', title: 'Nachricht melden', message: 'Die Meldung wird zur Prüfung gespeichert. Missbrauch der Meldefunktion ist nicht erlaubt.', fields: [{ name: 'reason', label: 'Meldegrund', type: 'text', required: true }], confirmText: 'Melden' }).then(function (result) {
      if (!result) return;
      apiRequest('report', { message_id: messageId, reason: result.reason, csrf: chatSession.csrf }).then(function () { toast('Meldung gesendet', 'Die Nachricht wird geprüft.', '✓'); }).catch(function (error) { toast('Meldung fehlgeschlagen', error.message, '⚠️'); });
    });
  }

  function moderateUser(userId, username, action) {
    var labels = { warn: 'Verwarnen', mute: 'Stummschalten', kick: 'Aus Raum entfernen', ban: 'Sperren' };
    showDialog({ icon: '◆', title: username + ' ' + labels[action].toLowerCase(), message: 'Die Moderationsmaßnahme wird protokolliert.', fields: [{ name: 'reason', label: 'Begründung', type: 'text', required: true }], confirmText: labels[action], danger: action !== 'warn' }).then(function (result) {
      if (!result) return;
      apiRequest('moderate', { target_user_id: userId, room_id: state.chat.room, moderation_action: action, reason: result.reason, csrf: chatSession.csrf }).then(function () { toast('Moderation gespeichert', labels[action] + ': ' + username, '◆'); pollChat(true); }).catch(function (error) { toast('Aktion fehlgeschlagen', error.message, '⚠️'); });
    });
  }

  function deleteChatMessage(messageId) {
    showDialog({ icon: '🗑️', title: 'Nachricht löschen?', message: 'Die Nachricht wird moderativ ausgeblendet. Die Aktion wird protokolliert.', confirmText: 'Löschen', danger: true }).then(function (result) {
      if (!result) return;
      apiRequest('delete_message', { message_id: messageId, room_id: state.chat.room, csrf: chatSession.csrf }).then(function () { toast('Nachricht gelöscht', 'Die Moderationsaktion wurde protokolliert.', '✓'); pollChat(true); }).catch(function (error) { toast('Löschen fehlgeschlagen', error.message, '⚠️'); });
    });
  }

  function chatAuthDialog(mode) {
    var register = mode === 'register';
    var fields = [
      { name: 'username', label: 'Nickname', type: 'text', value: state.profile.username || '', required: true },
      { name: 'password', label: 'Passwort', type: 'password', required: true }
    ];
    if (register) fields.splice(1, 0, { name: 'email', label: 'E-Mail-Adresse', type: 'email', value: state.profile.email || '', required: true });
    showDialog({ icon: register ? '✨' : '🔐', title: register ? 'Chat-Konto erstellen' : 'Im Raum-Chat anmelden', message: chatSession.backend ? 'Die Verbindung ist verschlüsselt, wenn der Server über HTTPS bereitgestellt wird.' : 'Das PHP-Backend ist derzeit nicht erreichbar. Starte scripts/start-server.bat.', fields: fields, confirmText: register ? 'Registrieren' : 'Anmelden' }).then(function (result) {
      if (!result) return;
      if (!chatSession.backend) return toast('Backend nicht erreichbar', 'Starte den lokalen PHP-Server wie in README.md beschrieben.', '⚠️');
      apiRequest(register ? 'register' : 'login', result).then(function (data) {
        chatSession.user = data.user;
        chatSession.csrf = data.csrf;
        chatProfileState = { open: false, editing: false, user: null };
        state.profile.username = data.user.username;
        if (data.user.email) state.profile.email = data.user.email;
        saveState(); renderStartMenu(); refreshWindow('chat'); toast(register ? 'Konto erstellt' : 'Angemeldet', 'Willkommen, ' + data.user.username + '!', '✓');
      }).catch(function (error) { toast(register ? 'Registrierung fehlgeschlagen' : 'Anmeldung fehlgeschlagen', error.message, '⚠️'); });
    });
  }

  function chatLogout() {
    apiRequest('logout', { csrf: chatSession.csrf }).catch(function () {}).finally(function () {
      chatSession.user = null; chatSession.csrf = ''; chatProfileState = { open: false, editing: false, user: null }; refreshWindow('chat'); toast('Abgemeldet', 'Die Chat-Sitzung wurde beendet.', '✓');
    });
  }

  function probeChatBackend() {
    if (location.protocol === 'file:') return;
    apiRequest('session', {}, 'GET').then(function (data) {
      chatSession.backend = true;
      chatSession.user = data.user || null;
      chatSession.csrf = data.csrf || '';
      if (data.rooms && data.rooms.length) chatSession.rooms = data.rooms;
      if (openWindows.has('chat')) refreshWindow('chat');
      if (openWindows.has('settings')) refreshWindow('settings');
    }).catch(function () { chatSession.backend = false; });
  }

  function apiRequest(action, data, method) {
    method = method || 'POST';
    var options = { method: method, credentials: 'same-origin', headers: { 'Accept': 'application/json' } };
    var url = 'api/index.php?action=' + encodeURIComponent(action);
    if (method === 'GET') {
      var params = new URLSearchParams(data || {});
      if (params.toString()) url += '&' + params.toString();
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data || {});
    }
    return fetch(url, options).then(function (response) {
      return response.json().catch(function () { throw new Error('Ungültige Serverantwort'); }).then(function (payload) {
        if (!response.ok || payload.ok === false) throw new Error(payload.error || 'Serverfehler');
        return payload;
      });
    });
  }

  function startChatPolling() {
    stopChatPolling();
    pollChat(true);
    chatPollTimer = window.setInterval(function () { pollChat(false); }, 2200);
  }

  function stopChatPolling() {
    if (chatPollTimer) window.clearInterval(chatPollTimer);
    chatPollTimer = null;
  }

  function pollChat(force) {
    if (!chatSession.backend || chatBusy || !openWindows.has('chat')) return;
    chatBusy = true;
    apiRequest('messages', { room_id: state.chat.room, since: force ? 0 : chatSession.lastId }, 'GET').then(function (data) {
      if (force) chatSession.messages = data.messages || [];
      else (data.messages || []).forEach(function (message) {
        if (!chatSession.messages.some(function (existing) { return Number(existing.id) === Number(message.id); })) chatSession.messages.push(message);
      });
      if (data.users) chatSession.users = data.users;
      if (data.rooms) chatSession.rooms = data.rooms;
      chatSession.lastId = chatSession.messages.reduce(function (max, message) { return Math.max(max, Number(message.id) || 0); }, chatSession.lastId);
      if (!chatProfileState.editing) refreshChatAfterPolling();
    }).catch(function () {
      chatSession.backend = false;
      refreshChatAfterPolling();
    }).finally(function () { chatBusy = false; });
  }

  function refreshChatAfterPolling() {
    var node = openWindows.get('chat');
    if (!node) return;
    var input = $('[data-chat-input]', node);
    var list = $('.message-list', node);
    var draftKey = String(state.chat.room);
    var snapshot = {
      value: input ? input.value : (chatDrafts[draftKey] || ''),
      focused: !!input && document.activeElement === input,
      selectionStart: input && typeof input.selectionStart === 'number' ? input.selectionStart : null,
      selectionEnd: input && typeof input.selectionEnd === 'number' ? input.selectionEnd : null,
      scrollTop: list ? list.scrollTop : 0,
      nearBottom: list ? list.scrollHeight - list.scrollTop - list.clientHeight < 80 : true
    };
    chatDrafts[draftKey] = snapshot.value;
    renderWindowBody(node);
    var nextInput = $('[data-chat-input]', node);
    var nextList = $('.message-list', node);
    if (nextInput) {
      nextInput.value = snapshot.value;
      nextInput.style.height = 'auto';
      nextInput.style.height = Math.min(nextInput.scrollHeight, 100) + 'px';
      if (snapshot.focused) {
        nextInput.focus({ preventScroll: true });
        if (snapshot.selectionStart !== null) {
          try { nextInput.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd); } catch (error) {}
        }
      }
    }
    if (nextList) nextList.scrollTop = snapshot.nearBottom ? nextList.scrollHeight : snapshot.scrollTop;
  }

  function addRecent(app, name, detail) {
    state.recent = state.recent.filter(function (item) { return item.app !== app; });
    state.recent.unshift({ app: app, name: name, detail: detail });
    state.recent = state.recent.slice(0, 6);
    saveState(); renderStartMenu($('#startSearch').value);
  }

  function desktopContextItems() {
    return [
      { icon: 'eye', label: 'Ansicht', action: function () { openApp('settings', { section: 'desktop' }); } },
      { icon: 'sort', label: 'Sortieren nach Name', action: sortDesktopIcons },
      { separator: true },
      { icon: 'refresh', label: 'Aktualisieren', shortcut: 'F5', action: function () { renderDesktopIcons(); toast('Desktop aktualisiert', 'Alle Symbole wurden neu gezeichnet.', '↻'); } },
      { separator: true },
      { icon: 'plus', label: 'Neuer Ordner', action: function () { createItemDialog('folder'); } },
      { icon: 'edit', label: 'Neue Textdatei', action: function () { createItemDialog('text'); } },
      { icon: 'settings', label: 'Anzeigeeinstellungen', action: function () { openApp('settings', { section: 'system' }); } },
      { icon: 'edit', label: 'Personalisieren', action: function () { openApp('settings', { section: 'personalization' }); } }
    ];
  }

  function iconContextItems(id) {
    var items = [
      { icon: 'eye', label: 'Öffnen', action: function () { openApp(id); } },
      { icon: 'link', label: 'An Start anheften', action: function () { toast('Bereits angeheftet', APP_DEFS[id].name + ' ist im Startmenü vorhanden.', '✓'); } },
      { icon: 'link', label: 'An Taskleiste anheften', action: function () { pinTaskbarItem(id); } },
      { separator: true }
    ];
    if (id === 'trash') items.push({ icon: 'trash', label: 'Papierkorb leeren', disabled: itemCount('trash') === 0, action: emptyTrash });
    else items.push({ icon: 'trash', label: 'In den Papierkorb verschieben', action: function () { trashDesktopShortcut(id); } });
    items.push({ icon: 'info', label: 'Eigenschaften', shortcut: 'Alt+Enter', action: function () { showDialog({ icon: APP_DEFS[id].icon, title: APP_DEFS[id].name + ' - Eigenschaften', message: 'Typ: Desktop-Verknüpfung\\nOrt: Virtueller Desktop\\nStatus: ' + (openWindows.has(id) ? 'Geöffnet' : 'Bereit'), confirmText: 'OK', hideCancel: true }); } });
    return items;
  }

  function fileContextItems(type, id) {
    if (type === 'trash') return [
      { icon: 'restore', label: 'Wiederherstellen', action: function () { restoreTrashItem(id); } },
      { icon: 'trash', label: 'Endgültig löschen', action: function () { permanentlyDelete(id); } },
      { separator: true },
      { icon: 'info', label: 'Eigenschaften', action: function () { toast('Papierkorb-Element', 'Gelöschtes Element · ' + id, 'ℹ️'); } }
    ];
    if (type === 'game' && detectedGameById(id)) return [
      { icon: 'eye', label: 'Starten / Anzeigen', action: function () { launchGame(id); } },
      { icon: 'refresh', label: 'PC erneut durchsuchen', action: function () { scanLocalGames(true); } },
      { separator: true },
      { icon: 'info', label: 'Eigenschaften', action: function () { itemProperties(type, id); } }
    ];
    return [
      { icon: 'eye', label: 'Öffnen', action: function () { if (type === 'media') openMedia(id); else if (type === 'game') launchGame(id); else openVirtualFile(id); } },
      ...(type === 'file' ? [{ icon: 'link', label: 'An Taskleiste anheften', action: function () { pinTaskbarItem(id); } }] : []),
      { separator: true },
      { icon: 'copy', label: 'Kopieren', shortcut: 'Strg+C', action: function () { navigator.clipboard && navigator.clipboard.writeText(id); toast('Kopiert', 'Elementreferenz wurde kopiert.', '✓'); } },
      { icon: 'edit', label: type === 'game' ? 'Bearbeiten' : 'Umbenennen', shortcut: 'F2', action: function () { renameItem(type, id); } },
      { icon: 'trash', label: 'In den Papierkorb', shortcut: 'Entf', action: function () { if (type === 'media') deleteMedia(id); else if (type === 'game') deleteGame(id); else moveFileToTrash(id); } },
      { separator: true },
      { icon: 'info', label: 'Eigenschaften', action: function () { itemProperties(type, id); } }
    ];
  }

  function renameItem(type, id) {
    if (type === 'game') return gameDialog(id);
    var collection = type === 'media' ? state.media : state.files;
    var item = collection.find(function (entry) { return entry.id === id; });
    if (!item) return;
    showDialog({ icon: '✏️', title: 'Umbenennen', message: 'Gib einen neuen Namen ein.', fields: [{ name: 'name', label: 'Name', type: 'text', value: item.name, required: true }], confirmText: 'Speichern' }).then(function (result) {
      if (!result || !result.name.trim()) return;
      item.name = result.name.trim(); item.modified = new Date().toISOString(); saveState(); refreshExplorers(); toast('Umbenannt', item.name, '✓');
    });
  }

  function itemProperties(type, id) {
    var item = type === 'media' ? state.media.find(function (entry) { return entry.id === id; }) : type === 'game' ? allGames().find(function (entry) { return entry.id === id; }) : state.files.find(function (entry) { return entry.id === id; });
    if (!item) return;
    var sizeText = typeof item.size === 'number' ? formatBytes(item.size) : (item.size || 'Unbekannt');
    var details = 'Typ: ' + (item.mime || item.type || 'Spiel') + '\\nGröße: ' + sizeText + '\\nGeändert: ' + formatDate(item.modified || item.lastUsed, true);
    if (type === 'game') details += '\\nQuelle: ' + (item.detected ? (item.source === 'steam' ? 'Steam (automatisch erkannt)' : 'Xbox (automatisch erkannt)') : 'Manueller Eintrag') + '\\nInstallationspfad: ' + (item.path || 'Nicht hinterlegt');
    showDialog({ icon: type === 'media' ? '🖼️' : type === 'game' ? '🎮' : '📄', title: item.name + ' - Eigenschaften', message: details, confirmText: 'OK', hideCancel: true });
  }

  function sortDesktopIcons() {
    var metrics = desktopIconMetrics();
    var rowsPerColumn = desktopRowsPerColumn(metrics);
    var items = Object.keys(APP_DEFS).filter(function (id) {
      return id !== 'links' && !APP_DEFS[id].internal && state.hiddenApps.indexOf(id) === -1;
    }).map(function (id) { return { id: id, name: APP_DEFS[id].name }; }).concat(state.files.filter(function (file) {
      return file.location === 'desktop';
    }).map(function (file) { return { id: file.id, name: file.name }; }));
    items.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); }).forEach(function (item, index) {
      state.desktopPositions[item.id] = { x: 18 + Math.floor(index / rowsPerColumn) * metrics.columnStep, y: 18 + (index % rowsPerColumn) * metrics.rowStep };
    });
    saveState(); renderDesktopIcons(); toast('Desktop sortiert', 'Symbole wurden alphabetisch angeordnet.', '↕');
  }

  function showContextMenu(x, y, items) {
    var menu = $('#contextMenu');
    menu.innerHTML = items.map(function (item, index) {
      if (item.separator) return '<div class="context-menu-separator"></div>';
      return '<button class="context-menu-item" type="button" role="menuitem" data-menu-index="' + index + '"' + (item.disabled ? ' disabled' : '') + '><span class="ui-icon" data-icon="' + (item.icon || 'info') + '"></span><span>' + escapeHtml(item.label) + '</span><span class="context-menu-shortcut">' + escapeHtml(item.shortcut || '') + '</span></button>';
    }).join('');
    hydrateIcons(menu);
    menu.style.left = Math.min(x, window.innerWidth - 248) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - menu.offsetHeight - 54) + 'px';
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    menu.onclick = function (event) {
      var button = event.target.closest('[data-menu-index]');
      if (!button) return;
      var item = items[Number(button.dataset.menuIndex)];
      hideContextMenu();
      if (item && item.action) item.action();
    };
  }

  function hideContextMenu() {
    var menu = $('#contextMenu');
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  }

  function showDialog(options) {
    options = options || {};
    var dialog = $('#appDialog');
    $('#dialogIcon').textContent = options.icon || 'ℹ️';
    $('#dialogTitle').textContent = options.title || 'Bestätigen';
    $('#dialogMessage').textContent = options.message || '';
    $('#dialogConfirm').textContent = options.confirmText || 'Bestätigen';
    $('#dialogConfirm').className = 'button ' + (options.danger ? 'danger-button' : 'primary');
    $('#dialogCancel').hidden = !!options.hideCancel;
    $('#dialogFields').innerHTML = (options.fields || []).map(function (field) {
      var input;
      if (field.type === 'select') {
        input = '<select name="' + escapeHtml(field.name) + '">' + (field.options || []).map(function (option) { return '<option value="' + escapeHtml(option[0]) + '"' + (String(option[0]) === String(field.value || '') ? ' selected' : '') + '>' + escapeHtml(option[1]) + '</option>'; }).join('') + '</select>';
      } else {
        input = '<input name="' + escapeHtml(field.name) + '" type="' + escapeHtml(field.type || 'text') + '" value="' + escapeHtml(field.value || '') + '"' + (field.required ? ' required' : '') + ' autocomplete="off">';
      }
      return '<div class="dialog-field"><label>' + escapeHtml(field.label) + '</label>' + input + '</div>';
    }).join('');
    if (dialog.open) dialog.close('cancel');
    dialog.returnValue = '';
    dialog.showModal();
    var first = $('input, select', $('#dialogFields'));
    if (first) window.setTimeout(function () { first.focus(); if (first.select) first.select(); }, 30);
    return new Promise(function (resolve) {
      dialog.addEventListener('close', function done() {
        dialog.removeEventListener('close', done);
        if (dialog.returnValue !== 'confirm') return resolve(null);
        var data = {};
        new FormData(dialog.querySelector('form')).forEach(function (value, key) { data[key] = String(value); });
        resolve(data);
      });
    });
  }

  function toast(title, message, icon) {
    var node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = '<span class="toast-icon">' + escapeHtml(icon || 'ℹ️') + '</span><span><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(message || '') + '</span></span>';
    $('#toastStack').appendChild(node);
    window.setTimeout(function () { node.classList.add('hide'); window.setTimeout(function () { node.remove(); }, 220); }, 3600);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
