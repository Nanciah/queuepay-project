import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WS_URL = 'http://192.168.1.150:5000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinService: (serviceId: string) => void;
  leaveService: (serviceId: string) => void;
  joinCompany: (companyId: string) => void;  // ✅ AJOUTER
  leaveCompany: (companyId: string) => void; // ✅ AJOUTER
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log('🔌 Connexion WebSocket à:', WS_URL);

    try {
      const newSocket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connecté');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket déconnecté');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error: Error) => {
        console.warn('⚠️ Socket connection error:', error.message);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('❌ Erreur création socket:', error);
      setSocket(null);
      setIsConnected(false);
    }
  }, [token, user]);

  // ✅ Rejoindre une room de service
  const joinService = (serviceId: string) => {
    if (socket && isConnected) {
      socket.emit('join-queue-room', { serviceId });
      console.log(`📋 Rejoint service ${serviceId}`);
    }
  };

  // ✅ Quitter une room de service
  const leaveService = (serviceId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-queue-room', { serviceId });
      console.log(`📋 Quitté service ${serviceId}`);
    }
  };

  // ✅ Rejoindre une room d'entreprise (pour les services)
  const joinCompany = (companyId: string) => {
    if (socket && isConnected) {
      socket.emit('join-service-room', { companyId });
      console.log(`📋 Rejoint entreprise ${companyId}`);
    }
  };

  // ✅ Quitter une room d'entreprise
  const leaveCompany = (companyId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-service-room', { companyId });
      console.log(`📋 Quitté entreprise ${companyId}`);
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      joinService, 
      leaveService,
      joinCompany,   // ✅ EXPOSER
      leaveCompany   // ✅ EXPOSER
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};