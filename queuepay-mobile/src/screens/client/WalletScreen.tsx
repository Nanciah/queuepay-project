import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  payment_method: string;
  description: string;
  created_at: string;
}

export default function WalletScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [wallet, setWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mvola');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        api.get('/api/client/wallet'),
        api.get('/api/client/wallet/transactions')
      ]);
      setWallet(walletRes.data);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

 const handleDeposit = async () => {
    const amountValue = parseInt(amount);
    if (!amountValue || amountValue < 1000) {
        Alert.alert('Erreur', 'Le montant minimum de dépôt est de 1000 Ar');
        return;
    }

    if (!phoneNumber) {
        Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
        return;
    }

    setIsProcessing(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await api.post('/api/client/wallet/deposit', {
            amount: amountValue,
            method: method,
            phone_number: phoneNumber,
        });

        // ✅ Utiliser le nouveau solde retourné par le backend
        if (response.data.newBalance !== undefined) {
            setWallet({ balance: response.data.newBalance });
        } else {
            // Fallback
            setWallet(prev => ({
                ...prev,
                balance: (prev.balance || 0) + amountValue
            }));
        }

        const newTransaction = {
            id: `tx-${Date.now()}`,
            type: 'deposit',
            amount: amountValue,
            status: 'success',
            payment_method: method,
            description: `Dépôt via ${method}`,
            created_at: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);

        Toast.show({
            type: 'success',
            text1: '💰 Dépôt réussi !',
            text2: `${amountValue} Ar ajouté à votre portefeuille`,
            position: 'bottom',
            visibilityTime: 3000,
        });

        setShowDepositModal(false);
        setAmount('');
        setPhoneNumber('');

    } catch (error: any) {
        console.error('Erreur dépôt:', error);
        Alert.alert('Erreur', error.response?.data?.error || 'Échec du dépôt');
    } finally {
        setIsProcessing(false);
    }
};

