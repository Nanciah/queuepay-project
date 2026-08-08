import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Building2, Mail, Phone, MapPin, Clock, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import PasswordChange from '../../components/common/PasswordChange';
import { companyAdmin } from '../../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [company, setCompany] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });
  const [settings, setSettings] = useState({
    maxTicketPerDay: 100,
    autoCancelDelay: 30,
    advanceBooking: 7,
    ticketPrice: 0,
    enableWallet: true,
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await companyAdmin.getCompanySettings();
      const data = response.data;
      
      setCompany({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        phone: data.phone || '',
        email: data.email || '',
      });
      
      if (data.settings) {
        setSettings({
          maxTicketPerDay: data.settings.maxTicketPerDay || 100,
          autoCancelDelay: data.settings.autoCancelDelay || 30,
          advanceBooking: data.settings.advanceBooking || 7,
          ticketPrice: data.settings.ticketPrice || 0,
          enableWallet: data.settings.enableWallet !== undefined ? data.settings.enableWallet : true,
        });
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await companyAdmin.updateCompanySettings({
        ...company,
        settings: settings,
      });
      toast.success('Paramètres sauvegardés avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Layout title="Configuration">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuration de l'entreprise</h1>
          <p className="text-gray-500 mt-1">Gérez les paramètres de votre entreprise</p>
        </div>

        {/* 🔥 CARTE SÉCURITÉ - CHANGER LE MOT DE PASSE */}
        <Card className="mb-6">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-indigo-600" />
                <Card.Title>Sécurité du compte</Card.Title>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Changer le mot de passe</p>
                <p className="text-sm text-gray-500">Modifiez votre mot de passe de connexion</p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowPasswordModal(true)}
              >
                <Key className="w-4 h-4" />
                Modifier le mot de passe
              </Button>
            </div>
          </Card.Body>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Informations de l'entreprise */}
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <Card.Title>Informations générales</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Nom de l'entreprise"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={company.description}
                    onChange={(e) => setCompany({ ...company, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <Input
                  label="Adresse"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  icon={<MapPin className="w-5 h-5" />}
                />
                <Input
                  label="Ville"
                  value={company.city}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                />
                <Input
                  label="Téléphone"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  icon={<Phone className="w-5 h-5" />}
                />
                <Input
                  label="Email"
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  icon={<Mail className="w-5 h-5" />}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Paramètres des tickets */}
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-600" />
                <Card.Title>Paramètres des tickets</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tickets max par jour"
                  type="number"
                  value={settings.maxTicketPerDay}
                  onChange={(e) => setSettings({ ...settings, maxTicketPerDay: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Délai annulation auto (minutes)"
                  type="number"
                  value={settings.autoCancelDelay}
                  onChange={(e) => setSettings({ ...settings, autoCancelDelay: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Réservation à l'avance (jours)"
                  type="number"
                  value={settings.advanceBooking}
                  onChange={(e) => setSettings({ ...settings, advanceBooking: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Prix par défaut (Ar)"
                  type="number"
                  value={settings.ticketPrice}
                  onChange={(e) => setSettings({ ...settings, ticketPrice: parseInt(e.target.value) || 0 })}
                />
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableWallet}
                      onChange={(e) => setSettings({ ...settings, enableWallet: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Activer le portefeuille</span>
                  </label>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Sauvegarde */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              className="flex-1"
            >
              <Save className="w-5 h-5" />
              Sauvegarder les modifications
            </Button>
          </div>
        </form>
      </div>

      {/* 🔥 MODAL CHANGER LE MOT DE PASSE */}
      {showPasswordModal && (
        <PasswordChange onClose={() => setShowPasswordModal(false)} />
      )}
    </Layout>
  );
};

export default Settings;