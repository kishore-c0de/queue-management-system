import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// autoConnect: false -- each page decides when to connect/disconnect
// (e.g. customer status page connects on mount, disconnects on unmount)
// so we don't hold a socket open on pages that don't need live updates.
export const socket = io(SOCKET_URL, { autoConnect: false });