const handleWithdraw = async () => {
    const amountValue = parseInt(amount);
    
    if (!amountValue || amountValue < 1000) {
        Alert.alert('Erreur', 'Le montant minimum de retrait est de 1000 Ar');
        return;
    }

    if (amountValue > 20000) {
        Alert.alert('Erreur', 'Le montant maximum de retrait est de 20000 Ar par jour');
        return;
    }

    if (amountValue > wallet.balance) {
        Alert.alert('Erreur', `Solde insuffisant. Solde: ${wallet.balance} Ar`);
        return;
    }

    if (!phoneNumber) {
        Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
        return;
    }

    setIsProcessing(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await api.post('/api/client/wallet/withdraw', {
            amount: amountValue,
            method: method,
            phone_number: phoneNumber,
        });

        // ✅ Utiliser le nouveau solde retourné par le backend
        if (response.data.newBalance !== undefined) {
            setWallet({ balance: response.data.newBalance });
        } else {
            setWallet(prev => ({
                ...prev,
                balance: (prev.balance || 0) - amountValue
            }));
        }

        const newTransaction = {
            id: `tx-${Date.now()}`,
            type: 'withdrawal',
            amount: amountValue,
            status: 'success',
            payment_method: method,
            description: `Retrait via ${method}`,
            created_at: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);

        Toast.show({
            type: 'success',
            text1: '💸 Retrait réussi !',
            text2: `${amountValue} Ar retiré de votre portefeuille`,
            position: 'bottom',
            visibilityTime: 3000,
        });

        setShowWithdrawModal(false);
        setAmount('');
        setPhoneNumber('');

    } catch (error: any) {
        console.error('Erreur retrait:', error);
        Alert.alert('Erreur', error.response?.data?.error || 'Échec du retrait');
    } finally {
        setIsProcessing(false);
    }
};

  const getTransactionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      deposit: 'arrow-down-circle-outline',
      ticket_purchase: 'arrow-up-circle-outline',
      refund: 'refresh-circle-outline',
      withdrawal: 'arrow-up-circle-outline',
    };
    return icons[type] || 'ellipse-outline';
  };

  const getTransactionColor = (type: string) => {
    const colors: { [key: string]: string } = {
      deposit: '#10B981',
      ticket_purchase: '#EF4444',
      refund: '#F59E0B',
      withdrawal: '#EF4444',
    };
    return colors[type] || '#6B7280';
  };

  const getTransactionLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      deposit: 'Dépôt',
      ticket_purchase: 'Achat ticket',
      refund: 'Remboursement',
      withdrawal: 'Retrait',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Carte de solde */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>💰 {t('balance')}</Text>
        <Text style={styles.balanceAmount}>{wallet.balance || 0} Ar</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.depositAction]}
            onPress={() => setShowDepositModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Déposer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawAction]}
            onPress={() => setShowWithdrawModal(true)}
          >
            <Ionicons name="remove-circle-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.withdrawText]}>Retirer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setShowDepositModal(true)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="arrow-down-outline" size={24} color="#10B981" />
          </View>
          <Text style={styles.quickActionLabel}>Déposer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setShowWithdrawModal(true)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="arrow-up-outline" size={24} color="#EF4444" />
          </View>
          <Text style={styles.quickActionLabel}>Retirer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => fetchWalletData()}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="refresh-outline" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.quickActionLabel}>Actualiser</Text>
        </TouchableOpacity>
      </View>

      {/* Historique des transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 {t('transactions')}</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune transaction</Text>
            <Text style={styles.emptySubtext}>
              Effectuez un dépôt ou un achat pour voir vos transactions
            </Text>
          </View>
        ) : (
          transactions.map((tx, index) => {
            const IconName = getTransactionIcon(tx.type);
            const color = getTransactionColor(tx.type);
            const label = getTransactionLabel(tx.type);
            const isPositive = tx.type === 'deposit' || tx.type === 'refund';
            
            return (
              <View key={tx.id || index} style={styles.transactionItem}>
                <View style={[styles.transactionIcon, { backgroundColor: `${color}20` }]}>
                  <Ionicons name={IconName as any} size={24} color={color} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionLabel}>{label}</Text>
                  <Text style={styles.transactionDescription}>
                    {tx.description || tx.payment_method || 'Transaction'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(tx.created_at)}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionAmountText,
                    isPositive ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {isPositive ? '+' : '-'} {tx.amount} Ar
                  </Text>
                  <View style={[
                    styles.transactionStatus,
                    tx.status === 'success' ? styles.statusSuccess : styles.statusPending
                  ]}>
                    <Text style={styles.transactionStatusText}>
                      {tx.status === 'success' ? '✅' : '⏳'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Modal de DÉPÔT */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💰 Alimenter le portefeuille</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.depositInfo}>
              <Text style={styles.depositInfoText}>💰 Montant minimum : 1 000 Ar</Text>
              <Text style={styles.depositInfoText}>📱 Méthodes : MVola, Orange Money</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="034 00 000 00"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant (Ar)</Text>
              <TextInput
                style={styles.input}
                placeholder="1000"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>Minimum : 1 000 Ar</Text>
            </View>

            <Text style={styles.methodLabel}>Méthode de paiement</Text>
            <View style={styles.methodContainer}>
              <TouchableOpacity
                style={[styles.methodButton, method === 'mvola' && styles.methodButtonActive]}
                onPress={() => setMethod('mvola')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={method === 'mvola' ? '#4F46E5' : '#6B7280'} />
                <Text style={[styles.methodText, method === 'mvola' && styles.methodTextActive]}>MVola</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, method === 'orange' && styles.methodButtonActive]}
                onPress={() => setMethod('orange')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={method === 'orange' ? '#4F46E5' : '#6B7280'} />
                <Text style={[styles.methodText, method === 'orange' && styles.methodTextActive]}>Orange Money</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowDepositModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleDeposit} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Alimenter</Text>}
              </TouchableOpacity>
            </View>
            <Text style={styles.paymentInfo}>💳 Paiement simulé. Aucun débit réel.</Text>
          </View>
        </View>
      </Modal>

      {/* Modal de RETRAIT */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💸 Retirer des fonds</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.withdrawInfo}>
              <Text style={styles.withdrawInfoText}>💰 Solde disponible : {wallet.balance || 0} Ar</Text>
              <Text style={styles.withdrawInfoText}>📊 Min : 1 000 Ar | Max : 20 000 Ar/jour</Text>
              <Text style={styles.withdrawInfoText}>📱 Méthodes : MVola, Orange Money</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="034 00 000 00"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant à retirer (Ar)</Text>
              <TextInput
                style={styles.input}
                placeholder="1000"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>Minimum : 1 000 Ar | Maximum : 20 000 Ar</Text>
            </View>

            <Text style={styles.methodLabel}>Méthode de retrait</Text>
            <View style={styles.methodContainer}>
              <TouchableOpacity
                style={[styles.methodButton, method === 'mvola' && styles.methodButtonActive]}
                onPress={() => setMethod('mvola')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={method === 'mvola' ? '#4F46E5' : '#6B7280'} />
                <Text style={[styles.methodText, method === 'mvola' && styles.methodTextActive]}>MVola</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, method === 'orange' && styles.methodButtonActive]}
                onPress={() => setMethod('orange')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={method === 'orange' ? '#4F46E5' : '#6B7280'} />
                <Text style={[styles.methodText, method === 'orange' && styles.methodTextActive]}>Orange Money</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowWithdrawModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleWithdraw} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Retirer</Text>}
              </TouchableOpacity>
            </View>
            <Text style={styles.paymentInfo}>💳 Retrait simulé. Aucun transfert réel.</Text>
          </View>
        </View>
      </Modal>

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  balanceCard: {
    backgroundColor: '#4F46E5',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
  balanceActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, gap: 8 },
  depositAction: { backgroundColor: '#fff' },
  withdrawAction: { backgroundColor: '#FEE2E2' },
  actionButtonText: { fontWeight: '600', fontSize: 14, color: '#4F46E5' },
  withdrawText: { color: '#EF4444' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  quickActionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickActionLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  section: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 8 },
  emptySubtext: { fontSize: 13, color: '#D1D5DB', marginTop: 4, textAlign: 'center' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  transactionDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  transactionDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  transactionAmount: { alignItems: 'flex-end' },
  transactionAmountText: { fontSize: 15, fontWeight: 'bold' },
  positiveAmount: { color: '#10B981' },
  negativeAmount: { color: '#EF4444' },
  transactionStatus: { marginTop: 2 },
  statusSuccess: {},
  statusPending: {},
  transactionStatusText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  depositInfo: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, marginBottom: 16 },
  depositInfoText: { fontSize: 13, color: '#4F46E5', marginBottom: 4 },
  withdrawInfo: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 16 },
  withdrawInfoText: { fontSize: 13, color: '#92400E', marginBottom: 4 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: '#F9FAFB' },
  inputHint: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  methodLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  methodContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  methodButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  methodButtonActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  methodText: { fontSize: 12, fontWeight: '500', color: '#6B7280', marginTop: 4 },
  methodTextActive: { color: '#4F46E5' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelButtonText: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
  confirmButton: { backgroundColor: '#4F46E5' },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  paymentInfo: { marginTop: 12, fontSize: 12, color: '#6B7280', textAlign: 'center' },
});