// Définition des permissions par rôle
const PERMISSIONS = {
    client: [
        'view_services',
        'create_ticket',
        'view_own_tickets',
        'view_own_wallet',
        'deposit_funds',
        'view_own_transactions'
    ],
    agent: [
        'view_services',
        'view_tickets',
        'call_ticket',
        'serve_ticket',
        'cancel_ticket',
        'view_agent_dashboard'
    ],
    admin: [
        'view_all_users',
        'manage_users',
        'suspend_users',
        'view_all_tickets',
        'manage_entities',
        'manage_services',
        'manage_agents',
        'view_all_transactions',
        'view_admin_dashboard',
        'view_audit_logs',
        'export_data'
    ],
    super_admin: [
        'all_permissions',
        'manage_system_settings',
        'view_all_data',
        'manage_api_keys',
        'view_system_logs'
    ]
};

// Vérifier si un utilisateur a une permission
const hasPermission = (userRole, permission) => {
    if (userRole === 'super_admin') return true;
    const userPermissions = PERMISSIONS[userRole] || [];
    return userPermissions.includes(permission) || userPermissions.includes('all_permissions');
};

module.exports = {
    PERMISSIONS,
    hasPermission
};