import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  initDB,
  getAllExercises as localGetAll,
  createExerciseWithId,
  createExercise as localCreateFallback,
  updateExerciseDB as localUpdate,
  deleteExerciseDB as localDelete
} from './exerciseRepository';

const SYNC_QUEUE_KEY = 'sync_queue_v1';
const SERVER_BASE = 'http://172.20.10.2:3000'; // set to your server IP
let ws = null;
let online = false;
let processing = false;

function log(...args) { console.log('[sync]', ...args); }

async function loadQueue() {
  const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue) {
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

// listener/notify utilities so UI can reload immediately on local changes
const listeners = new Set();
export function addSyncListener(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notifyChange() { for (const fn of listeners) { try { fn(); } catch (e) { console.warn('listener error', e); } } }

// queue item shape: { op: 'create'|'update'|'delete', payload: {...}, tempId?: number, id?: number, createdAt: number }
// enqueue with simple dedupe
async function enqueue(op) {
  const queue = await loadQueue();
  const isDuplicate = queue.some(q => {
    if (op.op === 'create' && op.tempId) return q.op === 'create' && q.tempId === op.tempId;
    if ((op.op === 'update' || op.op === 'delete') && op.id) return q.op === op.op && q.id === op.id;
    return false;
  });
  if (isDuplicate) {
    log('enqueue skipped duplicate op', op);
    return;
  }
  queue.push(op);
  await saveQueue(queue);
  log('enqueued', op);
  notifyChange();
}

// send request helper - tolerate empty/no-content responses and return parsed JSON if present
async function api(path, method = 'GET', body) {
  const timeout = 2000; // <-- set timeout to 2000ms
  const url = `${SERVER_BASE}${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);

  // verbose HTTP logging
  log('HTTP ->', method, url, body ? body : '');

  // perform fetch with error logging and timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let res;
  try {
    res = await fetch(url, { ...opts, signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    const msg = err && err.name === 'AbortError' ? 'Request timed out' : (err && err.message ? err.message : err);
    log('HTTP error', method, url, msg);
    throw err;
  }
  clearTimeout(id);

  log('HTTP <-', method, url, 'status', res.status);

  if (!res.ok) {
    const txt = await res.text();
    log('HTTP <- body (error)', txt);
    const err = new Error(`Server ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) {
    log('HTTP <- no content');
    return null;
  }

  const txt = await res.text();
  log('HTTP <- body', txt || '<empty>');
  if (!txt) return null;

  try {
    return JSON.parse(txt);
  } catch (e) {
    const err = new Error(`Invalid JSON from server: ${e.message}`);
    err.status = res.status;
    throw err;
  }
}

// init sync: local DB + start listeners + websocket
export async function initServerSync() {
  try {
    await initDB();
    // start network listener
    NetInfo.addEventListener(state => {
      online = !!state.isConnected;
      log('network status', online);
      if (online) processQueue();
      // attempt ws reconnect if online and ws not open
      if (online && (!ws || ws.readyState !== 1)) {
        tryConnectWS();
      }
    });

    // initial check
    const state = await NetInfo.fetch();
    online = !!state.isConnected;
    if (online) processQueue();

    // setup websocket connection (with simple reconnect)
    tryConnectWS();
  } catch (err) {
    console.error('initServerSync error', err);
    Alert.alert('Sync init failed', 'Could not initialize sync. App will use local DB only.');
  }
}

// WebSocket connect with simple exponential backoff
let wsBackoff = 1000;
let wsReconnectTimer = null;
function tryConnectWS() {
  try {
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return; // connecting/open
    try { if (ws) { ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null; ws.close(); } } catch (e) {}
    const url = `${SERVER_BASE.replace(/^http/, 'ws')}/ws`;
    log('connecting ws ->', url);
    ws = new WebSocket(url);

    ws.onopen = () => {
      log('ws open');
      wsBackoff = 1000;
      if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }

      // trigger queue processing now that WS (and likely server) is reachable
      (async () => {
        try {
          if (online) {
            log('ws.onopen: triggering processQueue');
            await processQueue();

            // refresh authoritative server state and apply locally,
            // but skip items that have pending local ops (avoid overwriting local changes)
            try {
              const queue = await loadQueue();
              const serverList = await api('/exercises', 'GET').catch(e => { log('refresh GET failed', e); return null; });
              if (serverList && Array.isArray(serverList)) {
                for (const item of serverList) {
                  // skip applying server row when there's a pending local update/delete/create for same id
                  if (queue.some(q => ((q.op === 'update' || q.op === 'delete') && q.id === item.id))) {
                    log('skip applying server item because local op queued', item.id);
                    continue;
                  }
                  await createExerciseWithId(item.id, item);
                }
                notifyChange();
              }
            } catch (e) {
              log('ws.onopen refresh failed', e);
            }
          }
        } catch (e) {
          log('processQueue on ws.open failed', e);
        }
      })();
    };

    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        log('ws msg', msg);
        // load queue to make informed decisions
        const queue = await loadQueue();

        if (msg.type === 'create') {
          const item = msg.item;
          if (!item || !item.id) { log('ws create missing item.id, ignoring', msg); return; }

          // If a delete for this id is queued, skip apply
          if (queue.some(q => q.op === 'delete' && q.id === item.id)) {
            log('ws create ignored because delete is queued for id', item.id);
            return;
          }

          // If there is a queued create with identical payload, treat this as success: remove queued create and reconcile
          const matchingIndex = queue.findIndex(q =>
            q.op === 'create' &&
            q.payload &&
            JSON.stringify(q.payload) === JSON.stringify(item)
          );
          if (matchingIndex > -1) {
            const [matched] = queue.splice(matchingIndex, 1);
            await saveQueue(queue);
            log('ws create matched queued op, removing queued create', matched);
            await createExerciseWithId(item.id, item);
            if (matched.tempId) { try { await localDelete(matched.tempId); } catch (e) {} }
            notifyChange();
            return;
          }

          // persist server row normally
          await createExerciseWithId(item.id, item);
          notifyChange();
        } else if (msg.type === 'update') {
          const id = msg.id || (msg.item && msg.item.id);
          if (!id) { log('ws update missing id, ignoring', msg); return; }
          const payload = msg.item || msg;

          // SKIP applying server update if there's a pending local update/delete for same id
          if (queue.some(q => (q.op === 'update' || q.op === 'delete') && q.id === id)) {
            log('ws update ignored because local update/delete is queued for id', id);
            return;
          }

          await localUpdate(id, payload);
          notifyChange();
        } else if (msg.type === 'delete') {
          const id = msg.id || (msg.item && msg.item.id);
          if (!id) { log('ws delete missing id, ignoring', msg); return; }

          // SKIP applying server delete if there's a pending local create/update/delete for same id
          if (queue.some(q => ((q.op === 'create' && q.tempId === id) || (q.id && q.id === id)))) {
            log('ws delete ignored because local op is queued for id', id);
            return;
          }

          await localDelete(id);
          notifyChange();
        } else {
          log('ws unknown message type, ignoring', msg);
        }
      } catch (e) {
        console.warn('ws handler error', e);
      }
    };

    ws.onerror = (e) => { log('ws error', e && e.message ? e.message : e); };

    ws.onclose = () => {
      log('ws closed');
      if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
      if (online) {
        wsReconnectTimer = setTimeout(() => {
          tryConnectWS();
          wsBackoff = Math.min(wsBackoff * 2, 30000);
        }, wsBackoff);
        log('ws will reconnect in', wsBackoff);
      }
    };
  } catch (e) {
    log('connectWS failed', e);
  }
}

