import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import CompanyService from '../services/companyService';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const { user, isMasterAdmin } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar empresas quando for super_admin
  useEffect(() => {
    if (isMasterAdmin || user?.role === 'super_admin') {
      loadCompanies();
    } else {
      // Se não é super_admin, usar a empresa do usuário
      if (user?.company) {
        setSelectedCompany(user.company);
      }
    }
  }, [user, isMasterAdmin]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await CompanyService.getCompanies();
      setCompanies(Array.isArray(data) ? data : []);
      
      // Se não há empresa selecionada, usar a empresa do usuário ou a primeira ativa
      if (!selectedCompany) {
        let defaultCompany = null;
        
        if (user?.company) {
          // Usar empresa do usuário se disponível
          defaultCompany = data.find(c => c.id === user.company.id) || user.company;
        } else {
          // Senão, usar primeira empresa ativa
          defaultCompany = data.find(c => c.isActive) || data[0];
        }
        
        if (defaultCompany) {
          setSelectedCompany(defaultCompany);
          localStorage.setItem('selectedCompany', JSON.stringify(defaultCompany));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    localStorage.setItem('selectedCompany', JSON.stringify(company));
  };

  const value = {
    selectedCompany,
    companies,
    loading,
    selectCompany,
    loadCompanies,
    isSuperAdmin: isMasterAdmin || user?.role === 'super_admin'
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
