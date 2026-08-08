import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { client, agent } from '../services/api';
import toast from 'react-hot-toast';

export const useQueue = (serviceId, isAgent = false) => {
  const { socket, isConnected, emit, on, off } = useSocket();
  const [queueData, setQueueData] = useState({
    total: 0,
    waiting: 0,
    called: 0,
    tickets: [],
  });
  const [myTicket, setMyTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger l'état de la file
  const fetchQueueStatus = useCallback(async () => {
    if (!serviceId) return;

    try {
      setIsLoading(true);
      const response = isAgent
        ? await agent.getQueueStatus(serviceId)
        : await client.getService(serviceId);
      
      setQueueData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, isAgent]);

  // Écouter les événements WebSocket
  useEffect(() => {
    if (!socket || !isConnected || !serviceId) return;

    // Rejoindre la room
    emit('join-queue-room', { serviceId });

    // Écouter les mises à jour
    const onQueueUpdate = (data) => {
      setQueueData(data);
    };

    const onTicketCalled = (data) => {
      toast.success(`Ticket ${data.ticketNumber} appelé!`, {
        icon: '🔔',
      });
      setQueueData(prev => ({
        ...prev,
        tickets: prev.tickets.map(t =>
          t.id === data.ticketId ? { ...t, status: 'called' } : t
        ),
      }));
    };

    const onTicketCompleted = (data) => {
      toast.success('Ticket complété!', { icon: '✅' });
    };

    on('queue-update', onQueueUpdate);
    on('ticket-called', onTicketCalled);
    on('ticket-completed', onTicketCompleted);

    fetchQueueStatus();

    return () => {
      off('queue-update', onQueueUpdate);
      off('ticket-called', onTicketCalled);
      off('ticket-completed', onTicketCompleted);
      emit('leave-queue-room', { serviceId });
    };
  }, [socket, isConnected, serviceId, emit, on, off, fetchQueueStatus]);

  // Ajouter un ticket (client)
  const addTicket = useCallback(async (data) => {
    try {
      const response = await client.createTicket({ ...data, serviceId });
      setMyTicket(response.data);
      toast.success(`Ticket ${response.data.ticketNumber} créé!`);
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
      throw err;
    }
  }, [serviceId]);

  // Appeler le prochain ticket (agent)
  const callNext = useCallback(async () => {
    try {
      const response = await agent.callNext(serviceId);
      toast.success(`Ticket ${response.data.ticketNumber} appelé!`);
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'appel');
      throw err;
    }
  }, [serviceId]);

  // Compléter un ticket (agent)
  const completeTicket = useCallback(async (ticketId) => {
    try {
      await agent.completeTicket(ticketId);
      toast.success('Ticket complété!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
      throw err;
    }
  }, []);

  // Annuler un ticket
  const cancelTicket = useCallback(async (ticketId, reason = 'user_cancelled') => {
    try {
      if (isAgent) {
        await agent.cancelTicket(ticketId, { reason });
      } else {
        await client.cancelTicket(ticketId);
      }
      toast.success('Ticket annulé');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'annulation');
      throw err;
    }
  }, [isAgent]);

  return {
    queueData,
    myTicket,
    isLoading,
    error,
    fetchQueueStatus,
    addTicket,
    callNext,
    completeTicket,
    cancelTicket,
    isConnected,
  };
};