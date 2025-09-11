import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import CompanyService from '../../services/companyService';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ServerIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
// Gráficos comentados temporariamente - instalar: npm install recharts
// import {
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   Area,
//   AreaChart
// } from 'recharts';

export default function CompaniesComponent() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    basicPlan: 0,
    premiumPlan: 0,
    unlimitedPlan: 0,
    withAdmins: 0,
    withoutAdmins: 0
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    plan: 'basic',
    maxUsers: 5,
    maxQueues: 3,
    isActive: true,
    // Campos do responsável
    adminId: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: ''
  });

  // Verificar se é super admin
  useEffect(() => {
    if (user?.role !== 'super_admin') {
      alert('Acesso negado. Apenas o Super Admin pode gerenciar empresas.');
      window.location.href = '/dashboard';
      return;
    }
    loadCompanies();
  }, [user]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await CompanyService.getCompanies();
      // O backend retorna { companies: [], pagination: {} }
      const companiesList = Array.isArray(data.companies) ? data.companies : (Array.isArray(data) ? data : []);
      setCompanies(companiesList);
      calculateStats(companiesList);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      alert('Erro ao carregar empresas: ' + error.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (companiesData) => {
    const companiesWithAdmins = companiesData.filter(c => 
      c.users && c.users.length > 0 && c.users.some(u => u.role === 'admin')
    );
    
    const stats = {
      total: companiesData.length,
      active: companiesData.filter(c => c.isActive).length,
      inactive: companiesData.filter(c => !c.isActive).length,
      basicPlan: companiesData.filter(c => c.plan === 'basic').length,
      premiumPlan: companiesData.filter(c => c.plan === 'premium').length,
      unlimitedPlan: companiesData.filter(c => c.plan === 'unlimited').length,
      withAdmins: companiesWithAdmins.length,
      withoutAdmins: companiesData.length - companiesWithAdmins.length
    };
    setStats(stats);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedCompany) {
        // Para edição - validar se tem dados do responsável para atualizar
        const hasAdminData = form.adminName || form.adminEmail || form.adminPassword;
        
        if (hasAdminData) {
          // Validar dados do responsável se estão sendo editados
          if (!form.adminName || !form.adminEmail) {
            alert('Nome e email do responsável são obrigatórios.');
            return;
          }
          
          // Se está alterando senha, validar
          if (form.adminPassword && form.adminPassword !== form.adminPasswordConfirm) {
            alert('As senhas do responsável não coincidem.');
            return;
          }
          
          if (form.adminPassword && form.adminPassword.length < 6) {
            alert('A senha do responsável deve ter pelo menos 6 caracteres.');
            return;
          }
        }
        
        await CompanyService.updateCompany(selectedCompany.id, form);
        alert('Empresa e responsável atualizados com sucesso!');
      } else {
        // Para criação, validar dados do responsável
        if (!form.adminName || !form.adminEmail || !form.adminPassword) {
          alert('Por favor, preencha todos os dados do responsável da empresa.');
          return;
        }
        
        if (form.adminPassword !== form.adminPasswordConfirm) {
          alert('As senhas do responsável não coincidem.');
          return;
        }
        
        if (form.adminPassword.length < 6) {
          alert('A senha do responsável deve ter pelo menos 6 caracteres.');
          return;
        }
        
        await CompanyService.createCompany(form);
        alert('Empresa e responsável criados com sucesso!');
      }
      
      setShowModal(false);
      setSelectedCompany(null);
      setForm({
        name: '',
        email: '',
        plan: 'basic',
        maxUsers: 5,
        maxQueues: 3,
        isActive: true,
        adminId: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: ''
      });
      loadCompanies();
    } catch (error) {
      alert('Erro ao salvar empresa: ' + error.message);
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    
    // Buscar o administrador da empresa
    const admin = company.users && company.users.find(u => u.role === 'admin');
    
    setForm({
      name: company.name,
      email: company.email,
      plan: company.plan,
      maxUsers: company.maxUsers,
      maxQueues: company.maxQueues,
      isActive: company.isActive,
      // Preencher dados do responsável se existir
      adminId: admin?.id || '',
      adminName: admin?.name || '',
      adminEmail: admin?.email || '',
      adminPassword: '', // Sempre vazio por segurança
      adminPasswordConfirm: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (company) => {
    if (!confirm(`Tem certeza que deseja deletar a empresa "${company.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await CompanyService.deleteCompany(company.id);
      alert('Empresa deletada com sucesso!');
      loadCompanies();
    } catch (error) {
      alert('Erro ao deletar empresa: ' + error.message);
    }
  };

  const handleToggleStatus = async (company) => {
    try {
      await CompanyService.toggleCompanyStatus(company.id, !company.isActive);
      alert(`Empresa ${!company.isActive ? 'ativada' : 'desativada'} com sucesso!`);
      loadCompanies();
    } catch (error) {
      alert('Erro ao alterar status da empresa: ' + error.message);
    }
  };

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'unlimited': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanLabel = (plan) => {
    switch (plan) {
      case 'basic': return 'Básico';
      case 'premium': return 'Premium';
      case 'unlimited': return 'Ilimitado';
      default: return plan;
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
          <p className="mt-1 text-sm text-gray-500">Apenas Super Admins podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen space-y-6">
      {/* Header Dashboard Style */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gerenciamento de Empresas</h1>
                <p className="text-slate-400">Controle e monitore todas as empresas do sistema</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <ArrowTrendingUpIcon className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Ativas</p>
                    <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                  </div>
                  <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                </div>
              </div>
              
              <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Taxa Ativa</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </p>
                  </div>
                  <ChartBarIcon className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSelectedCompany(null);
              setForm({
                name: '',
                email: '',
                plan: 'basic',
                maxUsers: 5,
                maxQueues: 3,
                isActive: true,
                adminId: '',
                adminName: '',
                adminEmail: '',
                adminPassword: '',
                adminPasswordConfirm: ''
              });
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nova Empresa</span>
          </button>
        </div>
      </div>

      {/* Dashboard com Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Pizza - Status das Empresas */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Status das Empresas</h3>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              {/* Gráfico de Pizza CSS */}
              <div className="relative w-48 h-48">
                <div 
                  className="w-full h-full rounded-full border-8 border-green-500"
                  style={{
                    background: `conic-gradient(#10B981 0deg ${stats.total > 0 ? (stats.active / stats.total) * 360 : 0}deg, #EF4444 ${stats.total > 0 ? (stats.active / stats.total) * 360 : 0}deg 360deg)`,
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full w-32 h-32 m-8 shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-xl bg-slate-700/20 border border-slate-600/30">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-slate-400">Ativas</span>
                </div>
                <p className="text-xl font-bold text-green-400">{stats.active}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-700/20 border border-slate-600/30">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-xs text-slate-400">Inativas</span>
                </div>
                <p className="text-xl font-bold text-red-400">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras - Planos */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Distribuição por Planos</h3>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="h-64 flex items-end justify-center space-x-8 p-4">
              {/* Gráfico de Barras CSS */}
              <div className="flex flex-col items-center space-y-2">
                <div 
                  className="w-16 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${stats.total > 0 ? (stats.basicPlan / Math.max(stats.basicPlan, stats.premiumPlan, stats.unlimitedPlan)) * 160 : 0}px` }}
                ></div>
                <span className="text-xs text-slate-400">Básico</span>
                <span className="text-lg font-bold text-white">{stats.basicPlan}</span>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <div 
                  className="w-16 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${stats.total > 0 ? (stats.premiumPlan / Math.max(stats.basicPlan, stats.premiumPlan, stats.unlimitedPlan)) * 160 : 0}px` }}
                ></div>
                <span className="text-xs text-slate-400">Premium</span>
                <span className="text-lg font-bold text-white">{stats.premiumPlan}</span>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <div 
                  className="w-16 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${stats.total > 0 ? (stats.unlimitedPlan / Math.max(stats.basicPlan, stats.premiumPlan, stats.unlimitedPlan)) * 160 : 0}px` }}
                ></div>
                <span className="text-xs text-slate-400">Ilimitado</span>
                <span className="text-lg font-bold text-white">{stats.unlimitedPlan}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-700/20 rounded-xl border border-slate-600/30">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-xs text-slate-400">Básico</span>
                </div>
                <p className="text-lg font-bold text-white">{stats.basicPlan}</p>
              </div>
              <div className="text-center p-3 bg-slate-700/20 rounded-xl border border-slate-600/30">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-400">Premium</span>
                </div>
                <p className="text-lg font-bold text-blue-400">{stats.premiumPlan}</p>
              </div>
              <div className="text-center p-3 bg-slate-700/20 rounded-xl border border-slate-600/30">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-slate-400">Ilimitado</span>
                </div>
                <p className="text-lg font-bold text-purple-400">{stats.unlimitedPlan}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas no estilo Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card Total */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total de Empresas</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-500 text-xs">Cadastradas no sistema</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 ml-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <BuildingOfficeIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] duration-700"></div>
        </div>

        {/* Card Ativas */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Empresas Ativas</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">{stats.active}</p>
              <p className="text-slate-500 text-xs">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0 ml-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
        </div>

        {/* Card Inativas */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Empresas Inativas</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-400">{stats.inactive}</p>
              <p className="text-slate-500 text-xs">
                {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% do total
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex-shrink-0 ml-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
        </div>

        {/* Card Responsáveis */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Com Responsáveis</p>
              <p className="text-2xl sm:text-3xl font-bold text-teal-400">{stats.withAdmins || 0}</p>
              <p className="text-slate-500 text-xs">
                {stats.withoutAdmins > 0 ? `${stats.withoutAdmins} sem responsável` : 'Todas configuradas'}
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex-shrink-0 ml-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <UsersIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State Dashboard Style */}
      {loading ? (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center justify-center h-64 sm:h-96">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium text-sm sm:text-base">Carregando empresas...</p>
            </div>
          </div>
        </div>
      ) : (
        /* Lista de empresas Dashboard Style */
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Empresas Cadastradas</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <UsersIcon className="h-4 w-4" />
                <span>{companies.length} empresas</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Recursos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Criada em
                  </th>
                  <th className="relative px-6 py-4">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {companies.map((company, index) => (
                  <tr 
                    key={company.id} 
                    className="hover:bg-slate-700/30 transition-all duration-200"
                  >
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                            company.isActive 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          } shadow-lg`}>
                            <BuildingOfficeIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-white">{company.name}</div>
                          <div className="text-sm text-slate-400">{company.email}</div>
                          <div className="text-xs text-slate-500 mt-1">ID: {company.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-md ${
                            company.users && company.users.length > 0 && company.users.some(u => u.role === 'admin')
                              ? 'bg-gradient-to-br from-green-500 to-teal-600'
                              : 'bg-gradient-to-br from-orange-500 to-red-600'
                          }`}>
                            <UsersIcon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          {company.users && company.users.length > 0 && company.users.some(u => u.role === 'admin') ? (
                            <>
                              <div className="text-sm font-semibold text-white">
                                {company.users.find(u => u.role === 'admin')?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {company.users.find(u => u.role === 'admin')?.email || 'Não informado'}
                              </div>
                              <div className="flex items-center">
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Administrador
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-semibold text-orange-400">⚠️ Sem responsável</div>
                              <div className="text-xs text-slate-500">Necessário cadastrar administrador</div>
                              <div className="flex items-center mt-1">
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                  Configuração Pendente
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(company.plan)} shadow-sm`}>
                          {getPlanLabel(company.plan)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-slate-300">
                          <div className="p-1 bg-blue-500/20 rounded-lg mr-2">
                            <UserGroupIcon className="h-3 w-3 text-blue-400" />
                          </div>
                          <span className="font-medium">{company.maxUsers}</span>
                          <span className="text-slate-400 ml-1">usuários</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-300">
                          <div className="p-1 bg-purple-500/20 rounded-lg mr-2">
                            <ChartBarIcon className="h-3 w-3 text-purple-400" />
                          </div>
                          <span className="font-medium">{company.maxQueues}</span>
                          <span className="text-slate-400 ml-1">filas</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          company.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}></div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                          company.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {company.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-300">
                        <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                        <div>
                          <div>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(company.createdAt).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Botão especial para empresas sem responsável */}
                        {(!company.users || !company.users.some(u => u.role === 'admin')) && (
                          <button
                            onClick={() => alert(`Funcionalidade de gerenciar usuários da empresa "${company.name}" será implementada em breve.`)}
                            className="p-2 text-teal-400 hover:bg-teal-500/20 rounded-lg transition-colors duration-200 animate-pulse"
                            title="Gerenciar Usuários - Criar Responsável"
                          >
                            <UsersIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors duration-200"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(company)}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            company.isActive 
                              ? 'text-orange-400 hover:bg-orange-500/20' 
                              : 'text-green-400 hover:bg-green-500/20'
                          }`}
                          title={company.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {company.isActive ? (
                            <XCircleIcon className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(company)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                          title="Deletar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {companies.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-600">
                <BuildingOfficeIcon className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma empresa cadastrada</h3>
              <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                Comece criando sua primeira empresa com um responsável para gerenciar usuários, filas e recursos.
              </p>
              <button
                onClick={() => {
                  setSelectedCompany(null);
                  setForm({
                    name: '',
                    email: '',
                    plan: 'basic',
                    maxUsers: 5,
                    maxQueues: 3,
                    isActive: true,
                    adminId: '',
                    adminName: '',
                    adminEmail: '',
                    adminPassword: '',
                    adminPasswordConfirm: ''
                  });
                  setShowModal(true);
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Criar primeira empresa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Dashboard Style */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 rounded-t-2xl border-b border-slate-600">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <div className="p-2 bg-white/20 rounded-lg mr-3">
                  {selectedCompany ? (
                    <PencilIcon className="h-6 w-6" />
                  ) : (
                    <PlusIcon className="h-6 w-6" />
                  )}
                </div>
                {selectedCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                {selectedCompany 
                  ? 'Atualize as informações da empresa' 
                  : 'Preencha os dados da empresa e do responsável administrador'
                }
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Digite o nome da empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                    placeholder="empresa@exemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Plano de Assinatura
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="basic">📦 Básico</option>
                    <option value="premium">⭐ Premium</option>
                    <option value="unlimited">🚀 Ilimitado</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Máx. Usuários
                    </label>
                    <div className="relative">
                      <UserGroupIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        value={form.maxUsers}
                        onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Máx. Filas
                    </label>
                    <div className="relative">
                      <ChartBarIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        value={form.maxQueues}
                        onChange={(e) => setForm({ ...form, maxQueues: parseInt(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Campos do Responsável da Empresa */}
                {(
                  <>
                    <div className="border-t border-slate-600 pt-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg mr-3">
                          <UsersIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            {selectedCompany ? 'Editar Responsável' : 'Responsável da Empresa'}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {selectedCompany 
                              ? 'Atualize os dados do administrador desta empresa'
                              : 'Dados do administrador que gerenciará esta empresa'
                            }
                          </p>
                          {selectedCompany && (
                            <div className="mt-2">
                              {selectedCompany.users && selectedCompany.users.some(u => u.role === 'admin') ? (
                                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  ✓ Já possui responsável
                                </div>
                              ) : (
                                <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                  ⚠️ Sem responsável cadastrado
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Mostrar dados atuais do responsável */}
                          {selectedCompany && selectedCompany.users && selectedCompany.users.some(u => u.role === 'admin') && (
                            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                              <p className="text-xs text-slate-400 mb-2">Responsável Atual:</p>
                              {(() => {
                                const admin = selectedCompany.users.find(u => u.role === 'admin');
                                return admin ? (
                                  <div className="text-sm">
                                    <div className="text-white font-medium">{admin.name}</div>
                                    <div className="text-slate-400">{admin.email}</div>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Nome do Responsável
                        {selectedCompany && <span className="text-slate-500 font-normal"> (deixe vazio para não alterar)</span>}
                      </label>
                      <input
                        type="text"
                        required={!selectedCompany}
                        value={form.adminName}
                        onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder-slate-400"
                        placeholder={selectedCompany ? "Novo nome do administrador" : "Nome completo do administrador"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Email do Responsável
                        {selectedCompany && <span className="text-slate-500 font-normal"> (deixe vazio para não alterar)</span>}
                      </label>
                      <input
                        type="email"
                        required={!selectedCompany}
                        value={form.adminEmail}
                        onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder-slate-400"
                        placeholder={selectedCompany ? "Novo email do administrador" : "admin@empresa.com"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          {selectedCompany ? 'Nova Senha' : 'Senha'}
                          {selectedCompany && <span className="text-slate-500 font-normal"> (deixe vazio para não alterar)</span>}
                        </label>
                        <input
                          type="password"
                          required={!selectedCompany}
                          value={form.adminPassword}
                          onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder-slate-400"
                          placeholder={selectedCompany ? "Nova senha (mínimo 6 caracteres)" : "Mínimo 6 caracteres"}
                          minLength="6"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Confirmar Senha
                        </label>
                        <input
                          type="password"
                          required={!selectedCompany && !!form.adminPassword}
                          value={form.adminPasswordConfirm}
                          onChange={(e) => setForm({ ...form, adminPasswordConfirm: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder-slate-400"
                          placeholder="Repita a nova senha"
                          minLength="6"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/40">
                  <div className="flex items-center">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-slate-600 rounded bg-slate-700"
                    />
                    <label htmlFor="isActive" className="ml-3 flex items-center">
                      <span className="text-sm font-semibold text-slate-300">Empresa Ativa</span>
                      <CheckCircleIcon className="h-4 w-4 ml-2 text-green-400" />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCompany(null);
                  }}
                  className="px-6 py-3 border border-slate-600 rounded-xl text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 border border-transparent rounded-xl text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all"
                >
                  {selectedCompany ? '✅ Atualizar Empresa' : '🚀 Criar Empresa + Responsável'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
