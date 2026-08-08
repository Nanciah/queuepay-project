import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Download, Eye, ChevronLeft, ChevronRight,
  CreditCard, Building2, User, ArrowUpDown, Ticket, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, sortBy, sortOrder]);

const fetchTransactions = async () => {
  try {
    setLoading(true);
    const response = await superAdmin.getTransactions({
      page: currentPage,
      limit: 10,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined
    });
    
    // ✅ AFFICHER LA PREMIÈRE TRANSACTION POUR VÉRIFIER
    console.log('🔍 [DEBUG] Première transaction:', response.data.transactions[0]);
    console.log('🔍 [DEBUG] Company dans la première transaction:', response.data.transactions[0]?.company);
    
    setTransactions(response.data.transactions || []);
    setTotalPages(response.data.totalPages || 1);
  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error('Erreur lors du chargement des transactions');
  } finally {
    setLoading(false);
  }
};

  const getStatusBadge = (status) => {
    const variants = {
      success: 'success',
      pending: 'warning',
      failed: 'danger',
      cancelled: 'secondary'
    };
    const labels = {
      success: '✅ Réussi',
      pending: '⏳ En attente',
      failed: '❌ Échoué',
      cancelled: '⏹️ Annulé'
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: '💰 Dépôt',
      ticket_purchase: '🎫 Achat ticket',
      refund: '🔄 Remboursement',
      withdrawal: '🏦 Retrait',
      commission: '📊 Commission'
    };
    return labels[type] || type;
  };

  const getProviderLabel = (provider) => {
    const labels = {
      mvola: '📱 MVola',
      orange_money: '📱 Orange Money',
      wallet: '💳 Portefeuille'
    };
    return labels[provider] || provider || '-';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return (amount || 0).toLocaleString('fr-FR') + ' Ar';
  };

  const handleExport = async () => {
    try {
      const response = await superAdmin.exportTransactions({
        type: typeFilter,
        status: statusFilter,
        search: search
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export terminé !');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  if (loading) return <Loading />;

  return (
    <Layout title="Transactions">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 mt-1">
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''} trouvée{transactions.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
            <Button variant="primary" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tous les types</option>
                <option value="deposit">Dépôts</option>
                <option value="ticket_purchase">Achats de tickets</option>
                <option value="refund">Remboursements</option>
                <option value="withdrawal">Retraits</option>
                <option value="commission">Commissions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="success">Réussis</option>
                <option value="pending">En attente</option>
                <option value="failed">Échoués</option>
                <option value="cancelled">Annulés</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Référence, email..."
                  icon={<Search className="w-5 h-5" />}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="primary" size="sm" onClick={handleSearch}>
                  OK
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('reference')} className="flex items-center gap-1">
                    Référence
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">{transaction.reference || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{getTypeLabel(transaction.type)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${
                      transaction.type === 'refund' || transaction.type === 'withdrawal' 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {transaction.type === 'refund' || transaction.type === 'withdrawal' ? '-' : '+'}
                      {formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.user?.first_name || ''} {transaction.user?.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.user?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{getProviderLabel(transaction.provider)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {transaction.company ? (
                      <span className="text-sm text-gray-700">{transaction.company.name}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/super-admin/transactions/${transaction.id}`)}
                      className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Aucune transaction</h3>
            <p className="text-gray-500 mt-1">Aucune transaction ne correspond à vos critères</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Transactions;