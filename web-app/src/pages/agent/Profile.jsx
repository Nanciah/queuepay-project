import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Building, Edit2, Save, X } from 'lucide-react';
import { companyAdmin } from '../../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, login } = useAuth();  // ✅ Ajouter login pour mettre à jour le contexte
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // ✅ Appel API réel
            const response = await companyAdmin.updateAgentProfile({
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone
            });
            
            // ✅ Mettre à jour le contexte utilisateur
            const updatedUser = response.data.user;
            
            // Mettre à jour le localStorage
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newUser = {
                ...storedUser,
                ...updatedUser
            };
            localStorage.setItem('user', JSON.stringify(newUser));
            
            // Mettre à jour le contexte Auth (si disponible)
            if (typeof login === 'function') {
                // Si tu as une fonction pour mettre à jour l'utilisateur dans le contexte
                // login(updatedUser);
            }
            
            toast.success('Profil mis à jour avec succès !');
            setEditMode(false);
            
            // Rafraîchir la page pour voir les changements
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Gérez vos informations personnelles
                    </p>
                </div>
                <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    {editMode ? (
                        <>
                            <X className="w-4 h-4" />
                            Annuler
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-4 h-4" />
                            Modifier
                        </>
                    )}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-900">
                                {formData.first_name} {formData.last_name}
                            </p>
                            <p className="text-sm text-gray-500">Agent QueuePay</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                disabled={!editMode}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                    editMode ? 'border-gray-300' : 'border-transparent bg-gray-50'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                disabled={!editMode}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                    editMode ? 'border-gray-300' : 'border-transparent bg-gray-50'
                                }`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Téléphone
                        </label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!editMode}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                editMode ? 'border-gray-300' : 'border-transparent bg-gray-50'
                            }`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email
                        </label>
                        <input
                            name="email"
                            value={formData.email}
                            disabled={true}
                            className="w-full px-4 py-2 border border-transparent bg-gray-50 rounded-lg cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Building className="w-4 h-4 inline mr-1" />
                            Entreprise
                        </label>
                        <input
                            value={user?.company_name || 'Entreprise'}
                            disabled={true}
                            className="w-full px-4 py-2 border border-transparent bg-gray-50 rounded-lg cursor-not-allowed"
                        />
                    </div>

                    {editMode && (
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;