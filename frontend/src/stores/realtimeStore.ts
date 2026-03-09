/**
 * Realtime Events Zustand Store
 * Manages Socket.IO client connection and subscription lifecycle
 * Integrates with Frappe's realtime infrastructure
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { getCsrfToken } from '../utils/csrf';

export type RealtimeEventHandler = (data: any) => void;

interface RealtimeSubscription {
  event: string;
  handler: RealtimeEventHandler;
}

interface RealtimeState {
  // State
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  subscriptions: RealtimeSubscription[];
  lastDisconnectReason?: string;

  // Actions
  initialize: () => void;
  disconnect: () => void;
  subscribe: (event: string, handler: RealtimeEventHandler) => () => void;
  subscribeConnectionError: (callback: ConnectionErrorListener) => () => void;
  unsubscribe: (event: string, handler?: RealtimeEventHandler) => void;
  unsubscribeAll: () => void;
  reconnect: () => void;

  // Internal
  _addSubscription: (event: string, handler: RealtimeEventHandler) => void;
  _removeSubscription: (event: string, handler?: RealtimeEventHandler) => void;
}

// Subscriptions kept outside Zustand state so add/remove don't trigger re-renders (avoids React #185).
let subscriptionsList: RealtimeSubscription[] = [];

// Connection-error listeners: store notifies when error happens (no useEffect in consumers).
type ConnectionErrorListener = (error: string) => void;
let connectionErrorListeners: ConnectionErrorListener[] = [];

function notifyConnectionError(message: string) {
  const msg = message || 'Connection error';
  connectionErrorListeners.forEach((cb) => {
    try {
      cb(msg);
    } catch (e) {
      console.error('[Realtime] connectionError listener threw:', e);
    }
  });
}

const useRealtimeStore = create<RealtimeState>()(
  devtools(
    (set, get) => ({
      // Initial State (subscriptions live in subscriptionsList, not here)
      socket: null,
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      subscriptions: [],
      lastDisconnectReason: undefined,

      /**
       * Initialize Socket.IO client and establish connection
       */
      initialize: () => {
        const { socket, isConnecting, isConnected } = get();

        // Prevent multiple connection attempts
        if (isConnecting || isConnected || socket) {
          console.log('[Realtime] Socket already initialized or connecting');
          return;
        }

        console.log('[Realtime] Initializing Socket.IO client...');

        try {
          // Resolve site name for Socket.IO namespace
          // 1. Check frappe.boot.site_name (most reliable)
          // 2. Check window.location.hostname (common in production)
          // 3. Check path (fallback)
          const siteName = (window as any).frappe?.boot?.site_name ||
            window.location.hostname ||
            window.location.pathname.split('/')[2] ||
            'frappe';

          // Initialize Socket.IO with Frappe defaults
          const newSocket = io(`/${siteName}`, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            transports: ['websocket', 'polling'],
            withCredentials: true,
            extraHeaders: {
              'X-Frappe-CSRF-Token': getCsrfToken(),
            },
          });

          // Handle connection
          newSocket.on('connect', () => {
            try {
              console.log('[Realtime] Socket connected:', newSocket.id);
              set({
                socket: newSocket,
                isConnected: true,
                isConnecting: false,
                connectionError: null,
                lastDisconnectReason: undefined,
              });
              subscriptionsList.forEach(({ event, handler }) => {
                try {
                  newSocket.off(event);
                  newSocket.on(event, handler);
                } catch (e) {
                  console.warn('[Realtime] Re-subscribe error for', event, e);
                }
              });
            } catch (e) {
              console.error('[Realtime] connect handler error:', e);
            }
          });

          // Handle connection error (non-fatal: dashboard still works); notify subscribers
          newSocket.on('connect_error', (error) => {
            try {
              const msg = error?.message || 'Connection error';
              console.error('[Realtime] Connection error:', error);
              set({
                connectionError: msg,
                isConnecting: false,
              });
              notifyConnectionError(msg);
            } catch (e) {
              console.error('[Realtime] connect_error handler error:', e);
            }
          });

          // Handle disconnection
          newSocket.on('disconnect', (reason) => {
            try {
              console.warn('[Realtime] Socket disconnected:', reason);
              set({
                isConnected: false,
                lastDisconnectReason: reason,
              });
              if (reason !== 'io client namespace disconnect') {
                console.log('[Realtime] Will attempt to reconnect...');
              }
            } catch (e) {
              console.error('[Realtime] disconnect handler error:', e);
            }
          });

          // Handle unexpected errors; notify subscribers
          newSocket.on('error', (error) => {
            try {
              const msg = typeof error === 'string' ? error : (error as Error)?.message || 'Unknown error';
              console.error('[Realtime] Socket error:', error);
              set({
                connectionError: msg,
              });
              notifyConnectionError(msg);
            } catch (e) {
              console.error('[Realtime] error handler error:', e);
            }
          });

          set({
            socket: newSocket,
            isConnecting: true,
            connectionError: null,
          });
        } catch (error: any) {
          const msg = error?.message || 'Failed to initialize Socket.IO';
          console.error('[Realtime] Failed to initialize Socket.IO:', error);
          try {
            set({
              connectionError: msg,
              isConnecting: false,
            });
            notifyConnectionError(msg);
          } catch (e) {
            console.error('[Realtime] set after init error:', e);
          }
        }
      },

      /**
       * Subscribe to connection errors (event-driven; no useEffect on connectionError in consumers).
       * Returns unsubscribe function.
       */
      subscribeConnectionError: (callback: ConnectionErrorListener) => {
        connectionErrorListeners.push(callback);
        return () => {
          connectionErrorListeners = connectionErrorListeners.filter((cb) => cb !== callback);
        };
      },

      /**
       * Disconnect and cleanup
       */
      disconnect: () => {
        const { socket } = get();

        if (!socket) return;

        console.log('[Realtime] Disconnecting socket...');
        socket.disconnect();
        subscriptionsList = [];
        set({
          socket: null,
          isConnected: false,
          subscriptions: [],
        });
      },

      /**
       * Subscribe to a realtime event
       * Returns an unsubscribe function
       */
      subscribe: (event: string, handler: RealtimeEventHandler) => {
        const { socket } = get();

        // Ensure socket is initialized
        if (!socket) {
          console.warn(`[Realtime] Socket not initialized. Cannot subscribe to "${event}"`);
          return () => { }; // Return no-op unsubscribe
        }

        // Register handler
        socket.off(event); // Remove any old handler to avoid duplicates
        socket.on(event, (data) => {
          try {
            console.log(`[Realtime] Received event "${event}":`, data);
            handler(data);
          } catch (err) {
            console.error(`[Realtime] Event "${event}" handler threw:`, err);
          }
        });

        // Store subscription info (outside state to avoid re-render loop on unsubscribe)
        get()._addSubscription(event, handler);

        console.log(
          `[Realtime] Subscribed to "${event}" (total subscriptions: ${subscriptionsList.length})`
        );

        // Return unsubscribe function
        return () => {
          get().unsubscribe(event, handler);
        };
      },

      /**
       * Unsubscribe from a realtime event
       */
      unsubscribe: (event: string, handler?: RealtimeEventHandler) => {
        const { socket } = get();

        if (!socket) return;

        socket.off(event);
        get()._removeSubscription(event, handler);

        console.log(`[Realtime] Unsubscribed from "${event}"`);
      },

      /**
       * Unsubscribe from all events
       */
      unsubscribeAll: () => {
        const { socket } = get();

        if (!socket) return;

        subscriptionsList.forEach(({ event }) => {
          socket.off(event);
        });
        subscriptionsList = [];

        set({ subscriptions: [] });
        console.log('[Realtime] Unsubscribed from all events');
      },

      /**
       * Manually trigger reconnection
       */
      reconnect: () => {
        const { socket } = get();

        if (!socket) {
          console.log('[Realtime] Socket not initialized. Initializing...');
          get().initialize();
          return;
        }

        if (socket.connected) {
          console.log('[Realtime] Already connected');
          return;
        }

        console.log('[Realtime] Reconnecting...');
        socket.connect();
      },

      /**
       * Internal: Add subscription (held in subscriptionsList, not state, to avoid re-render on unsubscribe)
       */
      _addSubscription: (event: string, handler: RealtimeEventHandler) => {
        subscriptionsList = subscriptionsList.filter((s) => s.event !== event);
        subscriptionsList.push({ event, handler });
      },

      /**
       * Internal: Remove subscription from list (no set() so no re-render, avoids React #185)
       */
      _removeSubscription: (event: string, handler?: RealtimeEventHandler) => {
        subscriptionsList = subscriptionsList.filter(
          (s) => !(s.event === event && (!handler || s.handler === handler))
        );
      },
    }),
    {
      name: 'realtime-store',
    }
  )
);

export default useRealtimeStore;
