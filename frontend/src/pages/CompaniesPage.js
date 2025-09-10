import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CompanyService from '../services/companyService';
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
  ClockIcon
} from '@heroicons/react/24/outline';

export default function CompaniesPage() {
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
    unlimitedPlan: 0
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    plan: 'basic',
    maxUsers: 5,
    maxQueues: 3,
    isActive: true
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
      const companiesList = Array.isArray(data) ? data : [];
      setCompanies(companiesList);
      
      // Calcular estatísticas
      const statsData = {
        total: companiesList.length,
        active: companiesList.filter(c => c.isActive).length,
        inactive: companiesList.filter(c => !c.isActive).length,
        basicPlan: companiesList.filter(c => c.plan === 'basic').length,
        premiumPlan: companiesList.filter(c => c.plan === 'premium').length,
        unlimitedPlan: companiesList.filter(c => c.plan === 'unlimited').length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      alert('Erro ao carregar empresas: ' + error.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedCompany) {
        await CompanyService.updateCompany(selectedCompany.id, form);
        alert('Empresa atualizada com sucesso!');
      } else {
        await CompanyService.createCompany(form);
        alert('Empresa criada com sucesso!');
      }
      
      setShowModal(false);
      setSelectedCompany(null);
      setForm({
        name: '',
        email: '',
        plan: 'basic',
        maxUsers: 5,
        maxQueues: 3,
        isActive: true
      });
      loadCompanies();
    } catch (error) {
      alert('Erro ao salvar empresa: ' + error.message);
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setForm({
      name: company.name,
      email: company.email,
      plan: company.plan,
      maxUsers: company.maxUsers,
      maxQueues: company.maxQueues,
      isActive: company.isActive
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-600 p-3 rounded-lg">
              <BuildingOfficeIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Empresas</h1>
              <p className="text-gray-600 mt-1">Administração central de todas as empresas</p>
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
                isActive: true
              });
              setShowModal(true);
            }}
            className="inline-flex items-center px-6 py-3 bg-blue-600 border border-transparent rounded-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ativas</p>
              <p className="text-2xl font-semibold text-green-700">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inativas</p>
              <p className="text-2xl font-semibold text-red-700">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">B</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Básico</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.basicPlan}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">P</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Premium</p>
              <p className="text-2xl font-semibold text-blue-700">{stats.premiumPlan}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">U</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ilimitado</p>
              <p className="text-2xl font-semibold text-purple-700">{stats.unlimitedPlan}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Lista de Empresas</h3>
            <p className="text-sm text-gray-500 mt-1">Total de {companies.length} empresas cadastradas</p>
          </div>
          
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa cadastrada</h3>
              <p className="mt-1 text-sm text-gray-500">Comece criando uma nova empresa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                            <div className="text-sm text-gray-500">{company.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(company.plan)}`}>
                          {getPlanLabel(company.plan)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            <span>{company.maxUsers} usuários</span>
                          </div>
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 mr-1" />
                            <span>{company.maxQueues} filas</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(company)}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full transition-colors ${
                              company.isActive
                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {company.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleEdit(company)}
                            className="inline-flex items-center p-2 border border-transparent rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar empresa"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(company)}
                            className="inline-flex items-center p-2 border border-transparent rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Excluir empresa"
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
          )}
        </div>
      )}

      {/* Modal para criar/editar empresa */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ex: Minha Empresa LTDA"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contato *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="contato@minhaempresa.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plano de Assinatura
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      let maxUsers = 5;
                      let maxQueues = 3;
                      
                      if (plan === 'premium') {
                        maxUsers = 20;
                        maxQueues = 10;
                      } else if (plan === 'unlimited') {
                        maxUsers = 999;
                        maxQueues = 999;
                      }
                      
                      setForm({ ...form, plan, maxUsers, maxQueues });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="basic">Básico - R$ 29,90/mês</option>
                    <option value="premium">Premium - R$ 89,90/mês</option>
                    <option value="unlimited">Ilimitado - R$ 199,90/mês</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máx. Usuários
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={form.plan === 'unlimited' ? 9999 : form.plan === 'premium' ? 100 : 20}
                      value={form.maxUsers}
                      onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máx. Filas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={form.plan === 'unlimited' ? 9999 : form.plan === 'premium' ? 50 : 10}
                      value={form.maxQueues}
                      onChange={(e) => setForm({ ...form, maxQueues: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  />
                  <label htmlFor="isActive" className="ml-3 block text-sm text-gray-900">
                    Empresa ativa (pode fazer login e usar o sistema)
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {selectedCompany ? 'Atualizar Empresa' : 'Criar Empresa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
