// web-app/src/pages/agent/QueueCreneau.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
    Search,
    Calendar,
    CalendarDays,
    Hourglass
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { agent } from '../../services/api';
import toast from 'react-hot-toast';

const QueueCreneau = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { serviceId, serviceName } = location.state || {};

    const { socket, isConnected, emit, on, off } = useSocket();

    // ========== ÉTATS ==========
    const [tickets, setTickets] = useState([]);
    const [currentTicket, setCurrentTicket] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        waiting: 0,
        called: 0,
        completed: 0,
        totalSlots: 0,
        waitingSlots: 0,
        calledSlots: 0,
        totalRegular: 0,
        waitingRegular: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // ========== API ==========
    const fetchQueueData = useCallback(async () => {
        if (!serviceId) {
            navigate('/agent/dashboard');
            return;
        }

        try {
            console.log('🔄 [QueueCreneau] Appel API pour service:', serviceId);
            const response = await agent.getQueueSlotStatus(serviceId);
            const data = response.data;

            const allTickets = [...(data.slots || []), ...(data.regular || [])];
            setTickets(allTickets);
            
            setStats({
                total: (data.stats?.total_slots || 0) + (data.stats?.total_regular || 0),
                waiting: (data.stats?.waiting_slots || 0) + (data.stats?.waiting_regular || 0),
                called: data.stats?.called_slots || 0,
                completed: data.completed || 0,
                totalSlots: data.stats?.total_slots || 0,
                waitingSlots: data.stats?.waiting_slots || 0,
                calledSlots: data.stats?.called_slots || 0,
                totalRegular: data.stats?.total_regular || 0,
                waitingRegular: data.stats?.waiting_regular || 0
            });

            setCurrentTicket(data.currentTicket || null);
        } catch (error) {
            console.error('❌ [QueueCreneau] Erreur:', error);
            toast.error('Erreur lors du chargement de la file');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [serviceId, navigate]);

    // ========== WEBSOCKET ==========
    useEffect(() => {
        if (!socket || !isConnected || !serviceId) return;

        console.log('📡 [QueueCreneau] Connexion WebSocket');
        emit('agent-connect', { serviceId });

        const onQueueUpdate = () => fetchQueueData();
        const onNewTicket = () => fetchQueueData();

        on('queue-updated', onQueueUpdate);
        on('new-ticket', onNewTicket);

        return () => {
            off('queue-updated', onQueueUpdate);
            off('new-ticket', onNewTicket);
        };
    }, [socket, isConnected, serviceId, emit, on, off, fetchQueueData]);

    // ========== CHARGEMENT INITIAL ==========
    useEffect(() => {
        if (serviceId) {
            fetchQueueData();
        } else {
            navigate('/agent/dashboard');
        }
    }, [serviceId, fetchQueueData, navigate]);

    // ========== AUTO-REFRESH ==========
    useEffect(() => {
        if (serviceId) {
            const interval = setInterval(fetchQueueData, 10000);
            return () => clearInterval(interval);
        }
    }, [serviceId, fetchQueueData]);

    // ========== COMPTE À REBOURS ==========
    const getCountdown = (appointmentDate, appointmentTime) => {
        if (!appointmentDate || !appointmentTime) return null;
        
        const now = new Date();
        const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
        const diffMs = appointmentDateTime.getTime() - now.getTime();

        if (diffMs <= 0) {
            return { isPast: true, display: 'Prêt à appeler', isReady: true };
        }

        const diffSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(diffSeconds / 86400);
        const hours = Math.floor((diffSeconds % 86400) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;

        let display = '';
        if (days > 0) display += `${days}j `;
        if (hours > 0 || days > 0) display += `${hours}h `;
        if (minutes > 0) display += `${minutes}min `;
        display += `${seconds}s`;

        return { isPast: false, display, isReady: false };
    };

    // ========== ACTIONS ==========
    const handleCallNext = async (ticketId) => {
        if (isPaused) {
            toast.error('Guichet en pause');
            return;
        }

        try {
            const response = await agent.callSlotNext(ticketId);
            setCurrentTicket(response.data.ticket);
            toast.success(`🔔 Client appelé ! ${response.data.ticket.ticket_number}`);
            fetchQueueData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erreur lors de l\'appel');
        }
    };

    const handleComplete = async () => {
        if (!currentTicket) {
            toast.error('Aucun ticket en cours');
            return;
        }

        if (!window.confirm(`Service rendu pour ${currentTicket.ticket_number} ?`)) return;

        try {
            await agent.completeTicket(currentTicket.id);
            setCurrentTicket(null);
            toast.success('✅ Service complété !');
            fetchQueueData();
        } catch (error) {
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
            toast.error('Erreur lors de l\'annulation');
        }
    };

    // ========== FILTRAGE ==========
    const getFilteredTickets = () => {
        let filtered = tickets;

        if (activeTab === 'slots') {
            filtered = filtered.filter(t => t.appointment_date !== null);
        } else if (activeTab === 'regular') {
            filtered = filtered.filter(t => t.appointment_date === null);
        }

        if (searchTerm) {
            filtered = filtered.filter(ticket =>
                ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ticket.client?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ticket.client?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredTickets = getFilteredTickets();

    // ========== RENDU ==========
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ✅ HEADER SUPPRIMÉ - Déjà géré par AgentLayout */}

            {/* STATS GÉNÉRAUX */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                    <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-yellow-100">
                    <p className="text-2xl font-bold text-yellow-600">{stats.waiting || 0}</p>
                    <p className="text-sm text-gray-500">En attente</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">{stats.called || 0}</p>
                    <p className="text-sm text-gray-500">Appelés</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-green-100">
                    <p className="text-2xl font-bold text-green-600">{stats.completed || 0}</p>
                    <p className="text-sm text-gray-500">Servis</p>
                </div>
            </div>

            {/* STATS RDV vs SANS RDV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <span className="font-medium text-purple-700">Rendez-vous</span>
                        </div>
                        <span className="text-2xl font-bold text-purple-700">{stats.totalSlots || 0}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-purple-600">En attente: {stats.waitingSlots || 0}</span>
                        <span className="text-purple-600">Appelés: {stats.calledSlots || 0}</span>
                    </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-700">Sans RDV</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-700">{stats.totalRegular || 0}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-blue-600">En attente: {stats.waitingRegular || 0}</span>
                    </div>
                </div>
            </div>

            {/* ONGLETS */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'all'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Tous ({tickets.length})
                </button>
                <button
                    onClick={() => setActiveTab('slots')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'slots'
                            ? 'text-purple-600 border-b-2 border-purple-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📅 Rendez-vous ({stats.totalSlots})
                </button>
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'regular'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    👤 Sans RDV ({stats.totalRegular})
                </button>
            </div>

            {/* TICKET EN COURS */}
            {currentTicket ? (
                <div className="bg-white rounded-lg shadow-lg border-2 border-indigo-500 p-6">
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
                                {currentTicket.appointment_date && (
                                    <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded-full">
                                        📅 RDV
                                    </span>
                                )}
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
                                {currentTicket.appointment_date && (
                                    <div className="flex items-center gap-2 text-purple-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            RDV: {new Date(currentTicket.appointment_date + 'T00:00:00').toLocaleDateString('fr-FR')} à {currentTicket.appointment_time?.substring(0, 5)}
                                        </span>
                                    </div>
                                )}
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

            {/* LISTE DES TICKETS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="font-semibold text-gray-900">
                            File d'attente ({filteredTickets.length})
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
                        filteredTickets.map((ticket, index) => {
                            const countdown = ticket.appointment_date && ticket.appointment_time 
                                ? getCountdown(ticket.appointment_date, ticket.appointment_time)
                                : null;
                            
                            const isReady = countdown?.isReady || ticket.appointment_date === null;
                            const isSlot = ticket.appointment_date !== null;

                            return (
                                <div
                                    key={ticket.id}
                                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                                        ticket.id === currentTicket?.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <span className="text-sm font-medium text-gray-400 w-8">
                                            #{index + 1}
                                        </span>
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                {ticket.ticket_number}
                                            </span>
                                            {isSlot && (
                                                <div className="flex items-center gap-2 text-xs text-purple-600 mt-1">
                                                    <CalendarDays className="w-3 h-3" />
                                                    <span>
                                                        {new Date(ticket.appointment_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} 
                                                        à {ticket.appointment_time?.substring(0, 5)}
                                                    </span>
                                                </div>
                                            )}
                                            {isSlot && countdown && !countdown.isReady && (
                                                <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                                                    <Hourglass className="w-3 h-3" />
                                                    <span>⏳ {countdown.display}</span>
                                                </div>
                                            )}
                                        </div>
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
                                        {isSlot && ticket.status === 'pending' && (
                                            <button
                                                onClick={() => handleCallNext(ticket.id)}
                                                disabled={!isReady || isPaused || !!currentTicket}
                                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                    !isReady || isPaused || currentTicket
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                            >
                                                {!isReady ? '⏳ Attente' : '📞 Appeler'}
                                            </button>
                                        )}
                                        {!isSlot && ticket.status === 'pending' && (
                                            <button
                                                onClick={() => handleCallNext(ticket.id)}
                                                disabled={isPaused || !!currentTicket}
                                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                    isPaused || currentTicket
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                            >
                                                📞 Appeler
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* QR MODAL */}
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

export default QueueCreneau;