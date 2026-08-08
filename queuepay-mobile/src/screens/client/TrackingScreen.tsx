import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

interface Ticket {
  id: string;
  ticket_number: string;
  status: string;
  position: number;
  estimated_wait_time: number;
  service_id: string;
  created_at: string;
  waiting_count?: number;
  service?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export default function TrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { ticketId } = route.params as { ticketId: string };
  const { user } = useAuth();
  const { t } = useLanguage();
  const { socket, isConnected, joinService, leaveService } = useSocket();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('pending');
  const [isCalled, setIsCalled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [showCallAlert, setShowCallAlert] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // ✅ Animation de pulsation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ✅ Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ Démarrer le compte à rebours
  const startCountdown = (minutes: number) => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    const totalSeconds = Math.max(minutes * 60, 0);
    setCountdownSeconds(totalSeconds);
    
    if (totalSeconds > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev <= 1) {
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // ✅ Formater le temps en minutes:secondes
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Mettre à jour la progression
  const updateProgress = (currentPosition: number, totalWaiting: number) => {
    if (currentPosition > 0 && totalWaiting > 0) {
      const progressValue = 1 - (currentPosition / totalWaiting);
      setProgress(Math.max(0, Math.min(1, progressValue)));
    } else if (currentPosition === 1 && totalWaiting === 0) {
      setProgress(1);
    } else {
      setProgress(0);
    }
  };

  // ✅ Charger les données du ticket
  const fetchTicket = async () => {
    try {
      const response = await api.get(`/api/client/tickets/${ticketId}`);
      const data = response.data;
      
      const ticketWithUser = {
        ...data,
        user: {
          id: user?.id || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          email: user?.email || '',
          phone: user?.phone || '',
        }
      };
      
      setTicket(ticketWithUser);
      setPosition(data.position || 0);
      setEstimatedTime(data.estimated_wait_time || 0);
      setStatus(data.status || 'pending');
      
      const waitingCountData = data.waiting_count || data.waitingCount || 0;
      setWaitingCount(waitingCountData);
      
      if (data.status === 'called') {
        setIsCalled(true);
        setShowCallAlert(true);
        setPosition(1);
        setProgress(1);
        Toast.show({
          type: 'success',
          text1: '🔔 C\'est votre tour !',
          text2: `Ticket ${data.ticket_number} appelé au guichet`,
          position: 'bottom',
          visibilityTime: 10000,
        });
      }
      
      if (data.status === 'completed') {
        setIsCompleted(true);
        Toast.show({
          type: 'success',
          text1: '✅ Service rendu !',
          text2: 'Merci d\'avoir utilisé QueuePay',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
      
      if (data.estimated_wait_time && data.estimated_wait_time > 0 && data.status !== 'called') {
        startCountdown(data.estimated_wait_time);
      }
      
      if (data.position && waitingCountData) {
        updateProgress(data.position, waitingCountData);
      }
    } catch (error) {
      console.error('Erreur chargement ticket:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations du ticket');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ WebSocket - Écouter les mises à jour
  useEffect(() => {
    if (!socket || !isConnected || !ticket) {
      console.log('⏳ [Tracking] Socket non disponible');
      return;
    }

    console.log('📡 [Tracking] Connexion WebSocket pour le ticket:', ticketId);
    
    socket.emit('track-ticket', { ticketId });
    console.log('📡 [Tracking] Émission track-ticket pour rejoindre la room:', ticketId);
    
    if (ticket.service_id) {
      joinService(ticket.service_id);
      console.log('📡 [Tracking] Rejoint le service:', ticket.service_id);
    }

    const onPositionUpdate = (data: any) => {
      console.log('📢 [Tracking] Position mise à jour reçue!', data);
      if (data.ticketId === ticketId) {
        const newPosition = data.position || 0;
        const newWaitingCount = data.waitingCount || waitingCount;
        const newEstimatedTime = data.estimatedTime || estimatedTime;
        
        console.log(`📊 [Tracking] Nouvelle position: ${newPosition}, File: ${newWaitingCount}, Attente: ${newEstimatedTime}`);
        
        setPosition(newPosition);
        setWaitingCount(newWaitingCount);
        setEstimatedTime(newEstimatedTime);
        
        updateProgress(newPosition, newWaitingCount);
        
        if (newEstimatedTime && newEstimatedTime > 0) {
          startCountdown(newEstimatedTime);
        }
        
        if (data.status) {
          setStatus(data.status);
        }
      }
    };

    const onYouAreCalled = (data: any) => {
      console.log('📢 [Tracking] Vous êtes appelé reçu!', data);
      if (data.ticketId === ticketId) {
        setIsCalled(true);
        setShowCallAlert(true);
        setStatus('called');
        setPosition(1);
        setProgress(1);
        setCountdownSeconds(0);
        
        Toast.show({
          type: 'success',
          text1: '🔔 C\'est votre tour !',
          text2: `Ticket ${ticket.ticket_number} appelé au guichet`,
          position: 'bottom',
          visibilityTime: 10000,
        });
      }
    };

    const onTicketCompleted = (data: any) => {
      console.log('📢 [Tracking] Ticket complété reçu!', data);
      if (data.ticketId === ticketId) {
        setIsCompleted(true);
        setStatus('completed');
        setProgress(1);
        
        Toast.show({
          type: 'success',
          text1: '✅ Service rendu !',
          text2: 'Merci d\'avoir utilisé QueuePay',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    };

    const onQueueUpdated = (data: any) => {
      console.log('📢 [Tracking] File mise à jour reçue:', data);
      if (data.serviceId === ticket.service_id) {
        setWaitingCount(data.waitingCount || 0);
      }
    };

    const onTicketCancelled = (data: any) => {
      console.log('📢 [Tracking] Ticket annulé reçu:', data);
      if (data.ticketId === ticketId) {
        setStatus('cancelled');
        Toast.show({
          type: 'error',
          text1: '❌ Ticket annulé',
          text2: 'Votre ticket a été annulé',
          position: 'bottom',
        });
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    };

    socket.on('position-update', onPositionUpdate);
    socket.on('you-are-called', onYouAreCalled);
    socket.on('queue-updated', onQueueUpdated);
    socket.on('ticket-completed', onTicketCompleted);
    socket.on('ticket-cancelled', onTicketCancelled);

    console.log('📡 [Tracking] Écouteurs enregistrés avec succès');

    return () => {
      console.log('🧹 [Tracking] Nettoyage des écouteurs');
      socket.off('position-update', onPositionUpdate);
      socket.off('you-are-called', onYouAreCalled);
      socket.off('queue-updated', onQueueUpdated);
      socket.off('ticket-completed', onTicketCompleted);
      socket.off('ticket-cancelled', onTicketCancelled);
      
      if (ticket.service_id) {
        leaveService(ticket.service_id);
      }
      
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [socket, isConnected, ticket, ticketId]);

  // ✅ Chargement initial
  useEffect(() => {
    fetchTicket();
    
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  // ✅ Annuler le ticket
  const handleCancelTicket = () => {
    Alert.alert(
      'Annuler le ticket',
      'Voulez-vous vraiment annuler votre ticket ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/api/client/tickets/${ticketId}/cancel`);
              Toast.show({
                type: 'success',
                text1: 'Ticket annulé',
                text2: 'Votre ticket a été annulé avec succès',
                position: 'bottom',
              });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'annuler le ticket');
            }
          }
        }
      ]
    );
  };

  // ✅ Partager le QR Code
  const shareQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        ticketId: ticket?.id,
        ticketNumber: ticket?.ticket_number,
        serviceName: ticket?.service?.name,
        clientName: `${user?.first_name || ''} ${user?.last_name || ''}`,
        clientEmail: user?.email,
        clientPhone: user?.phone,
        status: ticket?.status,
        position: ticket?.position,
        timestamp: new Date().toISOString(),
      });
      
      await Share.share({
        message: `🎫 Ticket ${ticket?.ticket_number}\nService: ${ticket?.service?.name}\nClient: ${user?.first_name} ${user?.last_name}\n\nScannez ce QR Code pour valider le ticket.`,
        title: 'Partager le ticket',
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  // ✅ Générer les données du QR Code
  const getQRData = () => {
    if (!ticket) return '';
    
    const qrData = {
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      serviceName: ticket.service?.name || 'Service',
      clientName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      clientEmail: user?.email || '',
      clientPhone: user?.phone || '',
      status: ticket.status,
      position: ticket.position,
      estimatedTime: ticket.estimated_wait_time,
      createdAt: ticket.created_at,
      serviceId: ticket.service_id,
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(qrData);
  };

  const getStatusInfo = () => {
    const statuses: { [key: string]: { label: string; color: string; icon: string } } = {
      pending: { label: 'En file', color: '#3B82F6', icon: 'time-outline' },
      waiting: { label: 'En attente', color: '#F59E0B', icon: 'hourglass-outline' },
      called: { label: 'Appelé !', color: '#10B981', icon: 'call-outline' },
      completed: { label: 'Terminé', color: '#6B7280', icon: 'checkmark-circle-outline' },
      cancelled: { label: 'Annulé', color: '#EF4444', icon: 'close-circle-outline' },
    };
    return statuses[status] || statuses.pending;
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement de votre ticket...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
        <Text style={styles.loadingText}>Ticket non trouvé</Text>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#10B981" />
        <Text style={[styles.loadingText, { color: '#10B981', fontSize: 20, fontWeight: 'bold' }]}>
          ✅ Service rendu !
        </Text>
        <Text style={[styles.loadingText, { color: '#6B7280' }]}>
          Merci d'avoir utilisé QueuePay
        </Text>
        <Text style={[styles.loadingText, { color: '#9CA3AF', fontSize: 12, marginTop: 20 }]}>
          Retournez à "Mes tickets" pour voir votre historique
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTicket} />
        }
      >
        <LinearGradient
          colors={['#4F46E5', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Suivi du ticket</Text>
            <View style={{ width: 40 }} />
          </Animated.View>
        </LinearGradient>

        <Animated.View style={[styles.ticketCard, { opacity: fadeAnim }]}>
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.ticketLabel}>Votre ticket</Text>
              <Animated.Text style={[styles.ticketNumber, { transform: [{ scale: pulseAnim }] }]}>
                {ticket.ticket_number}
              </Animated.Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
              <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.ticketService}>
            <Ionicons name="business-outline" size={16} color="#6B7280" />
            <Text style={styles.ticketServiceText}>
              {ticket.service?.name || 'Service'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: position === 1 && position !== null ? '#10B981' : '#4F46E5' }]}>
                {position !== null ? position : '-'}
                {position === 1 && !isCalled && (
                  <Text style={{ fontSize: 12, color: '#10B981', marginLeft: 4 }}>⭐</Text>
                )}
              </Text>
              <Text style={styles.statLabel}>Position</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {isCalled ? (
                  '0:00'
                ) : estimatedTime !== null && estimatedTime > 0 ? (
                  formatCountdown(countdownSeconds)
                ) : (
                  '-'
                )}
              </Text>
              <Text style={styles.statLabel}>Attente estimée</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: waitingCount > 0 ? '#EF4444' : '#6B7280' }]}>
                {waitingCount || 0}
              </Text>
              <Text style={styles.statLabel}>En file</Text>
            </View>
          </View>

          {status !== 'completed' && status !== 'cancelled' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progression</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
                      backgroundColor: isCalled ? '#10B981' : '#4F46E5',
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {showCallAlert && (
            <Animated.View 
              style={[
                styles.calledContainer,
                {
                  transform: [{
                    scale: pulseAnim
                  }]
                }
              ]}
            >
              <Ionicons name="call-outline" size={32} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.calledTitle}>🎉 C'est votre tour !</Text>
                <Text style={styles.calledText}>
                  Présentez-vous au guichet avec votre ticket
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ✅ QR CODE AMÉLIORÉ */}
          <TouchableOpacity
            style={styles.qrContainer}
            onPress={() => setShowQRModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.qrBox}>
              <QRCode
                value={getQRData()}
                size={120}
                color="#4F46E5"
                backgroundColor="#ffffff"
                logoSize={30}
                logoBackgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.qrText}>Appuyez pour agrandir le QR Code</Text>
            
            <View style={styles.qrInfoCompact}>
              <View style={styles.qrInfoRow}>
                <Ionicons name="person-outline" size={14} color="#6B7280" />
                <Text style={styles.qrInfoText}>
                  {user?.first_name} {user?.last_name}
                </Text>
              </View>
              <View style={styles.qrInfoRow}>
                <Ionicons name="ticket-outline" size={14} color="#6B7280" />
                <Text style={styles.qrInfoText}>{ticket.ticket_number}</Text>
              </View>
              <View style={styles.qrInfoRow}>
                <Ionicons name="business-outline" size={14} color="#6B7280" />
                <Text style={styles.qrInfoText}>{ticket.service?.name || 'Service'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.connectionStatus}>
          <View style={[styles.connectionDot, isConnected ? styles.connected : styles.disconnected]} />
          <Text style={styles.connectionText}>
            {isConnected ? '🟢 Mises à jour en temps réel' : '🔴 Hors ligne - actualisez manuellement'}
          </Text>
        </View>

        {status !== 'completed' && status !== 'cancelled' && status !== 'called' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelTicket}
          >
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Annuler le ticket</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ✅ MODAL QR CODE AMÉLIORÉ */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQRModal(false)}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎫 Ticket</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* QR Code */}
            <View style={styles.modalQRContainer}>
              <QRCode
                value={getQRData()}
                size={200}
                color="#4F46E5"
                backgroundColor="#ffffff"
                logoSize={40}
                logoBackgroundColor="#ffffff"
              />
              <Text style={styles.modalQRNumber}>{ticket.ticket_number}</Text>
              <Text style={styles.modalQRStatus}>
                {status === 'pending' && '🟦 En file'}
                {status === 'waiting' && '🟨 En attente'}
                {status === 'called' && '🟢 Appelé !'}
                {status === 'completed' && '✅ Terminé'}
                {status === 'cancelled' && '❌ Annulé'}
              </Text>
            </View>

            {/* Informations du client */}
            <View style={styles.modalInfoContainer}>
              <Text style={styles.modalInfoTitle}>📋 Informations du client</Text>
              
              <View style={styles.modalInfoCard}>
                <View style={styles.modalInfoIcon}>
                  <Ionicons name="person" size={18} color="#4F46E5" />
                </View>
                <View style={styles.modalInfoContent}>
                  <Text style={styles.modalInfoLabel}>Client</Text>
                  <Text style={styles.modalInfoValue}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoCard}>
                <View style={[styles.modalInfoIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="mail" size={18} color="#3B82F6" />
                </View>
                <View style={styles.modalInfoContent}>
                  <Text style={styles.modalInfoLabel}>Email</Text>
                  <Text style={styles.modalInfoValue}>{user?.email || '-'}</Text>
                </View>
              </View>

              <View style={styles.modalInfoCard}>
                <View style={[styles.modalInfoIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="call" size={18} color="#10B981" />
                </View>
                <View style={styles.modalInfoContent}>
                  <Text style={styles.modalInfoLabel}>Téléphone</Text>
                  <Text style={styles.modalInfoValue}>{user?.phone || 'Non renseigné'}</Text>
                </View>
              </View>
            </View>

            {/* Détails du ticket */}
            <View style={styles.modalInfoContainer}>
              <Text style={styles.modalInfoTitle}>🎯 Détails du ticket</Text>
              
              <View style={styles.modalInfoGrid}>
                <View style={styles.modalInfoGridItem}>
                  <Text style={styles.modalInfoGridLabel}>Numéro</Text>
                  <Text style={styles.modalInfoGridValue}>{ticket.ticket_number}</Text>
                </View>
                <View style={styles.modalInfoGridItem}>
                  <Text style={styles.modalInfoGridLabel}>Service</Text>
                  <Text style={styles.modalInfoGridValue}>{ticket.service?.name || 'Service'}</Text>
                </View>
                <View style={styles.modalInfoGridItem}>
                  <Text style={styles.modalInfoGridLabel}>Position</Text>
                  <Text style={styles.modalInfoGridValue}>{position || 0}ème</Text>
                </View>
                <View style={styles.modalInfoGridItem}>
                  <Text style={styles.modalInfoGridLabel}>Attente</Text>
                  <Text style={styles.modalInfoGridValue}>
                    {estimatedTime || 0} min
                  </Text>
                </View>
              </View>
            </View>

            {/* Boutons d'action */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalShareButton}
                onPress={shareQRCode}
              >
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  style={styles.modalShareGradient}
                >
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text style={styles.modalShareText}>Partager</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  ticketCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ticketService: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ticketServiceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  calledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  calledTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
  },
  calledText: {
    fontSize: 14,
    color: '#065F46',
  },
  qrContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  qrBox: {
    width: 130,
    height: 130,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  qrText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  qrInfoCompact: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  qrInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qrInfoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#10B981',
  },
  disconnected: {
    backgroundColor: '#EF4444',
  },
  connectionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  // ===== MODAL AMÉLIORÉ =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '95%',
    maxWidth: 400,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalQRContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 16,
  },
  modalQRNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginTop: 12,
  },
  modalQRStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  modalInfoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  modalInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modalInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  modalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalInfoGridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  modalInfoGridLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  modalInfoGridValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalShareButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalShareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  modalShareText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalCloseButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
});