import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Mail, Phone, Calendar, Shield, Ban, CheckCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { superAdmin } from '../../services/api';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await superAdmin.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Voulez-vous suspendre cet utilisateur ?')) return;
    try {
      await superAdmin.suspendUser(id);
      toast.success('Utilisateur suspendu');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleActivate = async (id) => {
    try {
      await superAdmin.activateUser(id);
      toast.success('Utilisateur activé');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      super_admin: 'danger',
      company_admin: 'purple',
      agent: 'info',
      client: 'success',
    };
    const labels = {
      super_admin: 'Super Admin',
      company_admin: 'Admin Entreprise',
      agent: 'Agent',
      client: 'Client',
    };
    return <Badge variant={variants[role] || 'default'}>{labels[role] || role}</Badge>;
  };

  const filteredUsers = users.filter(user => {
    if (user.role === 'super_admin') return false;
    
    const matchSearch = 
      user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search) ||
      user.company?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || user.role === filter || user.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <Loading />;

  return (
    <Layout title="Utilisateurs">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 mt-1">
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou entreprise..."
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'client', 'agent', 'company_admin'].map((role) => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === role
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'Tous' : 
                 role === 'company_admin' ? 'Admins' :
                 role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filteredUsers.length === 0 ? (
        <Card className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucun utilisateur</h3>
          <p className="text-gray-500 mt-1">Aucun utilisateur trouvé</p>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscrit le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-gray-400">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {user.company ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{user.company.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                        {user.status === 'active' ? 'Actif' : 'Suspendu'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                            title="Suspendre"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                            title="Activer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;