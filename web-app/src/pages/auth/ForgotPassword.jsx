import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { auth } from '../../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

   const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔵 [Frontend] Formulaire soumis');
    console.log('📧 [Frontend] Email:', email);

    if (!email) {
        toast.error('Veuillez entrer votre email');
        return;
    }

    setIsLoading(true);
    try {
        console.log('📤 [Frontend] Envoi de la requête...');
        const response = await auth.forgotPassword({ email });
        console.log('✅ [Frontend] Réponse reçue:', response.data);
        
        setEmailSent(true);
        toast.success('Un lien de réinitialisation a été envoyé');
    } catch (error) {
        console.error('❌ [Frontend] Erreur:', error);
        console.error('📚 [Frontend] Détails:', error.response?.data);
        toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
        setIsLoading(false);
    }
};

if (emailSent) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                        <span className="text-4xl">📧</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
                    <p className="text-gray-600 mb-4">
                        Un nouveau mot de passe a été envoyé à <strong>{email}</strong>
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-yellow-800">
                            <strong>📌 Important :</strong>
                        </p>
                        <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                            <li>Vérifiez vos spams si vous ne recevez pas l'email</li>
                            <li>Connectez-vous avec le nouveau mot de passe</li>
                            <li>Changez-le dans vos paramètres après connexion</li>
                        </ul>
                    </div>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
}

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
                        <p className="text-gray-500 mt-1">
                            Entrez votre email pour recevoir un lien de réinitialisation
                        </p>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail className="w-5 h-5 text-gray-400" />}
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="w-full"
                        >
                            <Send className="w-5 h-5" />
                            Envoyer le lien
                        </Button>
                    </form>

                    {/* Lien retour */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;