// Public getAll: prefer server but fallback to local when server empty or unreachable
export async function getAll() {
  try {
    if (online) {
      const list = await api('/exercises', 'GET');
      if (!list || list.length === 0) {
        log('server returned empty list, using local data');
        return await localGetAll();
      }
      for (const item of list) {
        await createExerciseWithId(item.id, item);
      }
      return list;
    }
  } catch (err) {
    log('server read failed, falling back to local', err);
  }
  return localGetAll();
}

// create: optimistic local-first fallback; enqueues on failure
export async function create(item) {
  // try server first if online (non-blocking behavior handled by caller logic)
  if (online) {
    try {
      const created = await api('/exercises', 'POST', item);
      if (created && created.id) {
        await createExerciseWithId(created.id, created);
        notifyChange();
        return created;
      }
    } catch (err) {
      log('create server failed, enqueueing', err);
      // continue to local fallback
    }
  }

  try {
    const localCreated = await localCreateFallback(item); // returns { ...item, id: tempId }
    await enqueue({ op: 'create', payload: item, tempId: localCreated.id, createdAt: Date.now() });
    return localCreated;
  } catch (err) {
    console.error('create local failed', err);
    Alert.alert('Save failed', 'Could not save the exercise locally.');
    throw err;
  }
}

export async function update(id, changes) {
  if (online) {
    try {
      const updated = await api(`/exercises/${id}`, 'PUT', changes);
      if (updated) {
        await localUpdate(id, updated);
        notifyChange();
        return updated;
      }
    } catch (err) {
      log('update server failed, enqueueing', err);
    }
  }

  try {
    await localUpdate(id, changes);
    await enqueue({ op: 'update', payload: changes, id, createdAt: Date.now() });
    notifyChange();
    return { id, ...changes };
  } catch (err) {
    console.error('update local failed', err);
    Alert.alert('Update failed', 'Could not update the exercise locally.');
    throw err;
  }
}

