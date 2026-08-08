import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  console.log('🔵 [SOCKET] SocketProvider - token:', token ? 'OK' : 'NULL');
  console.log('🔵 [SOCKET] SocketProvider - user:', user ? 'OK' : 'NULL');

  useEffect(() => {
    console.log('🔄 [SOCKET] useEffect - token:', token ? 'OK' : 'NULL');
    
    if (!token || !user) {
      console.log('⚠️ [SOCKET] Pas de token ou user, déconnexion');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    console.log('🔌 [SOCKET] Connexion WebSocket à:', wsUrl);
    
    socketRef.current = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ [SOCKET] Socket connecté');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ [SOCKET] Socket déconnecté');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Erreur socket:', error);
      setIsConnected(false);
    });

    // ✅ Écouter les événements pour debug
    socketRef.current.onAny((event, ...args) => {
      console.log(`📡 [SOCKET] Événement reçu: ${event}`, args);
    });

    return () => {
      console.log('🔄 [SOCKET] Nettoyage');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [token, user]);

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
      console.log(`📤 [SOCKET] Émission: ${event}`, data);
    } else {
      console.warn('⚠️ [SOCKET] Socket non connecté, événement non envoyé:', event);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      console.log(`📡 [SOCKET] Enregistrement écouteur: ${event}`);
      socketRef.current.on(event, callback);
    } else {
      console.warn('⚠️ [SOCKET] Socket non disponible pour on:', event);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      console.log(`📡 [SOCKET] Suppression écouteur: ${event}`);
      socketRef.current.off(event, callback);
    } else {
      console.warn('⚠️ [SOCKET] Socket non disponible pour off:', event);
    }
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
  };

  console.log('🔵 [SOCKET] Provider value:', { isConnected, hasSocket: !!socketRef.current });

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};