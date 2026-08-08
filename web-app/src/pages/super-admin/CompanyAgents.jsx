import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Eye, Trash2, User, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { superAdmin, companyAdmin } from '../../services/api';

const CompanyAgents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Récupérer les infos de l'entreprise
      const companyRes = await superAdmin.getCompany(id);
      setCompanyName(companyRes.data.company.name);

      // Récupérer les agents de l'entreprise
      const agentsRes = await companyAdmin.getAgents();
      const allAgents = agentsRes.data.agents || [];
      // Filtrer les agents de cette entreprise
      const companyAgents = allAgents.filter(a => a.company_id === id);
      setAgents(companyAgents);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet agent ?')) return;
    try {
      await companyAdmin.deleteAgent(agentId);
      toast.success('Agent supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    agent.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    agent.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Layout title={`Agents - ${companyName}`}>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(`/super-admin/companies/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
            <p className="text-gray-500 mt-1">
              {agents.length} agent{agents.length > 1 ? 's' : ''} pour {companyName}
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un agent..."
            icon={<Search className="w-5 h-5" />}
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {agent.first_name} {agent.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{agent.agent_code || 'Agent'}</p>
                  </div>
                </div>
                <Badge variant={agent.status === 'active' ? 'success' : 'danger'}>
                  {agent.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {agent.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {agent.phone}
                </p>
                {agent.assigned_services?.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {agent.assigned_services.length} service(s) assigné(s)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/super-admin/agents/${agent.id}`)}
                  className="flex-1 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Voir
                </button>
                <button
                  onClick={() => handleDelete(agent.id)}
                  className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Aucun agent</h3>
              <p className="text-gray-500 mt-1">Cette entreprise n'a pas encore d'agents</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CompanyAgents;