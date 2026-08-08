// web-app/src/components/agent/AgentLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AgentLayout = () => {
    const { socket, isConnected, emit, on, off } = useSocket();
    const { user } = useAuth();
    const location = useLocation();

    // ========== CONNEXION WEBSOCKET ==========
    useEffect(() => {
        if (!socket || !isConnected || !user) {
            console.log('⏳ [AgentLayout] Socket pas prêt');
            return;
        }

        console.log('✅ [AgentLayout] Socket connecté, ID:', socket.id);
        console.log('✅ [AgentLayout] Agent:', user.email, user.id);
        console.log('✅ [AgentLayout] Services assignés:', user.assigned_services || []);

        if (user.assigned_services && user.assigned_services.length > 0) {
            user.assigned_services.forEach(serviceId => {
                console.log(`📡 [AgentLayout] Rejoint service: ${serviceId}`);
                emit('agent-connect', { serviceId });
            });
        } else {
            console.warn('⚠️ [AgentLayout] Aucun service assigné à cet agent');
        }

        const onGlobalNotification = (data) => {
            console.log('🔔 [AgentLayout] Notification reçue:', data);
            if (data.type === 'new-ticket') {
                toast.success(`🎫 Nouveau ticket ${data.ticketNumber}`);
            }
        };

        on('global-notification', onGlobalNotification);

        return () => {
            console.log('🧹 [AgentLayout] Nettoyage');
            off('global-notification', onGlobalNotification);
        };
    }, [socket, isConnected, user]);

    // ========== RENDU ==========
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64">
                {/* ❌ HEADER SUPPRIMÉ - Chaque page gère son propre header */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AgentLayout;