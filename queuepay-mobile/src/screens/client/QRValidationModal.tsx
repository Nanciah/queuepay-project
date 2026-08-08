// components/common/QRValidationModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface QRData {
  ticketId: string;
  ticketNumber: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  position: number;
  estimatedTime: number;
  serviceId: string;
  timestamp: string;
}

interface QRValidationModalProps {
  visible: boolean;
  data: QRData | null;
  onClose: () => void;
  onValidate: () => void;
}

export default function QRValidationModal({
  visible,
  data,
  onClose,
  onValidate,
}: QRValidationModalProps) {
  if (!data) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#3B82F6';
      case 'waiting': return '#F59E0B';
      case 'called': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '🟦 En file';
      case 'waiting': return '🟨 En attente';
      case 'called': return '🟢 Appelé';
      case 'completed': return '✅ Terminé';
      case 'cancelled': return '❌ Annulé';
      default: return status;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="qr-code" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.headerTitle}>Validation du ticket</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Contenu */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Numéro du ticket */}
            <View style={styles.ticketNumberContainer}>
              <Text style={styles.ticketNumber}>{data.ticketNumber}</Text>
              <Text style={styles.ticketNumberLabel}>Numéro de ticket</Text>
            </View>

            {/* Statut */}
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(data.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
                {getStatusLabel(data.status)}
              </Text>
            </View>

            {/* Informations du client */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Client</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color="#6B7280" />
                  <Text style={styles.infoText}>{data.clientName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <Text style={styles.infoText}>{data.clientEmail || 'Non renseigné'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color="#6B7280" />
                  <Text style={styles.infoText}>{data.clientPhone || 'Non renseigné'}</Text>
                </View>
              </View>
            </View>

            {/* Informations du service */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏢 Service</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={20} color="#6B7280" />
                  <Text style={styles.infoText}>{data.serviceName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#6B7280" />
                  <Text style={styles.infoText}>Position: {data.position}ème</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.infoText}>Attente: {data.estimatedTime} min</Text>
                </View>
              </View>
            </View>

            {/* Boutons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.validateButton} onPress={onValidate}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.validateGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.validateText}>Valider le ticket</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '95%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  ticketNumberContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  ticketNumberLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  actions: {
    marginTop: 8,
  },
  validateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  validateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  validateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});