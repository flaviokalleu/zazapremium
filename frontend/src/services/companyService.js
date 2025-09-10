import { API_BASE_URL } from '../utils/apiClient.js';
import AuthService from './authService.js';

class CompanyService {
  // Listar todas as empresas (apenas para master admin)
  static async getCompanies() {
    try {
      const response = await AuthService.get(`${API_BASE_URL}/api/companies`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar empresas');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      throw error;
    }
  }

  // Obter empresa específica
  static async getCompany(companyId) {
    try {
      const response = await AuthService.get(`${API_BASE_URL}/api/companies/${companyId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
      throw error;
    }
  }

  // Criar nova empresa (apenas para master admin)
  static async createCompany(companyData) {
    try {
      const response = await AuthService.post(`${API_BASE_URL}/api/companies`, companyData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      throw error;
    }
  }

  // Atualizar empresa
  static async updateCompany(companyId, companyData) {
    try {
      const response = await AuthService.put(`${API_BASE_URL}/api/companies/${companyId}`, companyData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw error;
    }
  }

  // Deletar empresa (apenas para master admin)
  static async deleteCompany(companyId) {
    try {
      const response = await AuthService.delete(`${API_BASE_URL}/api/companies/${companyId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      throw error;
    }
  }

  // Obter estatísticas da empresa
  static async getCompanyStats(companyId) {
    try {
      const response = await AuthService.get(`${API_BASE_URL}/api/companies/${companyId}/stats`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas da empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar estatísticas da empresa:', error);
      throw error;
    }
  }

  // Obter usuários da empresa
  static async getCompanyUsers(companyId) {
    try {
      const response = await AuthService.get(`${API_BASE_URL}/api/companies/${companyId}/users`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários da empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar usuários da empresa:', error);
      throw error;
    }
  }

  // Ativar/Desativar empresa (apenas para master admin)
  static async toggleCompanyStatus(companyId, isActive) {
    try {
      const response = await AuthService.put(`${API_BASE_URL}/api/companies/${companyId}/status`, {
        isActive
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao alterar status da empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao alterar status da empresa:', error);
      throw error;
    }
  }
}

export default CompanyService;
