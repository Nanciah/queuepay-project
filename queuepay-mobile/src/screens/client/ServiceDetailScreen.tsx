import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import AppointmentSelector from '../../components/client/AppointmentSelector';

const { width } = Dimensions.get('window');

// ============================================
// 1. DÉFINIR LES TYPES DE NAVIGATION
// ============================================
type RootStackParamList = {
  ServiceDetail: { id: string };
  Tracking: { ticketId: string };
  Services: undefined;
  Wallet: undefined;
  Profile: undefined;
  MyTickets: undefined;
  Home: undefined;
};

type ServiceDetailScreenRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;
type ServiceDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ServiceDetail'>;

// ============================================
// 2. INTERFACE DU SERVICE
// ============================================
interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  ticket_price: number;
  estimated_duration: number;
  is_active: boolean;
  allow_appointment?: boolean;
  entity: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  };
}

// ============================================
// 3. COMPOSANT PRINCIPAL
// ============================================
export default function ServiceDetailScreen() {
  // ✅ NAVIGATION AVEC TYPAGE
  const navigation = useNavigation<ServiceDetailScreenNavigationProp>();
  const route = useRoute<ServiceDetailScreenRouteProp>();
  const { id } = route.params;

  const { user } = useAuth();
  const { t } = useLanguage();
  const { isConnected } = useSocket();

  // ===== ÉTATS =====
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ✅ ÉTATS POUR LE RENDEZ-VOUS
  const [showAppointmentSelector, setShowAppointmentSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // ===== CHARGEMENT =====
  useEffect(() => {
    fetchServiceDetails();
  }, []);

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/api/client/services/${id}`);
      setService(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du service');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // ===== UTILITAIRES =====
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      health: 'medical-outline',
      banking: 'business-outline',
      administration: 'build-outline',
      commerce: 'cart-outline',
      transport: 'car-outline',
      education: 'school-outline',
      other: 'grid-outline',
    };
    return icons[category] || 'grid-outline';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      health: '#10B981',
      banking: '#3B82F6',
      administration: '#8B5CF6',
      commerce: '#F59E0B',
      transport: '#EF4444',
      education: '#EC4899',
      other: '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  // ===== GESTION RENDEZ-VOUS =====
  const handleReserveWithAppointment = (date: string, time: string, slotId: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedSlotId(slotId);
    setShowAppointmentSelector(false);
    setShowPayment(true);
  };

  // ===== RÉSERVATION =====
  const handleReserve = async () => {
    if (paymentMethod !== 'wallet' && !phoneNumber) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    setIsProcessing(true);

    try {
      // Simuler un paiement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ✅ PRÉPARER LES DONNÉES AVEC LE RENDEZ-VOUS
      const data: any = {
        service_id: id,
        payment_method: paymentMethod,
        phone_number: phoneNumber || undefined,
      };

      // ✅ AJOUTER LES INFORMATIONS DE RENDEZ-VOUS SI SÉLECTIONNÉES
      if (selectedDate && selectedTime && selectedSlotId) {
        data.appointment_date = selectedDate;
        data.appointment_time = selectedTime;
        data.time_slot_id = selectedSlotId;
      }

      // Créer le ticket
      const response = await api.post('/api/client/tickets', data);

      Toast.show({
        type: 'success',
        text1: '🎫 Ticket réservé !',
        text2: `Ticket ${response.data.ticket.ticket_number}`,
        position: 'bottom',
        visibilityTime: 4000,
      });

      setShowPayment(false);
      
      // Réinitialiser les états de rendez-vous
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedSlotId(null);
      
      // ✅ NAVIGATION AVEC TYPAGE (SOLUTION 2 - PROPRE)
      navigation.navigate('Tracking', { ticketId: response.data.ticket.id });

    } catch (error: any) {
      console.error('Erreur réservation:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.error || 'Erreur lors de la réservation'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== RENDU =====
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
        <Text style={styles.loadingText}>Service non trouvé</Text>
      </View>
    );
  }

  const categoryColor = getCategoryColor(service.category);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#4F46E5', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}30` }]}>
              <Ionicons name={getCategoryIcon(service.category) as any} size={20} color="#fff" />
              <Text style={styles.categoryText}>{service.category}</Text>
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
          </View>
        </LinearGradient>

        {/* Infos du service */}
        <View style={styles.content}>
          {service.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          )}

          {/* Infos entreprise */}
          {service.entity && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entreprise</Text>
              <View style={styles.companyCard}>
                <View style={styles.companyHeader}>
                  <View style={styles.companyAvatar}>
                    <Text style={styles.companyInitials}>
                      {service.entity.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{service.entity.name}</Text>
                    <View style={styles.companyMeta}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.companyMetaText}>
                        {service.entity.city || 'Madagascar'}
                      </Text>
                    </View>
                  </View>
                </View>
                {service.entity.phone && (
                  <View style={styles.companyContact}>
                    <Ionicons name="call-outline" size={16} color="#4F46E5" />
                    <Text style={styles.companyContactText}>{service.entity.phone}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Détails du service */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={20} color="#4F46E5" />
                <Text style={styles.detailLabel}>Durée</Text>
                <Text style={styles.detailValue}>{service.estimated_duration || 15} min</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={20} color="#4F46E5" />
                <Text style={styles.detailLabel}>Prix</Text>
                <Text style={styles.detailValue}>{service.ticket_price || 0} Ar</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={service.is_active ? '#10B981' : '#EF4444'} />
                <Text style={styles.detailLabel}>Statut</Text>
                <Text style={[styles.detailValue, service.is_active ? styles.activeText : styles.inactiveText]}>
                  {service.is_active ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>
          </View>

          {/* ✅ BOUTON "PRENDRE RENDEZ-VOUS" */}
          {service.allow_appointment !== false && service.is_active && (
            <TouchableOpacity
              style={styles.appointmentButton}
              onPress={() => setShowAppointmentSelector(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF']}
                style={styles.appointmentGradient}
              >
                <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
                <Text style={styles.appointmentButtonText}>📅 Prendre rendez-vous</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Status de connexion */}
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, isConnected ? styles.connected : styles.disconnected]} />
            <Text style={styles.connectionText}>
              {isConnected ? '🟢 Mise à jour en temps réel' : '🔴 Hors ligne'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de réservation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.reserveButton, !service.is_active && styles.reserveButtonDisabled]}
          onPress={() => setShowPayment(true)}
          disabled={!service.is_active}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={service.is_active ? ['#4F46E5', '#6366F1'] : ['#9CA3AF', '#B0B8C4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.reserveGradient}
          >
            <Ionicons name="ticket-outline" size={20} color="#fff" />
            <Text style={styles.reserveButtonText}>
              {service.is_active ? 'Réserver maintenant' : 'Service indisponible'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal de paiement */}
      <Modal
        visible={showPayment}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayment(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paiement</Text>
              <TouchableOpacity onPress={() => setShowPayment(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* ✅ AFFICHER LE RENDEZ-VOUS SÉLECTIONNÉ */}
            {selectedDate && selectedTime && (
              <View style={styles.appointmentSummary}>
                <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
                <Text style={styles.appointmentSummaryText}>
                  📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long'
                  })} à {selectedTime.substring(0, 5)}
                </Text>
              </View>
            )}

            <View style={styles.paymentSummary}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Service</Text>
                <Text style={styles.paymentValue}>{service.name}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Montant</Text>
                <Text style={styles.paymentAmount}>{service.ticket_price || 0} Ar</Text>
              </View>
            </View>

            <Text style={styles.paymentMethodTitle}>Méthode de paiement</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.paymentMethod, paymentMethod === 'wallet' && styles.paymentMethodActive]}
                onPress={() => setPaymentMethod('wallet')}
              >
                <Ionicons name="wallet-outline" size={24} color={paymentMethod === 'wallet' ? '#4F46E5' : '#6B7280'} />
                <Text style={[styles.paymentMethodText, paymentMethod === 'wallet' && styles.paymentMethodTextActive]}>
                  Portefeuille
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethod, paymentMethod === 'mvola' && styles.paymentMethodActive]}
                onPress={() => setPaymentMethod('mvola')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === 'mvola' ? '#4F46E5' : '#6B7280'} />
                <Text style={[styles.paymentMethodText, paymentMethod === 'mvola' && styles.paymentMethodTextActive]}>
                  MVola
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethod, paymentMethod === 'orange' && styles.paymentMethodActive]}
                onPress={() => setPaymentMethod('orange')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === 'orange' ? '#4F46E5' : '#6B7280'} />
                <Text style={[styles.paymentMethodText, paymentMethod === 'orange' && styles.paymentMethodTextActive]}>
                  Orange Money
                </Text>
              </TouchableOpacity>
            </View>

            {paymentMethod !== 'wallet' && (
              <View style={styles.phoneInputContainer}>
                <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="034 00 000 00"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPayment(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleReserve}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ APPOINTMENT SELECTOR */}
      <AppointmentSelector
        visible={showAppointmentSelector}
        serviceId={id}
        serviceName={service?.name}
        onClose={() => setShowAppointmentSelector(false)}
        onSelect={(date, time, slotId) => {
          handleReserveWithAppointment(date, time, slotId);
        }}
      />

      <Toast />
    </View>
  );
}

// ============================================
// 4. STYLES
// ============================================
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
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 4,
    marginBottom: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textTransform: 'capitalize',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  companyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  companyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  companyMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  companyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  companyContactText: {
    fontSize: 13,
    color: '#4F46E5',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  activeText: {
    color: '#10B981',
  },
  inactiveText: {
    color: '#EF4444',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reserveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  reserveButtonDisabled: {
    opacity: 0.6,
  },
  reserveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  reserveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // ✅ STYLES POUR LE RENDEZ-VOUS
  appointmentButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  appointmentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appointmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  appointmentSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  appointmentSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentMethod: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  paymentMethodActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  paymentMethodTextActive: {
    color: '#4F46E5',
  },
  phoneInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});