import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  available: number;
  max_capacity: number;
  is_available: boolean;
}

interface SlotsByDate {
  [date: string]: TimeSlot[];
}

interface AppointmentSelectorProps {
  visible: boolean;
  serviceId: string;
  serviceName?: string;
  onClose: () => void;
  onSelect: (date: string, time: string, slotId: string) => void;
}

export default function AppointmentSelector({
  visible,
  serviceId,
  serviceName,
  onClose,
  onSelect,
}: AppointmentSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      fetchSlots();
    }
  }, [visible]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/client/services/${serviceId}/slots`);
      const data = response.data;
      
      console.log('📅 Créneaux reçus:', data);
      
      setSlotsByDate(data.slots || {});
      
      const dateKeys = Object.keys(data.slots || {});
      setDates(dateKeys);
      
      // Filtrer les dates avec des créneaux disponibles
      const available = dateKeys.filter(date => {
        const slots = data.slots[date] || [];
        return slots.some((slot: TimeSlot) => slot.available > 0);
      });
      setAvailableDates(available);
      
      if (available.length > 0) {
        setSelectedDate(available[0]);
      } else if (dateKeys.length > 0) {
        setSelectedDate(dateKeys[0]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement créneaux:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les créneaux disponibles',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return dateStr === tomorrowStr;
  };

  const getDateLabel = (dateStr: string) => {
    if (isToday(dateStr)) return "Aujourd'hui";
    if (isTomorrow(dateStr)) return "Demain";
    return formatDateShort(dateStr);
  };

  const handleSelectSlot = (slotId: string, time: string) => {
    setSelectedTime(time);
    setSelectedSlotId(slotId);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime && selectedSlotId) {
      onSelect(selectedDate, selectedTime, selectedSlotId);
    } else {
      Toast.show({
        type: 'error',
        text1: '⚠️ Sélection requise',
        text2: 'Veuillez choisir une date et une heure',
        position: 'bottom',
      });
    }
  };

  const getSlotsForDate = (date: string) => {
    return slotsByDate[date] || [];
  };

  const getAvailableSlotsForDate = (date: string) => {
    const slots = getSlotsForDate(date);
    return slots.filter(slot => slot.available > 0);
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Chargement des créneaux...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* ===== HEADER ===== */}
          <LinearGradient
            colors={['#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>📅 Prendre rendez-vous</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {serviceName && (
              <Text style={styles.headerSubtitle}>{serviceName}</Text>
            )}
          </LinearGradient>

          {/* ===== CONTENU ===== */}
          {availableDates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Aucun créneau disponible</Text>
              <Text style={styles.emptyText}>
                Aucun créneau n'est disponible pour ce service dans les prochains jours.
                Veuillez réessayer plus tard ou contacter le service.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={onClose}>
                <Text style={styles.emptyButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* ===== DATES ===== */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📆 Choisissez une date</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.datesScroll}
                  >
                    {availableDates.map((date) => {
                      const availableSlots = getAvailableSlotsForDate(date);
                      const isSelected = selectedDate === date;
                      const hasSlots = availableSlots.length > 0;
                      
                      return (
                        <TouchableOpacity
                          key={date}
                          style={[
                            styles.dateButton,
                            isSelected && styles.dateButtonActive,
                            !hasSlots && styles.dateButtonDisabled,
                          ]}
                          onPress={() => hasSlots && setSelectedDate(date)}
                          disabled={!hasSlots}
                        >
                          <Text style={styles.dateButtonDay}>
                            {getDateLabel(date)}
                          </Text>
                          <Text style={[
                            styles.dateButtonText,
                            isSelected && styles.dateButtonTextActive,
                            !hasSlots && styles.dateButtonTextDisabled,
                          ]}>
                            {formatDateShort(date)}
                          </Text>
                          {hasSlots && (
                            <View style={styles.dateButtonBadge}>
                              <Text style={styles.dateButtonBadgeText}>
                                {availableSlots.length} créneau{availableSlots.length > 1 ? 'x' : ''}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* ===== HEURES ===== */}
                {selectedDate && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏰ Choisissez une heure</Text>
                    <View style={styles.timesGrid}>
                      {getAvailableSlotsForDate(selectedDate).map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        const isAvailable = slot.available > 0;
                        
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[
                              styles.timeButton,
                              isSelected && styles.timeButtonActive,
                              !isAvailable && styles.timeButtonDisabled,
                            ]}
                            onPress={() => handleSelectSlot(slot.id, slot.start_time)}
                            disabled={!isAvailable}
                          >
                            <Text style={[
                              styles.timeButtonText,
                              isSelected && styles.timeButtonTextActive,
                              !isAvailable && styles.timeButtonTextDisabled,
                            ]}>
                              {formatTime(slot.start_time)}
                            </Text>
                            <Text style={styles.timeButtonAvailable}>
                              {slot.available} place{slot.available > 1 ? 's' : ''}
                            </Text>
                            {isSelected && (
                              <View style={styles.timeButtonCheck}>
                                <Ionicons name="checkmark" size={14} color="#4F46E5" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* ===== BOUTONS ===== */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    !selectedSlotId && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!selectedSlotId}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#6366F1']}
                    style={styles.confirmGradient}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.confirmButtonText}>
                      Confirmer le rendez-vous
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ===== OVERLAY =====
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // ===== CONTAINER =====
  container: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '70%',
  },

  // ===== LOADING =====
  loadingContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'System',
  },

  // ===== HEADER =====
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'System',
  },
  closeButton: {
    padding: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontFamily: 'System',
  },

  // ===== CONTENU =====
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ===== SECTION =====
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: 'System',
  },

  // ===== DATES =====
  datesScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginRight: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  dateButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  dateButtonDisabled: {
    opacity: 0.4,
  },
  dateButtonDay: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  dateButtonText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 2,
    fontFamily: 'System',
  },
  dateButtonTextActive: {
    color: '#4F46E5',
  },
  dateButtonTextDisabled: {
    color: '#9CA3AF',
  },
  dateButtonBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  dateButtonBadgeText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '600',
    fontFamily: 'System',
  },

  // ===== HEURES =====
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    width: (width - 52) / 3,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
  },
  timeButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  timeButtonDisabled: {
    opacity: 0.4,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  timeButtonTextActive: {
    color: '#4F46E5',
  },
  timeButtonTextDisabled: {
    color: '#9CA3AF',
  },
  timeButtonAvailable: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'System',
  },
  timeButtonCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },

  // ===== ACTIONS =====
  actions: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'System',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },

  // ===== EMPTY =====
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    fontFamily: 'System',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'System',
  },
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});