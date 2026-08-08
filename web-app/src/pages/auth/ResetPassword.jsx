import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Check, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { auth } from '../../services/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    // Vérifier le token au chargement
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidating(false);
                setIsTokenValid(false);
                return;
            }

            try {
                const response = await auth.verifyResetToken(token);
                if (response.data.valid) {
                    setIsTokenValid(true);
                } else {
                    setIsTokenValid(false);
                }
            } catch (error) {
                setIsTokenValid(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.newPassword || !formData.confirmPassword) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        setIsLoading(true);
        try {
            await auth.resetPassword({
                token,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword,
            });
            
            toast.success('Mot de passe réinitialisé avec succès !');
            
            // Rediriger vers login après 2 secondes
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erreur lors de la réinitialisation');
        } finally {
            setIsLoading(false);
        }
    };

    // État de chargement
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Vérification du lien...</p>
                </div>
            </div>
        );
    }

    // Token invalide
    if (!isTokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                            <X className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h2>
                        <p className="text-gray-600 mb-6">
                            Ce lien de réinitialisation est invalide ou a expiré.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Demander un nouveau lien
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Formulaire de réinitialisation
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
                            <span className="text-3xl">🔑</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
                        <p className="text-gray-500 mt-1">
                            Créez un nouveau mot de passe sécurisé
                        </p>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nouveau mot de passe */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    required
                                    minLength="8"
                                />
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="mt-1.5 text-xs text-gray-400">Minimum 8 caractères</p>
                        </div>

                        {/* Confirmation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    required
                                />
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="w-full"
                        >
                            <Check className="w-5 h-5" />
                            Réinitialiser le mot de passe
                        </Button>
                    </form>

                    {/* Lien retour */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;