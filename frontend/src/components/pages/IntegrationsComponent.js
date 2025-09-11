import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/apiClient';
import { 
  PuzzlePieceIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function IntegrationsComponent() {
  const [integrations, setIntegrations] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'typebot',
    urlN8N: '',
    typebotSlug: '',
    typebotExpires: 0,
    typebotKeywordFinish: 'sair',
    typebotKeywordRestart: 'reiniciar', 
    typebotUnknownMessage: 'Desculpe, não entendi. Pode repetir?',
    typebotDelayMessage: 1000,
    typebotRestartMessage: 'Conversa reiniciada com sucesso!'
  });

  const integrationTypes = [
    { value: 'typebot', label: 'Typebot', description: 'Automação conversacional' },
    { value: 'webhook', label: 'Webhook', description: 'Enviar dados para URL externa' },
    { value: 'n8n', label: 'N8N', description: 'Automação com N8N' },
    { value: 'api', label: 'API', description: 'Integração via API REST' },
    { value: 'custom', label: 'Personalizada', description: 'Integração customizada' }
  ];

  useEffect(() => {
    fetchIntegrations();
    fetchQueues();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(apiUrl('/api/integrations'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      } else {
        setError('Erro ao carregar integrações');
      }
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueues = async () => {
    try {
      const response = await fetch(apiUrl('/api/queues'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setQueues(data);
      }
    } catch (error) {
      console.error('Erro ao buscar filas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingIntegration 
        ? apiUrl(`/api/integrations/${editingIntegration.id}`)
        : apiUrl('/api/integrations');
      
      const method = editingIntegration ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchIntegrations();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao salvar integração');
      }
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta integração?')) return;

    try {
      const response = await fetch(apiUrl(`/api/integrations/${id}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchIntegrations();
        setError('');
      } else {
        setError('Erro ao excluir integração');
      }
    } catch (error) {
      console.error('Erro ao excluir integração:', error);
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleTest = async (integration) => {
    try {
      const response = await fetch(apiUrl(`/api/integrations/${integration.id}/test`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        alert('Teste realizado com sucesso!');
      } else {
        alert('Falha no teste de conectividade');
      }
    } catch (error) {
      console.error('Erro ao testar integração:', error);
      alert('Erro ao testar integração');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'typebot',
      urlN8N: '',
      typebotSlug: '',
      typebotExpires: 0,
      typebotKeywordFinish: 'sair',
      typebotKeywordRestart: 'reiniciar',
      typebotUnknownMessage: 'Desculpe, não entendi. Pode repetir?',
      typebotDelayMessage: 1000,
      typebotRestartMessage: 'Conversa reiniciada com sucesso!'
    });
    setEditingIntegration(null);
  };

  const openModal = (integration = null) => {
    if (integration) {
      setFormData({
        name: integration.name || '',
        type: integration.type || 'typebot',
        urlN8N: integration.urlN8N || '',
        typebotSlug: integration.typebotSlug || '',
        typebotExpires: integration.typebotExpires || 0,
        typebotKeywordFinish: integration.typebotKeywordFinish || 'sair',
        typebotKeywordRestart: integration.typebotKeywordRestart || 'reiniciar',
        typebotUnknownMessage: integration.typebotUnknownMessage || 'Desculpe, não entendi. Pode repetir?',
        typebotDelayMessage: integration.typebotDelayMessage || 1000,
        typebotRestartMessage: integration.typebotRestartMessage || 'Conversa reiniciada com sucesso!'
      });
      setEditingIntegration(integration);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'typebot':
        return <PuzzlePieceIcon className="h-6 w-6 text-purple-600" />;
      case 'webhook':
        return <ArrowTopRightOnSquareIcon className="h-6 w-6 text-blue-600" />;
      case 'api':
        return <Cog6ToothIcon className="h-6 w-6 text-green-600" />;
      case 'n8n':
        return <PuzzlePieceIcon className="h-6 w-6 text-indigo-600" />;
      default:
        return <PuzzlePieceIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Carregando integrações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <PuzzlePieceIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Integrações
              </h1>
              <p className="text-slate-400">Gerencie integrações com sistemas externos</p>
            </div>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nova Integração</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Integrações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div 
            key={integration.id} 
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  {getTypeIcon(integration.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 capitalize">
                    {integration.type}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {integration.active ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>

            {integration.type === 'typebot' && (
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">URL:</span>
                  <span className="text-slate-300 font-mono text-xs">
                    {integration.urlN8N ? integration.urlN8N.substring(0, 30) + '...' : 'Não configurado'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Slug:</span>
                  <span className="text-slate-300">{integration.typebotSlug || 'Não configurado'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Expira em:</span>
                  <span className="text-slate-300">{integration.typebotExpires || 0} min</span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleTest(integration)}
                className="flex items-center space-x-1 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Testar</span>
              </button>
              
              <button
                onClick={() => openModal(integration)}
                className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Editar</span>
              </button>
              
              <button
                onClick={() => handleDelete(integration.id)}
                className="flex items-center space-x-1 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}

        {integrations.length === 0 && (
          <div className="col-span-full text-center py-12">
            <PuzzlePieceIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma integração encontrada</h3>
            <p className="text-slate-400 mb-6">Crie sua primeira integração para começar</p>
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
            >
              Criar Integração
            </button>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingIntegration ? 'Editar Integração' : 'Nova Integração'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 mr-2 text-purple-400" />
                  Informações Básicas
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Integração</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                    placeholder="Ex: Typebot Atendimento"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Integração</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                  >
                    {integrationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Configurações do Typebot */}
              {formData.type === 'typebot' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <PuzzlePieceIcon className="h-5 w-5 mr-2 text-purple-400" />
                    Configurações do Typebot
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">URL do Typebot</label>
                    <input
                      type="url"
                      value={formData.urlN8N}
                      onChange={(e) => setFormData({...formData, urlN8N: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                      placeholder="https://typebot.io"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Slug do Typebot</label>
                    <input
                      type="text"
                      value={formData.typebotSlug}
                      onChange={(e) => setFormData({...formData, typebotSlug: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                      placeholder="my-typebot-slug"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Expira em (minutos)</label>
                      <input
                        type="number"
                        value={formData.typebotExpires}
                        onChange={(e) => setFormData({...formData, typebotExpires: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Delay (ms)</label>
                      <input
                        type="number"
                        value={formData.typebotDelayMessage}
                        onChange={(e) => setFormData({...formData, typebotDelayMessage: parseInt(e.target.value) || 1000})}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                        placeholder="1000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Palavra para Sair</label>
                      <input
                        type="text"
                        value={formData.typebotKeywordFinish}
                        onChange={(e) => setFormData({...formData, typebotKeywordFinish: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                        placeholder="sair"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Palavra para Reiniciar</label>
                      <input
                        type="text"
                        value={formData.typebotKeywordRestart}
                        onChange={(e) => setFormData({...formData, typebotKeywordRestart: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                        placeholder="reiniciar"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem Desconhecida</label>
                    <textarea
                      value={formData.typebotUnknownMessage}
                      onChange={(e) => setFormData({...formData, typebotUnknownMessage: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                      placeholder="Desculpe, não entendi. Pode repetir?"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem de Reinício</label>
                    <textarea
                      value={formData.typebotRestartMessage}
                      onChange={(e) => setFormData({...formData, typebotRestartMessage: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                      placeholder="Conversa reiniciada com sucesso!"
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                >
                  {editingIntegration ? 'Atualizar' : 'Criar'} Integração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
