// frontend/src/pages/agent/Queue.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Phone,
    QrCode,
    RefreshCw,
    ChevronLeft,
    Bell,
    Pause,
    Play,
    AlertCircle,
    Search
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { agent } from '../../services/api';
import toast from 'react-hot-toast';

const AgentQueue = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { serviceId, serviceName } = location.state || {};

    // ✅ Utiliser le socket
    const { socket, isConnected, emit, on, off } = useSocket();

    const [tickets, setTickets] = useState([]);
    const [currentTicket, setCurrentTicket] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        waiting: 0,
        called: 0,
        completed: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // ===== CHARGEMENT DES DONNÉES =====
    const fetchQueueData = async () => {
        if (!serviceId) {
            navigate('/agent/dashboard');
            return;
        }

        try {
            console.log('🔄 [fetchQueueData] Appel API pour service:', serviceId);
            const response = await agent.getQueueStatus(serviceId);
            const data = response.data;

            console.log('✅ [fetchQueueData] Données reçues:', {
                tickets: data.tickets?.length || 0,
                waiting: data.waiting || 0,
                currentTicket: data.currentTicket ? 'OUI' : 'NON'
            });

            setTickets(data.tickets || []);
            setStats({
                total: data.total || 0,
                waiting: data.waiting || 0,
                called: data.called || 0,
                completed: data.completed || 0
            });

            setCurrentTicket(data.currentTicket || null);
        } catch (error) {
            console.error('❌ [fetchQueueData] Erreur:', error);
            toast.error('Erreur lors du chargement de la file');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ===== WEBSOCKET - CONNEXION ET ÉCOUTE =====
    useEffect(() => {
        if (!socket || !isConnected || !serviceId) {
            console.log('⏳ [AgentQueue] Socket pas prêt pour le service:', serviceId);
            return;
        }

        console.log('📡 [AgentQueue] Connexion au service:', serviceId);

        // ✅ Rejoindre la room spécifique du service
        emit('agent-connect', { serviceId });

        // ✅ Écouter les nouveaux tickets
        const onNewTicket = (data) => {
            console.log('🎫 [AgentQueue] NOUVEAU TICKET REÇU !!!', data);
            toast.success(`🎫 Nouveau ticket ${data.ticket?.ticket_number || 'inconnu'}`);
            fetchQueueData();
        };

        const onQueueUpdate = (data) => {
            console.log('🔄 [AgentQueue] Mise à jour de la file:', data);
            fetchQueueData();
        };

        const onTicketCalled = (data) => {
            console.log('📞 [AgentQueue] Ticket appelé:', data);
            toast.success(`🔔 Ticket ${data.ticketNumber} appelé`);
            fetchQueueData();
        };

        const onTicketCompleted = (data) => {
            console.log('✅ [AgentQueue] Ticket complété:', data);
            toast.success(`✅ Ticket ${data.ticketNumber} complété`);
            fetchQueueData();
        };

        const onTicketCancelled = (data) => {
            console.log('❌ [AgentQueue] Ticket annulé:', data);
            toast.error(`❌ Ticket ${data.ticketNumber} annulé`);
            fetchQueueData();
        };

        // ✅ Écouter les messages de test
        const onTestMessage = (data) => {
            console.log('🧪 [AgentQueue] Message de test reçu:', data);
            toast.info(`📡 Test: ${data.message}`);
        };

        // ✅ S'abonner aux événements
        on('new-ticket', onNewTicket);
        on('queue-updated', onQueueUpdate);
        on('ticket-called', onTicketCalled);
        on('ticket-completed', onTicketCompleted);
        on('ticket-cancelled', onTicketCancelled);
        on('test-message', onTestMessage);

        console.log('✅ [AgentQueue] Écouteurs enregistrés');

        return () => {
            console.log('🧹 [AgentQueue] Nettoyage des écouteurs');
            off('new-ticket', onNewTicket);
            off('queue-updated', onQueueUpdate);
            off('ticket-called', onTicketCalled);
            off('ticket-completed', onTicketCompleted);
            off('ticket-cancelled', onTicketCancelled);
            off('test-message', onTestMessage);
        };
    }, [socket, isConnected, serviceId]);

    // ===== CHARGEMENT INITIAL =====
    useEffect(() => {
        if (serviceId) {
            fetchQueueData();
        } else {
            navigate('/agent/dashboard');
        }
    }, [serviceId]);

    // ===== AUTO-REFRESH (solution de contournement) =====
    useEffect(() => {
        if (serviceId) {
            // ✅ Rafraîchir toutes les 5 secondes
            const interval = setInterval(() => {
                console.log('🔄 Auto-refresh de la file...');
                fetchQueueData();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [serviceId]);

    // ===== ACTIONS =====
    const handleCallNext = async () => {
        if (isPaused) {
            toast.error('Guichet en pause');
            return;
        }

        if (currentTicket) {
            toast.error('Un ticket est déjà en cours');
            return;
        }

        try {
            console.log('📞 [handleCallNext] Appel du prochain client...');
            const response = await agent.callNext(serviceId);
            const ticket = response.data;

            if (!ticket) {
                toast.error('Aucun client en attente');
                return;
            }

            console.log('✅ [handleCallNext] Ticket appelé:', ticket);
            setCurrentTicket(ticket);
            toast.success(`🔔 Client appelé ! ${ticket.ticket_number}`);
            fetchQueueData();
        } catch (error) {
            console.error('❌ [handleCallNext] Erreur:', error);
            toast.error(error.response?.data?.error || 'Erreur lors de l\'appel');
        }
    };

    const handleComplete = async () => {
        if (!currentTicket) {
            console.warn('⚠️ Aucun ticket en cours');
            return;
        }

        if (!window.confirm(`Service rendu pour ${currentTicket.ticket_number} ?`)) return;

        try {
            console.log('✅ [handleComplete] Complétion du ticket:', currentTicket.id);
            await agent.completeTicket(currentTicket.id);
            setCurrentTicket(null);
            toast.success('✅ Service complété !');
            fetchQueueData();
        } catch (error) {
            console.error('❌ [handleComplete] Erreur:', error);
            toast.error('Erreur lors de la complétion');
        }
    };

    const handleCancel = async () => {
        if (!currentTicket) return;

        if (!window.confirm(`Annuler le ticket ${currentTicket.ticket_number} ?`)) return;

        try {
            await agent.cancelTicket(currentTicket.id, { reason: 'agent_cancelled' });
            setCurrentTicket(null);
            toast.success('Ticket annulé');
            fetchQueueData();
        } catch (error) {
            console.error('❌ [handleCancel] Erreur:', error);
            toast.error('Erreur lors de l\'annulation');
        }
    };

    // ===== FILTRAGE =====
    const filteredTickets = tickets.filter(ticket =>
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.client?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.client?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ===== RENDU =====
    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/agent/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{serviceName || 'File d\'attente'}</h1>
                        <p className="text-gray-500 text-sm">Gestion de la file d'attente</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Indicateur de connexion */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-600">
                            {isConnected ? '🟢 En direct' : '🔴 Hors ligne'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            isPaused
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                    >
                        {isPaused ? (
                            <>
                                <Play className="w-4 h-4" />
                                Reprendre
                            </>
                        ) : (
                            <>
                                <Pause className="w-4 h-4" />
                                Pause
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setRefreshing(true);
                            fetchQueueData();
                        }}
                        disabled={refreshing}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-yellow-100">
                    <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
                    <p className="text-sm text-gray-500">En attente</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">{stats.called}</p>
                    <p className="text-sm text-gray-500">Appelés</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-green-100">
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-sm text-gray-500">Servis</p>
                </div>
            </div>

            {/* Current Ticket */}
            {currentTicket ? (
                <div className="bg-white rounded-lg shadow-lg border-2 border-indigo-500 p-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="bg-indigo-100 rounded-lg px-4 py-2">
                                    <span className="text-2xl font-bold text-indigo-600">
                                        {currentTicket.ticket_number}
                                    </span>
                                </div>
                                <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">
                                    En cours
                                </span>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>
                                        {currentTicket.client?.first_name || 'Client'} 
                                        {currentTicket.client?.last_name ? ` ${currentTicket.client.last_name}` : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>Attente: {currentTicket.estimated_wait_time || 0} min</span>
                                </div>
                                {currentTicket.client?.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <span>{currentTicket.client.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedTicket(currentTicket);
                                setShowQRModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            <QrCode className="w-4 h-4" />
                            QR Code
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleComplete}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Service rendu
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                            Annuler
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 md:p-12 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-600">Aucun ticket en cours</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {isPaused ? 'Guichet en pause' : 'Appelez le prochain client'}
                    </p>
                </div>
            )}

            {/* Call Button */}
            <button
                onClick={handleCallNext}
                disabled={isPaused || !!currentTicket || tickets.length === 0}
                className={`w-full py-4 rounded-lg text-lg font-semibold flex items-center justify-center gap-3 transition-colors ${
                    isPaused || currentTicket || tickets.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
                <Bell className="w-6 h-6" />
                {isPaused ? 'Guichet en pause' : 
                 currentTicket ? 'Ticket en cours' :
                 tickets.length === 0 ? 'Aucun client en attente' :
                 'Appeler le prochain client'}
            </button>

            {/* Queue List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="font-semibold text-gray-900">
                            File d'attente ({tickets.length})
                        </h2>
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {filteredTickets.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>{searchTerm ? 'Aucun résultat' : 'File d\'attente vide'}</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket, index) => (
                            <div
                                key={ticket.id}
                                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                                    ticket.id === currentTicket?.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-400 w-8">
                                        #{index + 1}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {ticket.ticket_number}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 hidden sm:inline">
                                        {ticket.client?.first_name || 'Client'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        ticket.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                                        ticket.status === 'called' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {ticket.status === 'waiting' ? 'En attente' :
                                         ticket.status === 'called' ? 'Appelé' : 'En file'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* QR Modal */}
            {showQRModal && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">QR Code</h3>
                            <button 
                                onClick={() => setShowQRModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600 mb-2">
                                {selectedTicket.ticket_number}
                            </div>
                            <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                                    <QrCode className="w-32 h-32 text-indigo-600" />
                                </div>
                            </div>
                            <p className="text-gray-600 font-medium">
                                {selectedTicket.client?.first_name || 'Client'} {selectedTicket.client?.last_name || ''}
                            </p>
                            <p className="text-sm text-gray-400">{selectedTicket.client?.phone || ''}</p>
                        </div>
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentQueue;