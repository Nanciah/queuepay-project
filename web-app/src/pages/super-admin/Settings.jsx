import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Globe, DollarSign, Clock, Users, Shield, Bell, Mail, Smartphone, Database, RefreshCw, Ticket, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import PasswordChange from '../../components/common/PasswordChange';
import { superAdmin } from '../../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'QueuePay',
    currency: 'Ar',
    timezone: 'Indian/Antananarivo',
    maxTicketPerDay: 1000,
    autoCancelDelay: 30,
    advanceBooking: 7,
    defaultTicketPrice: 0,
    enableWallet: true,
    enableMvola: true,
    enableOrangeMoney: true,
    maintenanceMode: false,
    allowGuestBooking: true,
    maxFileSize: 5,
    sessionTimeout: 60,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Paramètres sauvegardés avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Voulez-vous vraiment réinitialiser tous les paramètres ?')) return;
    setSettings({
      platformName: 'QueuePay',
      currency: 'Ar',
      timezone: 'Indian/Antananarivo',
      maxTicketPerDay: 1000,
      autoCancelDelay: 30,
      advanceBooking: 7,
      defaultTicketPrice: 0,
      enableWallet: true,
      enableMvola: true,
      enableOrangeMoney: true,
      maintenanceMode: false,
      allowGuestBooking: true,
      maxFileSize: 5,
      sessionTimeout: 60,
    });
    toast.success('Paramètres réinitialisés');
  };

  if (loading) return <Loading />;

  return (
    <Layout title="Configuration">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-500 mt-1">Paramètres généraux de la plateforme</p>
        </div>

        {/* 🔥 CHANGER LE MOT DE PASSE */}
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
          {/* Informations générales */}
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-600" />
                <Card.Title>Informations générales</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom de la plateforme"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  icon={<Globe className="w-5 h-5" />}
                />
                <Input
                  label="Devise"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  icon={<DollarSign className="w-5 h-5" />}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Indian/Antananarivo">Indian/Antananarivo (UTC+3)</option>
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  </select>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Configuration des tickets */}
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-indigo-600" />
                <Card.Title>Configuration des tickets</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tickets max par jour"
                  type="number"
                  value={settings.maxTicketPerDay}
                  onChange={(e) => setSettings({ ...settings, maxTicketPerDay: parseInt(e.target.value) || 0 })}
                  icon={<Users className="w-5 h-5" />}
                />
                <Input
                  label="Délai annulation auto (minutes)"
                  type="number"
                  value={settings.autoCancelDelay}
                  onChange={(e) => setSettings({ ...settings, autoCancelDelay: parseInt(e.target.value) || 0 })}
                  icon={<Clock className="w-5 h-5" />}
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
                  value={settings.defaultTicketPrice}
                  onChange={(e) => setSettings({ ...settings, defaultTicketPrice: parseInt(e.target.value) || 0 })}
                  icon={<DollarSign className="w-5 h-5" />}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Paiements */}
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-600" />
                <Card.Title>Paiements</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.enableMvola}
                      onChange={(e) => setSettings({ ...settings, enableMvola: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">MVola</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={settings.enableOrangeMoney}
                      onChange={(e) => setSettings({ ...settings, enableOrangeMoney: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Orange Money</span>
                  </label>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Sécurité */}
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-600" />
                <Card.Title>Sécurité</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Taille max des fichiers (Mo)"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 0 })}
                  icon={<Database className="w-5 h-5" />}
                />
                <Input
                  label="Délai d'expiration session (minutes)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 0 })}
                  icon={<Clock className="w-5 h-5" />}
                />
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowGuestBooking}
                    onChange={(e) => setSettings({ ...settings, allowGuestBooking: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Autoriser les réservations sans compte</span>
                </label>
              </div>
            </Card.Body>
          </Card>

          {/* Maintenance */}
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <Card.Title>Maintenance</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-red-600 font-medium">Mode maintenance</span>
                </label>
                {settings.maintenanceMode && (
                  <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full">
                    ⚠️ La plateforme est en maintenance
                  </span>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              className="flex-1"
            >
              <Save className="w-5 h-5" />
              Sauvegarder les modifications
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
            >
              Réinitialiser
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={fetchSettings}
            >
              Rafraîchir
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