// Offline Queue Manager
// Handles queuing operations when offline and syncing when back online

const QUEUE_KEY = 'pomodo_offline_queue';

export const offlineQueue = {
  // Add operation to queue
  enqueue(operation) {
    const queue = this.getQueue();
    const item = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...operation
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return item.id;
  },

  // Get all pending operations
  getQueue() {
    try {
      const queue = localStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (err) {
      console.error('Failed to parse queue:', err);
      return [];
    }
  },

  // Remove operation from queue
  dequeue(id) {
    const queue = this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  // Clear entire queue
  clear() {
    localStorage.removeItem(QUEUE_KEY);
  },

  // Get queue size
  size() {
    return this.getQueue().length;
  }
};

// Operation types
export const OperationType = {
  CREATE_TODO: 'CREATE_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
  DELETE_TODO: 'DELETE_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  CREATE_SCOPE: 'CREATE_SCOPE',
  UPDATE_SCOPE: 'UPDATE_SCOPE',
  DELETE_SCOPE: 'DELETE_SCOPE',
};

// Sync queue with server
export async function syncQueue(api) {
  const queue = offlineQueue.getQueue();

  if (queue.length === 0) {
    console.log('[Sync] Queue empty, nothing to sync');
    return { success: true, synced: 0, failed: 0 };
  }

  console.log(`[Sync] Starting sync of ${queue.length} operations...`);

  let synced = 0;
  let failed = 0;

  for (const operation of queue) {
    try {
      switch (operation.type) {
        case OperationType.CREATE_TODO:
          await api.todosAPI.create(
            operation.data.scopeId,
            operation.data.text,
            operation.data.position
          );
          break;

        case OperationType.UPDATE_TODO:
          await api.todosAPI.update(
            operation.data.id,
            operation.data.text
          );
          break;

        case OperationType.TOGGLE_TODO:
          await api.todosAPI.toggle(
            operation.data.id,
            operation.data.completed
          );
          break;

        case OperationType.DELETE_TODO:
          await api.todosAPI.delete(operation.data.id);
          break;

        case OperationType.CREATE_SCOPE:
          await api.scopesAPI.create(
            operation.data.name,
            operation.data.position
          );
          break;

        case OperationType.UPDATE_SCOPE:
          await api.scopesAPI.update(
            operation.data.id,
            operation.data.name
          );
          break;

        case OperationType.DELETE_SCOPE:
          await api.scopesAPI.delete(operation.data.id);
          break;

        default:
          console.warn('[Sync] Unknown operation type:', operation.type);
      }

      // Success - remove from queue
      offlineQueue.dequeue(operation.id);
      synced++;
      console.log(`[Sync] ✅ Synced: ${operation.type}`);

    } catch (error) {
      console.error(`[Sync] ❌ Failed to sync ${operation.type}:`, error);
      failed++;
      // Keep in queue for retry
    }
  }

  console.log(`[Sync] Complete - Synced: ${synced}, Failed: ${failed}`);

  return { success: failed === 0, synced, failed };
}

// Check if online
export function isOnline() {
  return navigator.onLine;
}

// Setup online/offline listeners
export function setupNetworkListeners(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log('[Network] Back online');
    onOnline?.();
  });

  window.addEventListener('offline', () => {
    console.log('[Network] Gone offline');
    onOffline?.();
  });
}
