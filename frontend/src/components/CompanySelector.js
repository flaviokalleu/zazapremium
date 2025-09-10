import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CompanyService from '../services/companyService';
import { BuildingOfficeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function CompanySelector({ selectedCompanyId, onCompanyChange }) {
  const { user, isMasterAdmin } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isMasterAdmin || user?.role === 'super_admin') {
      loadCompanies();
    }
  }, [isMasterAdmin, user]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await CompanyService.getCompanies();
      setCompanies(Array.isArray(data) ? data.filter(company => company.isActive) : []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      alert('Erro ao carregar empresas: ' + error.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company) => {
    onCompanyChange(company);
    setIsOpen(false);
  };

  // Se não é master admin ou super_admin, não mostrar o seletor
  if (!isMasterAdmin && user?.role !== 'super_admin') {
    return null;
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        disabled={loading}
      >
        <span className="flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="block truncate">
            {loading ? 'Carregando...' : selectedCompany ? selectedCompany.name : 'Selecione uma empresa'}
          </span>
        </span>
        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && !loading && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {companies.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 text-center">
              Nenhuma empresa encontrada
            </div>
          ) : (
            companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                  selectedCompanyId === company.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                  <span className="block truncate">{company.name}</span>
                  {company.plan && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {company.plan}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 ml-6">{company.email}</div>
              </button>
            ))
          )}
        </div>
      )}
      
      {/* Overlay para fechar o dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