export async function remove(id) {
  if (online) {
    try {
      await api(`/exercises/${id}`, 'DELETE');
      await localDelete(id);
      notifyChange();
      return true;
    } catch (err) {
      log('delete server failed, enqueueing', err);
    }
  }

  try {
    await localDelete(id);
    await enqueue({ op: 'delete', id, createdAt: Date.now() });
    notifyChange();
    return true;
  } catch (err) {
    console.error('delete local failed', err);
    Alert.alert('Delete failed', 'Could not remove the exercise locally.');
    throw err;
  }
}

// process queued ops sequentially
export async function processQueue() {
  if (!online) {
    log('processQueue: offline, skip');
    return;
  }
  if (processing) {
    log('processQueue: already running');
    return;
  }
  processing = true;
  try {
    const queue = await loadQueue();
    if (!queue.length) {
      log('queue empty');
      processing = false;
      return;
    }
    log('processing queue', queue.length);
    const remaining = [];
    for (const op of queue) {
      try {
        if (op.op === 'create') {
          const created = await api('/exercises', 'POST', op.payload);
          if (created && created.id) {
            await createExerciseWithId(created.id, created);
            //  avoid duplicate local rows
            if (op.tempId && op.tempId !== created.id) {
              try { await localDelete(op.tempId); } catch (e) {}
            }
            notifyChange();
          } else {
            // no JSON returned but request succeeded (204), keep local created row
            log('create returned no body, keeping local temp row', op);
            // treat as success and drop op
          }
        } else if (op.op === 'update') {
          await api(`/exercises/${op.id}`, 'PUT', op.payload);
          await localUpdate(op.id, op.payload);
          notifyChange();
        } else if (op.op === 'delete') {
          await api(`/exercises/${op.id}`, 'DELETE');
          await localDelete(op.id);
          notifyChange();
        }
        log('synced op', op.op, op);
      } catch (err) {
        log('op failed, keep in queue', op, err);
        remaining.push(op);
      }
    }
    await saveQueue(remaining);
    notifyChange();
  } catch (err) {
    console.error('processQueue failed', err);
  } finally {
    processing = false;
  }
}


export async function forceProcessQueue() {
  log('forceProcessQueue called');
  try {
    await processQueue();
  } catch (e) {
    log('forceProcessQueue error', e);
  }
  const q = await loadQueue();
  log('queue after forceProcessQueue', q);
  return q;
}

// expose debug
export async function getQueue() { return loadQueue(); }
