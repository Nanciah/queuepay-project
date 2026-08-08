import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../context/LanguageContext';
import { client } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface Service {
  id: string;
  name: string;
  description: string;
  ticket_price: number;
  category: string;
  is_active: boolean;
}

export default function ServicesScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await client.getServices();
      setServices(response.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const handleServicePress = (serviceId: string) => {
    // @ts-ignore - Navigation type issue
    navigation.navigate('ServiceDetail', { id: serviceId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_services')}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleServicePress(item.id)}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.serviceDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={styles.servicePrice}>{item.ticket_price || 0} Ar</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: { flex: 1, marginRight: 10 },
  serviceName: { fontSize: 16, fontWeight: '500', color: '#1F2937' },
  serviceDescription: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  servicePrice: { fontSize: 16, fontWeight: 'bold', color: '#4F46E5' },
});