// screens/agent/QRScanScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarCodeScanner } from 'expo-barcode-scanner';
import Toast from 'react-native-toast-message';

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

export default function QRScanScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);

  // Demander la permission de la caméra
  React.useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    try {
      const parsedData: QRData = JSON.parse(data);
      
      // Vérifier que les données sont valides
      if (!parsedData.ticketId || !parsedData.ticketNumber) {
        Alert.alert('Erreur', 'QR Code invalide');
        setScanned(false);
        return;
      }
      
      setQrData(parsedData);
      setLoading(true);
      
      // Simuler une vérification
      setTimeout(() => {
        setLoading(false);
        // Afficher les données
        Alert.alert(
          '✅ Ticket validé',
          `🎫 ${parsedData.ticketNumber}\n👤 ${parsedData.clientName}\n🏢 ${parsedData.serviceName}`,
          [
            {
              text: 'Valider',
              onPress: () => validateTicket(parsedData.ticketId),
            },
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => setScanned(false),
            },
          ]
        );
      }, 800);
      
    } catch (error) {
      Alert.alert('Erreur', 'QR Code invalide. Veuillez réessayer.');
      setScanned(false);
    }
  };

  const validateTicket = async (ticketId: string) => {
    try {
      // Appeler l'API pour valider le ticket
      // await api.put(`/api/agent/tickets/${ticketId}/validate`);
      
      Toast.show({
        type: 'success',
        text1: '✅ Ticket validé',
        text2: `Le ticket a été validé avec succès`,
        position: 'bottom',
      });
      
      setScanned(false);
      setQrData(null);
      navigation.goBack();
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de valider le ticket');
      setScanned(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setQrData(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Demande d'accès à la caméra...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Accès à la caméra refusé</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner un ticket</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.scanner}
        />
        
        {/* Overlay avec cadre */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>
            Placez le QR Code dans le cadre
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📷 Comment scanner</Text>
        <Text style={styles.instructionsText}>
          1. Placez le QR Code dans le cadre\n
          2. Attendez que le code soit reconnu\n
          3. Confirmez la validation du ticket
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Vérification du ticket...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
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
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#4F46E5',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  scanText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
});