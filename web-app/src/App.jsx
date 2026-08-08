import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/common/PrivateRoute';


// Pages Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword'; 
import ResetPassword from './pages/auth/ResetPassword'; 

// Pages Super Admin
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminCompanies from './pages/super-admin/Companies';
import CreateCompany from './pages/super-admin/CreateCompany';
import EditCompany from './pages/super-admin/EditCompany';
import CompanyDetails from './pages/super-admin/CompanyDetails';
import SuperAdminUsers from './pages/super-admin/Users';
import SuperAdminSettings from './pages/super-admin/Settings';
import SuperAdminCompanyServices from './pages/super-admin/CompanyServices';
import SuperAdminCompanyAgents from './pages/super-admin/CompanyAgents';
import SuperAdminStats from './pages/super-admin/Stats';
import SuperAdminReports from './pages/super-admin/Reports';
import SuperAdminTransactions from './pages/super-admin/Transactions';
import SuperAdminQueues from './pages/super-admin/Queues';
import SuperAdminQueueDetails from './pages/super-admin/QueueDetails';

// Pages Company Admin
import CompanyDashboard from './pages/company-admin/Dashboard';
import CompanyServices from './pages/company-admin/Services';
import CreateService from './pages/company-admin/CreateService';
import CompanyAgents from './pages/company-admin/Agents';
import CreateAgent from './pages/company-admin/CreateAgent';
import CompanyQueues from './pages/company-admin/Queues';
import CompanyStats from './pages/company-admin/Stats';
import CompanySettings from './pages/company-admin/Settings';
import AgentDetails from './pages/company-admin/AgentDetails';
import CompanyTransactions from './pages/company-admin/CompanyTransactions';
import CompanyAdminDashboard from './pages/company-admin/Dashboard';
import CompanyAdminSettings from './pages/company-admin/Settings';

// Pages Agent
import AgentDashboard from './pages/agent/Dashboard';
import AgentQueue from './pages/agent/Queue';
import AgentQueueCreneau from './pages/agent/QueueCreneau';
import AgentHistory from './pages/agent/History';
import AgentProfile from './pages/agent/Profile';
import AgentSupport from './pages/agent/Support';
import AgentLayout from './components/agent/AgentLayout';
console.log('✅ [App] AgentQueueCreneau importé:', AgentQueueCreneau);


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />  {/* ✅ Route */}
                <Route path="/reset-password" element={<ResetPassword />} />

            {/* ========== SUPER ADMIN ========== */}
            <Route path="/super-admin/dashboard" element={<PrivateRoute roles={['super_admin']}><SuperAdminDashboard /></PrivateRoute>} />
            <Route path="/super-admin/companies" element={<PrivateRoute roles={['super_admin']}><SuperAdminCompanies /></PrivateRoute>} />
            <Route path="/super-admin/companies/create" element={<PrivateRoute roles={['super_admin']}><CreateCompany /></PrivateRoute>} />
            <Route path="/super-admin/companies/:id/edit" element={<PrivateRoute roles={['super_admin']}><EditCompany /></PrivateRoute>} />
            <Route path="/super-admin/companies/:id" element={<PrivateRoute roles={['super_admin']}><CompanyDetails /></PrivateRoute>} />
            <Route path="/super-admin/companies/:id/services" element={<PrivateRoute roles={['super_admin']}><SuperAdminCompanyServices /></PrivateRoute>} />
            <Route path="/super-admin/companies/:id/agents" element={<PrivateRoute roles={['super_admin']}><SuperAdminCompanyAgents /></PrivateRoute>} />
            <Route path="/super-admin/users" element={<PrivateRoute roles={['super_admin']}><SuperAdminUsers /></PrivateRoute>} />
            <Route path="/super-admin/transactions" element={<PrivateRoute roles={['super_admin']}><SuperAdminTransactions /></PrivateRoute>} />
            <Route path="/super-admin/queues" element={<PrivateRoute roles={['super_admin']}><SuperAdminQueues /></PrivateRoute>} />
            <Route path="/super-admin/queues/:id" element={<PrivateRoute roles={['super_admin']}><SuperAdminQueueDetails /></PrivateRoute>} />
            <Route path="/super-admin/stats" element={<PrivateRoute roles={['super_admin']}><SuperAdminStats /></PrivateRoute>} />
            <Route path="/super-admin/reports" element={<PrivateRoute roles={['super_admin']}><SuperAdminReports /></PrivateRoute>} />
            <Route path="/super-admin/settings" element={<PrivateRoute roles={['super_admin']}><SuperAdminSettings /></PrivateRoute>} />

            {/* ========== COMPANY ADMIN ========== */}
            <Route path="/company-admin/dashboard" element={<PrivateRoute roles={['company_admin']}><CompanyDashboard /></PrivateRoute>} />
            <Route path="/company-admin/services" element={<PrivateRoute roles={['company_admin']}><CompanyServices /></PrivateRoute>} />
            <Route path="/company-admin/services/create" element={<PrivateRoute roles={['company_admin']}><CreateService /></PrivateRoute>} />
            <Route path="/company-admin/services/:id" element={<PrivateRoute roles={['company_admin']}><CreateService /></PrivateRoute>} />
            <Route path="/company-admin/agents" element={<PrivateRoute roles={['company_admin']}><CompanyAgents /></PrivateRoute>} />
            <Route path="/company-admin/agents/create" element={<PrivateRoute roles={['company_admin']}><CreateAgent /></PrivateRoute>} />
            <Route path="/company-admin/agents/:id" element={<PrivateRoute roles={['company_admin']}><CreateAgent /></PrivateRoute>} />
            <Route path="/company-admin/queues" element={<PrivateRoute roles={['company_admin']}><CompanyQueues /></PrivateRoute>} />
            <Route path="/company-admin/stats" element={<PrivateRoute roles={['company_admin']}><CompanyStats /></PrivateRoute>} />
            <Route path="/company-admin/settings" element={<PrivateRoute roles={['company_admin']}><CompanySettings /></PrivateRoute>} />
            <Route path="/company-admin/agents/:id/view" element={<PrivateRoute roles={['company_admin']}><AgentDetails /></PrivateRoute>} />
            <Route path="/company-admin/agents/:id/edit" element={<PrivateRoute roles={['company_admin']}><CreateAgent /></PrivateRoute>} />
            <Route path="/company-admin/transactions" element={<PrivateRoute roles={['company_admin']}><CompanyTransactions /></PrivateRoute>} />
            
          
{/* ========== AGENT ========== */}
<Route path="/agent" element={
    <PrivateRoute roles={['agent']}>
        <AgentLayout />
    </PrivateRoute>
}>
  <Route path="/agent/queue-creneau" element={
    <PrivateRoute roles={['agent']}>
        <AgentLayout />
    </PrivateRoute>
}></Route>
    <Route index element={<Navigate to="/agent/dashboard" />} />
    <Route path="dashboard" element={<AgentDashboard />} />
    <Route path="queue" element={<AgentQueue />} />
     <Route path="queue-creneau" element={<AgentQueueCreneau />} />
    <Route path="history" element={<AgentHistory />} />
    <Route path="profile" element={<AgentProfile />} />
    <Route path="support" element={<AgentSupport />} />
</Route>
console.log('✅ [App] Route /agent/queue-creneau enregistrée');
            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;