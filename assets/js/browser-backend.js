(function () {
  'use strict';

  var DATABASE_NAME = 'patrick-desktop-github-pages';
  var DATABASE_VERSION = 3;
  var STORE_NAME = 'documents';
  var FILE_STORE_NAME = 'file-blobs';
  var DATABASE_KEY = 'main';
  var SESSION_KEY = 'patrick-desktop-browser-session';
  var CSRF_KEY = 'patrick-desktop-browser-csrf';
  var originalFetch = window.fetch.bind(window);
  var writeQueue = Promise.resolve();

  function nowIso() {
    return new Date().toISOString();
  }

  function randomHex(bytes) {
    var values = new Uint8Array(bytes || 16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(values);
    else for (var index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256);
    return Array.from(values).map(function (value) { return value.toString(16).padStart(2, '0'); }).join('');
  }

  function initialDatabase() {
    return {
      version: 2,
      counters: { user: 2, message: 2, privateMessage: 1, report: 1, moderation: 1 },
      rooms: [
        { id: 1, name: 'Nachtlounge', description: 'Entspannt unterhalten' },
        { id: 2, name: 'Gaming', description: 'Games und Mitspieler' },
        { id: 3, name: 'Musik', description: 'Tracks und Empfehlungen' },
        { id: 4, name: 'Willkommen', description: 'Neue Mitglieder' }
      ],
      users: [
        seedUser(1, 'System', 'system', 'online')
      ],
      messages: [
        { id: 1, room_id: 1, user_id: 1, type: 'system', body: 'Willkommen in der Nachtlounge. Registrierte Mitglieder erscheinen automatisch in der Benutzerliste.', created_at: nowIso(), deleted_at: null }
      ],
      privateMessages: [],
      reports: [],
      moderationActions: []
    };
  }

  function seedUser(id, username, role, onlineStatus) {
    return {
      id: id,
      username: username,
      email: '',
      password_hash: '',
      password_salt: '',
      role: role,
      status: 'active',
      avatar_path: '',
      phone: '',
      website: '',
      social: '',
      bio: role === 'system' ? 'Automatischer Systembenutzer.' : '',
      online_status: onlineStatus || 'away',
      created_at: nowIso(),
      last_seen_at: nowIso(),
      local_account: false
    };
  }

  function migrateDatabase(data) {
    if (!data || typeof data !== 'object') data = initialDatabase();
    data.users = Array.isArray(data.users) ? data.users : [];
    data.messages = Array.isArray(data.messages) ? data.messages : [];
    data.privateMessages = Array.isArray(data.privateMessages) ? data.privateMessages : [];
    data.reports = Array.isArray(data.reports) ? data.reports : [];
    data.moderationActions = Array.isArray(data.moderationActions) ? data.moderationActions : [];
    data.rooms = Array.isArray(data.rooms) && data.rooms.length ? data.rooms : initialDatabase().rooms;
    data.counters = data.counters || {};

    var demoNames = ['Luna', 'Ryu', 'James', 'Akira'];
    var removedIds = data.users.filter(function (user) {
      return demoNames.indexOf(String(user.username || '')) !== -1 && user.local_account === false;
    }).map(function (user) { return Number(user.id); });

    data.users = data.users.filter(function (user) {
      return removedIds.indexOf(Number(user.id)) === -1;
    });
    data.messages = data.messages.filter(function (message) {
      return removedIds.indexOf(Number(message.user_id)) === -1;
    });

    var system = data.users.find(function (user) { return user.username === 'System' && user.role === 'system'; });
    if (!system) {
      var nextSystemId = Math.max(0, ...data.users.map(function (user) { return Number(user.id) || 0; })) + 1;
      system = seedUser(nextSystemId, 'System', 'system', 'online');
      data.users.push(system);
    }
    if (!data.messages.some(function (message) { return message.type === 'system'; })) {
      data.messages.push({
        id: Math.max(0, ...data.messages.map(function (message) { return Number(message.id) || 0; })) + 1,
        room_id: 1,
        user_id: system.id,
        type: 'system',
        body: 'Willkommen in der Nachtlounge. Registrierte Mitglieder erscheinen automatisch in der Benutzerliste.',
        created_at: nowIso(),
        deleted_at: null
      });
    }

    data.counters.user = Math.max(Number(data.counters.user || 1), Math.max(0, ...data.users.map(function (user) { return Number(user.id) || 0; })) + 1);
    data.counters.message = Math.max(Number(data.counters.message || 1), Math.max(0, ...data.messages.map(function (message) { return Number(message.id) || 0; })) + 1);
    data.version = 2;
    return data;
  }

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('IndexedDB wird von diesem Browser nicht unterstützt.'));
      var request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = function () {
        var database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
        if (!database.objectStoreNames.contains(FILE_STORE_NAME)) database.createObjectStore(FILE_STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('Browser-Datenbank konnte nicht geöffnet werden.')); };
    });
  }

  function readDatabase() {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction = database.transaction(STORE_NAME, 'readonly');
        var request = transaction.objectStore(STORE_NAME).get(DATABASE_KEY);
        request.onsuccess = function () { resolve(migrateDatabase(request.result || initialDatabase())); };
        request.onerror = function () { reject(request.error || new Error('Browser-Datenbank konnte nicht gelesen werden.')); };
        transaction.oncomplete = function () { database.close(); };
      });
    });
  }

  function storeDatabase(data) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(data, DATABASE_KEY);
        transaction.oncomplete = function () { database.close(); resolve(); };
        transaction.onerror = function () { database.close(); reject(transaction.error || new Error('Browser-Datenbank konnte nicht gespeichert werden.')); };
        transaction.onabort = transaction.onerror;
      });
    });
  }

  function updateDatabase(mutator) {
    var operation = function () {
      return readDatabase().then(function (data) {
        return Promise.resolve(mutator(data)).then(function (result) {
          return storeDatabase(data).then(function () { return result; });
        });
      });
    };
    writeQueue = writeQueue.then(operation, operation);
    return writeQueue;
  }

  function currentSessionId() {
    return Number(localStorage.getItem(SESSION_KEY) || 0);
  }

  function setSession(userId) {
    if (userId) localStorage.setItem(SESSION_KEY, String(userId));
    else localStorage.removeItem(SESSION_KEY);
    sessionStorage.setItem(CSRF_KEY, randomHex(32));
  }

  function csrfToken() {
    var token = sessionStorage.getItem(CSRF_KEY);
    if (!token) {
      token = randomHex(32);
      sessionStorage.setItem(CSRF_KEY, token);
    }
    return token;
  }

  function publicUser(user, includePrivate) {
    if (!user) return null;
    var result = {
      id: user.id,
      username: user.username,
      status: user.status || 'active',
      role: user.role || 'user',
      avatar_path: user.avatar_path || '',
      website: user.website || '',
      social: user.social || '',
      bio: user.bio || '',
      online_status: user.online_status || 'away'
    };
    if (includePrivate) {
      result.email = user.email || '';
      result.phone = user.phone || '';
    }
    return result;
  }

  function currentUser(data) {
    var id = currentSessionId();
    if (!id) return null;
    var user = data.users.find(function (entry) { return Number(entry.id) === id; });
    if (!user || user.status === 'banned' || user.status === 'suspended') return null;
    user.last_seen_at = nowIso();
    user.online_status = 'online';
    return user;
  }

  function visibleUsers(data) {
    return data.users.filter(function (user) {
      return user.status !== 'banned' && user.status !== 'suspended' && user.username !== 'System';
    }).map(function (user) { return publicUser(user, false); });
  }

  function findUserByIdentity(data, identity) {
    var needle = String(identity || '').trim().toLowerCase();
    return data.users.find(function (user) {
      return String(user.username || '').toLowerCase() === needle || String(user.email || '').toLowerCase() === needle;
    });
  }

  function requireUser(data) {
    var user = currentUser(data);
    if (!user) throw apiError('Bitte melde dich zuerst an.', 401);
    return user;
  }

  function requireModerator(data) {
    var user = requireUser(data);
    if (['moderator', 'admin'].indexOf(user.role) === -1) throw apiError('Dafür werden Moderationsrechte benötigt.', 403);
    return user;
  }

  function requireCsrf(payload) {
    if (!payload || payload.csrf !== csrfToken()) throw apiError('Die Sicherheitsprüfung ist abgelaufen. Bitte lade die Seite neu.', 419);
  }

  function apiError(message, status) {
    var error = new Error(message);
    error.status = status || 400;
    return error;
  }

  function jsonResponse(payload, status) {
    return new Response(JSON.stringify(payload), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  function nextId(data, key) {
    var value = Number(data.counters[key] || 1);
    data.counters[key] = value + 1;
    return value;
  }

  function bytesToHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(function (value) { return value.toString(16).padStart(2, '0'); }).join('');
  }

  function passwordHash(password, salt) {
    var source = new TextEncoder().encode(String(salt) + ':' + String(password));
    if (window.crypto && window.crypto.subtle) {
      return window.crypto.subtle.digest('SHA-256', source).then(bytesToHex);
    }
    var fallback = '';
    source.forEach(function (value) { fallback += String.fromCharCode(value); });
    return Promise.resolve(btoa(fallback));
  }

  function validUsername(username) {
    return /^[\p{L}\p{N}_\- ]{3,24}$/u.test(String(username || ''));
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '')) && String(email).length <= 190;
  }

  function parseRequestBody(init) {
    var body = init && init.body;
    if (!body) return Promise.resolve({});
    if (body instanceof FormData) {
      var values = {};
      body.forEach(function (value, key) { values[key] = value; });
      return Promise.resolve(values);
    }
    if (typeof body === 'string') {
      try { return Promise.resolve(JSON.parse(body)); }
      catch (error) { return Promise.resolve({}); }
    }
    return Promise.resolve(body || {});
  }

  function messageView(data, message) {
    var user = data.users.find(function (entry) { return Number(entry.id) === Number(message.user_id); }) || seedUser(0, 'System', 'system', 'online');
    return {
      id: message.id,
      room_id: message.room_id,
      type: message.type || 'message',
      body: message.body,
      created_at: message.created_at,
      username: user.username || 'System',
      role: user.role || 'system',
      avatar_path: user.avatar_path || ''
    };
  }

  function handleApiAction(action, payload, url) {
    if (action === 'session') {
      return updateDatabase(function (data) {
        var user = currentUser(data);
        return { ok: true, user: publicUser(user, true), csrf: csrfToken(), rooms: data.rooms };
      });
    }

    if (action === 'register') {
      return parseRegister(payload).then(function (clean) {
        return passwordHash(clean.password, clean.salt).then(function (hash) {
          return updateDatabase(function (data) {
            if (findUserByIdentity(data, clean.username) || findUserByIdentity(data, clean.email)) throw apiError('Nickname oder E-Mail-Adresse wird bereits verwendet.', 409);
            var hasLocalAccount = data.users.some(function (user) { return user.local_account; });
            var user = {
              id: nextId(data, 'user'), username: clean.username, email: clean.email,
              password_hash: hash, password_salt: clean.salt, role: hasLocalAccount ? 'user' : 'admin', status: 'active',
              avatar_path: '', phone: '', website: '', social: '', bio: '', online_status: 'online',
              created_at: nowIso(), last_seen_at: nowIso(), local_account: true
            };
            data.users.push(user);
            setSession(user.id);
            return { ok: true, user: publicUser(user, true), csrf: csrfToken() };
          });
        });
      });
    }

    if (action === 'login') {
      return readDatabase().then(function (data) {
        var user = findUserByIdentity(data, payload.username);
        if (!user || !user.local_account) throw apiError('Nickname/E-Mail oder Passwort ist falsch.', 401);
        if (user.status === 'banned' || user.status === 'suspended') throw apiError('Dieses Konto ist derzeit gesperrt.', 403);
        return passwordHash(payload.password || '', user.password_salt).then(function (hash) {
          if (hash !== user.password_hash) throw apiError('Nickname/E-Mail oder Passwort ist falsch.', 401);
          setSession(user.id);
          return updateDatabase(function (fresh) {
            var stored = fresh.users.find(function (entry) { return Number(entry.id) === Number(user.id); });
            stored.last_seen_at = nowIso(); stored.online_status = 'online';
            return { ok: true, user: publicUser(stored, true), csrf: csrfToken() };
          });
        });
      });
    }

    if (action === 'logout') {
      setSession(0);
      return Promise.resolve({ ok: true });
    }

    if (action === 'messages') {
      return updateDatabase(function (data) {
        currentUser(data);
        var roomId = Math.max(1, Number(url.searchParams.get('room_id') || payload.room_id || 1));
        var since = Math.max(0, Number(url.searchParams.get('since') || payload.since || 0));
        var messages = data.messages.filter(function (message) {
          return Number(message.room_id) === roomId && Number(message.id) > since && !message.deleted_at;
        }).slice(-200).map(function (message) { return messageView(data, message); });
        return { ok: true, messages: messages, users: visibleUsers(data), rooms: data.rooms };
      });
    }

    if (action === 'send') {
      return updateDatabase(function (data) {
        var user = requireUser(data); requireCsrf(payload);
        if (user.status !== 'active') throw apiError('Du kannst aktuell keine öffentlichen Nachrichten senden.', 403);
        var body = String(payload.body || '').trim();
        if (!body) throw apiError('Die Nachricht ist leer.', 422);
        if (body.length > 1000) throw apiError('Die Nachricht darf höchstens 1000 Zeichen enthalten.', 422);
        var message = { id: nextId(data, 'message'), room_id: Math.max(1, Number(payload.room_id || 1)), user_id: user.id, type: 'message', body: body, created_at: nowIso(), deleted_at: null };
        data.messages.push(message);
        return { ok: true, message_id: message.id };
      });
    }

    if (action === 'private_send') {
      return updateDatabase(function (data) {
        var user = requireUser(data); requireCsrf(payload);
        var recipient = findUserByIdentity(data, payload.recipient);
        var body = String(payload.body || '').trim();
        if (!recipient) throw apiError('Dieses Mitglied wurde nicht gefunden.', 404);
        if (recipient.id === user.id) throw apiError('Du kannst dir nicht selbst schreiben.', 422);
        if (!body || body.length > 1000) throw apiError('Private Nachrichten müssen 1 bis 1000 Zeichen enthalten.', 422);
        var id = nextId(data, 'privateMessage');
        data.privateMessages.push({ id: id, sender_user_id: user.id, recipient_user_id: recipient.id, body: body, created_at: nowIso() });
        return { ok: true, message_id: id };
      });
    }

    if (action === 'report') {
      return updateDatabase(function (data) {
        var user = requireUser(data); requireCsrf(payload);
        var target = data.messages.find(function (message) { return Number(message.id) === Number(payload.message_id) && !message.deleted_at; });
        var reason = String(payload.reason || '').trim();
        if (!target) throw apiError('Die gemeldete Nachricht wurde nicht gefunden.', 404);
        if (reason.length < 5 || reason.length > 500) throw apiError('Bitte beschreibe den Meldegrund in 5 bis 500 Zeichen.', 422);
        var id = nextId(data, 'report');
        data.reports.push({ id: id, reporter_user_id: user.id, reported_user_id: target.user_id, message_id: target.id, reason: reason, created_at: nowIso() });
        return { ok: true, report_id: id };
      });
    }

    if (action === 'moderate') {
      return updateDatabase(function (data) {
        var moderator = requireModerator(data); requireCsrf(payload);
        var target = data.users.find(function (user) { return Number(user.id) === Number(payload.target_user_id); });
        var moderationAction = String(payload.moderation_action || '');
        if (!target) throw apiError('Dieses Mitglied wurde nicht gefunden.', 404);
        if (target.id === moderator.id) throw apiError('Du kannst dich nicht selbst moderieren.', 422);
        if (['warn', 'mute', 'kick', 'suspend', 'ban'].indexOf(moderationAction) === -1) throw apiError('Unbekannte Moderationsaktion.', 422);
        if (moderationAction === 'mute') target.status = 'muted';
        if (moderationAction === 'suspend') target.status = 'suspended';
        if (moderationAction === 'ban') target.status = 'banned';
        var id = nextId(data, 'moderation');
        data.moderationActions.push({ id: id, moderator_user_id: moderator.id, target_user_id: target.id, room_id: Number(payload.room_id || 0), action_type: moderationAction, reason: String(payload.reason || ''), created_at: nowIso() });
        return { ok: true, action_id: id };
      });
    }

    if (action === 'delete_message') {
      return updateDatabase(function (data) {
        var moderator = requireModerator(data); requireCsrf(payload);
        var target = data.messages.find(function (message) { return Number(message.id) === Number(payload.message_id) && Number(message.room_id) === Number(payload.room_id) && !message.deleted_at; });
        if (!target) throw apiError('Die Nachricht wurde nicht gefunden oder ist bereits gelöscht.', 404);
        target.deleted_at = nowIso();
        data.moderationActions.push({ id: nextId(data, 'moderation'), moderator_user_id: moderator.id, target_user_id: target.user_id, room_id: target.room_id, action_type: 'delete_message', reason: 'Nachricht #' + target.id + ' lokal ausgeblendet', created_at: nowIso() });
        return { ok: true };
      });
    }

    if (action === 'profile') {
      return updateDatabase(function (data) {
        var viewer = requireUser(data);
        var requestedId = Number(url.searchParams.get('user_id') || payload.user_id || viewer.id);
        var target = data.users.find(function (user) { return Number(user.id) === requestedId && user.status !== 'banned' && user.status !== 'suspended'; });
        if (!target) throw apiError('Dieses Profil wurde nicht gefunden.', 404);
        return { ok: true, profile: publicUser(target, target.id === viewer.id) };
      });
    }

    if (action === 'profile_update') {
      return updateDatabase(function (data) {
        var user = requireUser(data); requireCsrf(payload);
        var username = String(payload.username || '').trim();
        var email = String(payload.email || '').trim();
        if (!validUsername(username)) throw apiError('Der Nickname muss 3 bis 24 Buchstaben, Zahlen, Leerzeichen, _ oder - enthalten.', 422);
        if (!validEmail(email)) throw apiError('Bitte gib eine gültige E-Mail-Adresse ein.', 422);
        var duplicate = data.users.find(function (entry) { return entry.id !== user.id && (entry.username.toLowerCase() === username.toLowerCase() || String(entry.email).toLowerCase() === email.toLowerCase()); });
        if (duplicate) throw apiError('Nickname oder E-Mail-Adresse wird bereits verwendet.', 409);
        user.username = username; user.email = email; user.phone = String(payload.phone || '').slice(0, 40);
        user.website = safeHttpUrl(payload.website); user.social = safeHttpUrl(payload.social); user.bio = String(payload.bio || '').slice(0, 500);
        user.last_seen_at = nowIso();
        return { ok: true, user: publicUser(user, true), profile: publicUser(user, true) };
      });
    }

    throw apiError('Unbekannte Browser-API-Aktion.', 404);
  }

  function parseRegister(payload) {
    var username = String(payload.username || '').trim();
    var email = String(payload.email || '').trim();
    var password = String(payload.password || '');
    if (!validUsername(username)) return Promise.reject(apiError('Der Nickname muss 3 bis 24 Buchstaben, Zahlen, Leerzeichen, _ oder - enthalten.', 422));
    if (!validEmail(email)) return Promise.reject(apiError('Bitte gib eine gültige E-Mail-Adresse ein.', 422));
    if (password.length < 8 || password.length > 200) return Promise.reject(apiError('Das Passwort muss mindestens 8 Zeichen lang sein.', 422));
    return Promise.resolve({ username: username, email: email, password: password, salt: randomHex(16) });
  }

  function safeHttpUrl(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    try {
      var url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (error) { return ''; }
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Bild konnte nicht gelesen werden.')); };
      reader.readAsDataURL(file);
    });
  }

  function handleUpload(payload) {
    var file = payload.file;
    if (!(file instanceof File)) return Promise.reject(apiError('Keine Datei ausgewählt.', 422));
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) return Promise.reject(apiError('Erlaubt sind JPG, PNG, GIF und WebP.', 422));
    if (file.size > 5 * 1024 * 1024) return Promise.reject(apiError('Das Profilbild darf höchstens 5 MB groß sein.', 422));
    requireCsrf(payload);
    return fileToDataUrl(file).then(function (dataUrl) {
      return updateDatabase(function (data) {
        var user = requireUser(data);
        user.avatar_path = dataUrl;
        return { ok: true, avatar_path: dataUrl };
      });
    });
  }

  function isBrowserApi(input) {
    try {
      var address = typeof input === 'string' ? input : input.url;
      var url = new URL(address, window.location.href);
      return /\/api\/(?:index|upload)\.php$/i.test(url.pathname);
    } catch (error) { return false; }
  }

  window.fetch = function (input, init) {
    if (!isBrowserApi(input)) return originalFetch(input, init);
    var address = typeof input === 'string' ? input : input.url;
    var url = new URL(address, window.location.href);
    var upload = /\/api\/upload\.php$/i.test(url.pathname);
    return parseRequestBody(init || {}).then(function (payload) {
      return upload ? handleUpload(payload) : handleApiAction(url.searchParams.get('action') || 'session', payload, url);
    }).then(function (payload) {
      return jsonResponse(payload, payload && payload.status ? payload.status : 200);
    }).catch(function (error) {
      return jsonResponse({ ok: false, error: error && error.message ? error.message : 'Fehler in der Browser-Datenbank.' }, error && error.status ? error.status : 500);
    });
  };



  function withFileStore(mode, callback) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction;
        try {
          transaction = database.transaction(FILE_STORE_NAME, mode);
        } catch (error) {
          database.close();
          reject(error);
          return;
        }
        var store = transaction.objectStore(FILE_STORE_NAME);
        var result;
        try {
          result = callback(store, transaction);
        } catch (error) {
          transaction.abort();
          database.close();
          reject(error);
          return;
        }
        transaction.oncomplete = function () { database.close(); resolve(result); };
        transaction.onerror = function () { database.close(); reject(transaction.error || new Error('Dateispeicher konnte nicht verarbeitet werden.')); };
        transaction.onabort = transaction.onerror;
      });
    });
  }

  function putFileBlob(id, blob, metadata) {
    if (!id || !(blob instanceof Blob)) return Promise.reject(new Error('Ungültige Datei für den Browser-Speicher.'));
    var record = Object.assign({
      id: String(id),
      blob: blob,
      name: blob.name || '',
      mime: blob.type || 'application/octet-stream',
      size: Number(blob.size || 0),
      modified: nowIso()
    }, metadata || {});
    return withFileStore('readwrite', function (store) { store.put(record); return record; });
  }

  function getFileBlob(id) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction = database.transaction(FILE_STORE_NAME, 'readonly');
        var request = transaction.objectStore(FILE_STORE_NAME).get(String(id));
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error || new Error('Datei konnte nicht gelesen werden.')); };
        transaction.oncomplete = function () { database.close(); };
        transaction.onerror = function () { database.close(); reject(transaction.error || new Error('Dateispeicher konnte nicht gelesen werden.')); };
      });
    });
  }

  function getAllFileBlobs() {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction = database.transaction(FILE_STORE_NAME, 'readonly');
        var request = transaction.objectStore(FILE_STORE_NAME).getAll();
        request.onsuccess = function () { resolve(request.result || []); };
        request.onerror = function () { reject(request.error || new Error('Gespeicherte Dateien konnten nicht gelesen werden.')); };
        transaction.oncomplete = function () { database.close(); };
        transaction.onerror = function () { database.close(); reject(transaction.error || new Error('Dateispeicher konnte nicht gelesen werden.')); };
      });
    });
  }

  function deleteFileBlob(id) {
    return withFileStore('readwrite', function (store) { store.delete(String(id)); });
  }

  function clearFileBlobs() {
    return withFileStore('readwrite', function (store) { store.clear(); });
  }

  function requestPersistentStorage() {
    if (!navigator.storage || typeof navigator.storage.persist !== 'function') return Promise.resolve(false);
    return navigator.storage.persist().catch(function () { return false; });
  }

  function replaceLegacyText(root) {
    var replacements = {
      'PHP/SQLite verbunden': 'IndexedDB verbunden',
      'SQLite mit PDO': 'IndexedDB im Browser',
      'data/desktop.sqlite': 'Browser-Speicher dieses Geräts',
      'PHP und SQLite sind verbunden.': 'Die IndexedDB-Browserdatenbank ist aktiv.',
      'Für den echten Mehrbenutzer-Chat bitte anmelden oder kostenlos registrieren.': 'Für den gespeicherten Browser-Chat bitte anmelden oder kostenlos registrieren.',
      'Private Unterhaltungen werden im Backend separat und nur für die Beteiligten gespeichert.': 'Private Unterhaltungen werden in der Browser-Datenbank separat gespeichert.',
      'Die Verbindung ist verschlüsselt, wenn der Server über HTTPS bereitgestellt wird.': 'Das Konto und der Chat werden in der Browser-Datenbank dieses Geräts gespeichert.'
    };
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue;
      Object.keys(replacements).forEach(function (source) {
        if (text.indexOf(source) !== -1) text = text.split(source).join(replacements[source]);
      });
      if (node.nodeValue !== text) node.nodeValue = text;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    replaceLegacyText(document.body);
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) replaceLegacyText(node);
          else if (node.nodeType === Node.TEXT_NODE && node.parentNode) replaceLegacyText(node.parentNode);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  window.PatrickFileStore = {
    put: putFileBlob,
    get: getFileBlob,
    getAll: getAllFileBlobs,
    delete: deleteFileBlob,
    clear: clearFileBlobs,
    requestPersistentStorage: requestPersistentStorage
  };

  window.PatrickBrowserBackend = {
    name: 'IndexedDB Browser Backend',
    database: DATABASE_NAME,
    reset: function () {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(CSRF_KEY);
      return new Promise(function (resolve, reject) {
        var request = indexedDB.deleteDatabase(DATABASE_NAME);
        request.onsuccess = function () { resolve(); };
        request.onerror = function () { reject(request.error); };
        request.onblocked = function () { reject(new Error('Datenbank wird noch von einem anderen Tab verwendet.')); };
      });
    }
  };
}());
