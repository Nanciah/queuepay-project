import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MessageCircle, ArrowLeft, HelpCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';  // ✅ AJOUTER CETTE LIGNE

const Support = () => {
    const navigate = useNavigate();

    const supportOptions = [
        {
            icon: Mail,
            label: 'Email',
            description: 'Écrivez-nous à support@queuepay.mg',
            action: () => {
                // ✅ Alternative : ouvrir dans la même page
                window.location.href = 'mailto:support@queuepay.mg?subject=Demande de support - Agent';
                // OU en nouvelle fenêtre (mais peut être bloqué)
                // window.open('mailto:support@queuepay.mg', '_blank');
            }
        },
        {
            icon: Phone,
            label: 'Téléphone',
            description: 'Appelez le +261 34 00 000 00',
            action: () => {
                // ✅ Alternative : ouvrir dans la même page
                window.location.href = 'tel:+261340000000';
                // OU en nouvelle fenêtre
                // window.open('tel:+261340000000');
            }
        },
        {
            icon: MessageCircle,
            label: 'Chat',
            description: 'Discutez avec notre équipe',
            action: () => toast.info('💬 Chat en ligne bientôt disponible')
        },
        {
            icon: HelpCircle,
            label: 'FAQ',
            description: 'Consultez notre base de connaissances',
            action: () => {
                // ✅ Afficher un toast ou rediriger vers une page FAQ
                toast.info('📚 La FAQ sera bientôt disponible');
                // Ou rediriger
                // navigate('/faq');
            }
        }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/agent/dashboard')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Comment pouvons-nous vous aider ?
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportOptions.map((option, index) => {
                    const Icon = option.icon;
                    return (
                        <button
                            key={index}
                            onClick={option.action}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow hover:border-indigo-300 group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                    <Icon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{option.label}</p>
                                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                    ⏰ Horaires d'ouverture : Lundi - Vendredi, 8h - 18h
                </p>
            </div>
        </div>
    );
};

export default Support;