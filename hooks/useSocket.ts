import { useAuth0 } from '@auth0/auth0-react';
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

export const useSocket = (serverUrl: string = 'http://localhost:3000') => {
  const { getIdTokenClaims, isAuthenticated, user } = useAuth0();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || connectionAttempted.current) return;

    const initSocket = async () => {
      setIsConnecting(true);
      setError(null);
      connectionAttempted.current = true;

      try {
        // Get the JWT token from Auth0
        const claims = await getIdTokenClaims();
        const token = claims?.__raw; // The raw JWT token

        if (!token) {
          throw new Error('No authentication token available');
        }

        // Create socket with authentication
        const newSocket = io(serverUrl, {
          auth: {
            token,
            user: {
              sub: user?.sub,
              email: user?.email,
              name: user?.name
            }
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        // Socket event handlers
        newSocket.on('connect', () => {
          console.log('Socket connected with Auth0 authentication');
          setIsConnecting(false);
          setError(null);
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError(err.message);
          setIsConnecting(false);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // The disconnection was initiated by the server, reconnect manually
            newSocket.connect();
          }
        });

        // Authentication error handling
        newSocket.on('auth_error', (err) => {
          console.error('Socket authentication error:', err);
          setError('Authentication failed. Please sign in again.');
        });

        setSocket(newSocket);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize socket';
        setError(errorMessage);
        setIsConnecting(false);
        console.error('Socket initialization error:', err);
      }
    };

    initSocket();

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      connectionAttempted.current = false;
    };
  }, [isAuthenticated, getIdTokenClaims, user, serverUrl]);

  // Disconnect socket when user logs out
  useEffect(() => {
    if (!isAuthenticated && socket) {
      socket.disconnect();
      setSocket(null);
      connectionAttempted.current = false;
    }
  }, [isAuthenticated, socket]);

  return {
    socket,
    isConnecting,
    error,
    isConnected: socket?.connected || false
  };
};
