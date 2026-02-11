/**
 * Realtime Events Zustand Store
 * Manages Socket.IO client connection and subscription lifecycle
 * Integrates with Frappe's realtime infrastructure
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';

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
  unsubscribe: (event: string, handler?: RealtimeEventHandler) => void;
  unsubscribeAll: () => void;
  reconnect: () => void;

  // Internal
  _addSubscription: (event: string, handler: RealtimeEventHandler) => void;
  _removeSubscription: (event: string, handler?: RealtimeEventHandler) => void;
}

const useRealtimeStore = create<RealtimeState>()(
  devtools(
    (set, get) => ({
      // Initial State
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
              'X-Frappe-CSRF-Token': (window as any).csrf_token || '',
            },
          });

          // Handle connection
          newSocket.on('connect', () => {
            console.log('[Realtime] Socket connected:', newSocket.id);
            set({
              socket: newSocket,
              isConnected: true,
              isConnecting: false,
              connectionError: null,
              lastDisconnectReason: undefined,
            });

            // Re-subscribe to all active subscriptions on reconnect
            const subscriptions = get().subscriptions;
            console.log(
              `[Realtime] Re-subscribing to ${subscriptions.length} events after reconnect...`
            );
            subscriptions.forEach(({ event, handler }) => {
              newSocket.off(event); // Remove old handler
              newSocket.on(event, handler);
            });
          });

          // Handle connection error
          newSocket.on('connect_error', (error) => {
            console.error('[Realtime] Connection error:', error);
            set({
              connectionError: error.message || 'Connection error',
              isConnecting: false,
            });
          });

          // Handle disconnection
          newSocket.on('disconnect', (reason) => {
            console.warn('[Realtime] Socket disconnected:', reason);
            set({
              isConnected: false,
              lastDisconnectReason: reason,
            });

            // Log reconnection attempts for debugging
            if (reason !== 'io client namespace disconnect') {
              console.log('[Realtime] Will attempt to reconnect...');
            }
          });

          // Handle unexpected errors
          newSocket.on('error', (error) => {
            console.error('[Realtime] Socket error:', error);
            set({
              connectionError:
                typeof error === 'string' ? error : error?.message || 'Unknown error',
            });
          });

          set({
            socket: newSocket,
            isConnecting: true,
            connectionError: null,
          });
        } catch (error: any) {
          console.error('[Realtime] Failed to initialize Socket.IO:', error);
          set({
            connectionError: error.message || 'Failed to initialize Socket.IO',
            isConnecting: false,
          });
        }
      },

      /**
       * Disconnect and cleanup
       */
      disconnect: () => {
        const { socket } = get();

        if (!socket) return;

        console.log('[Realtime] Disconnecting socket...');
        socket.disconnect();
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
        const { socket, subscriptions } = get();

        // Ensure socket is initialized
        if (!socket) {
          console.warn(`[Realtime] Socket not initialized. Cannot subscribe to "${event}"`);
          return () => { }; // Return no-op unsubscribe
        }

        // Check if already subscribed to this event
        const alreadySubscribed = subscriptions.some((s) => s.event === event);

        // Register handler
        socket.off(event); // Remove any old handler to avoid duplicates
        socket.on(event, (data) => {
          console.log(`[Realtime] Received event "${event}":`, data);
          handler(data);
        });

        // Store subscription info
        get()._addSubscription(event, handler);

        console.log(
          `[Realtime] Subscribed to "${event}" (total subscriptions: ${subscriptions.length + 1})`
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
        const { socket, subscriptions } = get();

        if (!socket) return;

        subscriptions.forEach(({ event }) => {
          socket.off(event);
        });

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
       * Internal: Add subscription to store
       */
      _addSubscription: (event: string, handler: RealtimeEventHandler) => {
        set((state) => ({
          subscriptions: [
            ...state.subscriptions.filter((s) => s.event !== event), // Remove old if exists
            { event, handler },
          ],
        }));
      },

      /**
       * Internal: Remove subscription from store
       */
      _removeSubscription: (event: string, handler?: RealtimeEventHandler) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter(
            (s) => !(s.event === event && (!handler || s.handler === handler))
          ),
        }));
      },
    }),
    {
      name: 'realtime-store',
    }
  )
);

export default useRealtimeStore;
