import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/apiClient';
import {
  QueueListIcon,
  PuzzlePieceIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  PlayIcon,
  StopIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

export default function QueueIntegrationsComponent() {
  const [queues, setQueues] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [queueIntegrations, setQueueIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQueueIntegration, setEditingQueueIntegration] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [formData, setFormData] = useState({
    queueId: '',
    integrationId: '',
    urlN8N: '',
    typebotSlug: '',
    typebotExpires: 0,
    typebotKeywordFinish: 'sair',
    typebotKeywordRestart: 'reiniciar',
    typebotUnknownMessage: 'Desculpe, não entendi. Pode repetir?',
    typebotDelayMessage: 1000,
    typebotRestartMessage: 'Conversa reiniciada com sucesso!',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchQueues(),
        fetchIntegrations(),
        fetchQueueIntegrations()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
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

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(apiUrl('/api/integrations'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.filter(int => int.type === 'typebot'));
      }
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
    }
  };

  const fetchQueueIntegrations = async () => {
    try {
      const response = await fetch(apiUrl('/api/queue-integrations'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setQueueIntegrations(data);
      }
    } catch (error) {
      console.error('Erro ao buscar integrações de fila:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingQueueIntegration 
        ? apiUrl(`/api/queue-integrations/${editingQueueIntegration.id}`)
        : apiUrl('/api/queue-integrations');
      
      const method = editingQueueIntegration ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchQueueIntegrations();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao salvar integração de fila');
      }
    } catch (error) {
      console.error('Erro ao salvar integração de fila:', error);
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta integração de fila?')) return;

    try {
      const response = await fetch(apiUrl(`/api/queue-integrations/${id}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchQueueIntegrations();
        setError('');
      } else {
        setError('Erro ao excluir integração de fila');
      }
    } catch (error) {
      console.error('Erro ao excluir integração de fila:', error);
      setError('Erro ao conectar com o servidor');
    }
  };

  const toggleActive = async (queueIntegration) => {
    try {
      const response = await fetch(apiUrl(`/api/queue-integrations/${queueIntegration.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...queueIntegration, active: !queueIntegration.active })
      });

      if (response.ok) {
        fetchQueueIntegrations();
        setError('');
      } else {
        setError('Erro ao atualizar status da integração');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao conectar com o servidor');
    }
  };

  const resetForm = () => {
    setFormData({
      queueId: '',
      integrationId: '',
      urlN8N: '',
      typebotSlug: '',
      typebotExpires: 0,
      typebotKeywordFinish: 'sair',
      typebotKeywordRestart: 'reiniciar',
      typebotUnknownMessage: 'Desculpe, não entendi. Pode repetir?',
      typebotDelayMessage: 1000,
      typebotRestartMessage: 'Conversa reiniciada com sucesso!',
      active: true
    });
    setEditingQueueIntegration(null);
  };

  const openModal = (queueIntegration = null, queueId = '') => {
    if (queueIntegration) {
      setFormData({
        queueId: queueIntegration.queueId || '',
        integrationId: queueIntegration.integrationId || '',
        urlN8N: queueIntegration.urlN8N || '',
        typebotSlug: queueIntegration.typebotSlug || '',
        typebotExpires: queueIntegration.typebotExpires || 0,
        typebotKeywordFinish: queueIntegration.typebotKeywordFinish || 'sair',
        typebotKeywordRestart: queueIntegration.typebotKeywordRestart || 'reiniciar',
        typebotUnknownMessage: queueIntegration.typebotUnknownMessage || 'Desculpe, não entendi. Pode repetir?',
        typebotDelayMessage: queueIntegration.typebotDelayMessage || 1000,
        typebotRestartMessage: queueIntegration.typebotRestartMessage || 'Conversa reiniciada com sucesso!',
        active: queueIntegration.active !== undefined ? queueIntegration.active : true
      });
      setEditingQueueIntegration(queueIntegration);
    } else {
      resetForm();
      if (queueId) {
        setFormData(prev => ({ ...prev, queueId }));
      }
    }
    setShowModal(true);
  };

  const getQueueName = (queueId) => {
    const queue = queues.find(q => q.id === queueId);
    return queue ? queue.name : 'Fila não encontrada';
  };

  const getIntegrationName = (integrationId) => {
    const integration = integrations.find(i => i.id === integrationId);
    return integration ? integration.name : 'Integração não encontrada';
  };

  const getQueueIntegrationsByQueue = (queueId) => {
    return queueIntegrations.filter(qi => qi.queueId === queueId);
  };

  const filteredQueues = selectedQueue 
    ? queues.filter(q => q.id.toString() === selectedQueue)
    : queues;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Carregando integrações por fila...</p>
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
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <QueueListIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Integrações por Fila
              </h1>
              <p className="text-slate-400">Configure integrações específicas para cada fila</p>
            </div>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nova Integração de Fila</span>
          </button>
        </div>
      </div>

      {/* Filtro por Fila */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">Filtrar por Fila</label>
          <select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
          >
            <option value="">Todas as filas</option>
            {queues.map(queue => (
              <option key={queue.id} value={queue.id}>
                {queue.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Filas com suas Integrações */}
      <div className="space-y-6">
        {filteredQueues.map((queue) => {
          const queueIntegrationsForQueue = getQueueIntegrationsByQueue(queue.id);
          
          return (
            <div 
              key={queue.id}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <QueueListIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{queue.name}</h3>
                    <p className="text-slate-400">{queueIntegrationsForQueue.length} integração(ões) configurada(s)</p>
                  </div>
                </div>
                
                <button
                  onClick={() => openModal(null, queue.id)}
                  className="flex items-center space-x-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Adicionar Integração</span>
                </button>
              </div>

              {/* Integrações da Fila */}
              {queueIntegrationsForQueue.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {queueIntegrationsForQueue.map((qi) => (
                    <div 
                      key={qi.id}
                      className="bg-slate-800/50 rounded-xl p-4 border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <PuzzlePieceIcon className="h-5 w-5 text-purple-400" />
                          <span className="font-medium text-white">
                            {getIntegrationName(qi.integrationId)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {qi.active ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-400" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Slug:</span>
                          <span className="text-slate-300">{qi.typebotSlug || 'Não configurado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Expira em:</span>
                          <span className="text-slate-300">{qi.typebotExpires || 0} min</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(qi)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                            qi.active 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {qi.active ? (
                            <>
                              <StopIcon className="h-4 w-4" />
                              <span>Desativar</span>
                            </>
                          ) : (
                            <>
                              <PlayIcon className="h-4 w-4" />
                              <span>Ativar</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => openModal(qi)}
                          className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                        >
                          <PencilIcon className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(qi.id)}
                          className="flex items-center space-x-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                        >
                          <TrashIcon className="h-3 w-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <LinkIcon className="mx-auto h-12 w-12 mb-3 text-slate-500" />
                  <p>Nenhuma integração configurada para esta fila</p>
                  <button
                    onClick={() => openModal(null, queue.id)}
                    className="mt-3 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Configurar primeira integração
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {queues.length === 0 && (
        <div className="text-center py-12">
          <QueueListIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma fila encontrada</h3>
          <p className="text-slate-400 mb-6">Crie filas primeiro para configurar integrações</p>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingQueueIntegration ? 'Editar Integração de Fila' : 'Nova Integração de Fila'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Configuração Base */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 mr-2 text-blue-400" />
                  Configuração Base
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Fila</label>
                    <select
                      value={formData.queueId}
                      onChange={(e) => setFormData({...formData, queueId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                      required
                    >
                      <option value="">Selecione uma fila</option>
                      {queues.map(queue => (
                        <option key={queue.id} value={queue.id}>
                          {queue.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Integração Base</label>
                    <select
                      value={formData.integrationId}
                      onChange={(e) => setFormData({...formData, integrationId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                      required
                    >
                      <option value="">Selecione uma integração</option>
                      {integrations.map(integration => (
                        <option key={integration.id} value={integration.id}>
                          {integration.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Configurações do Typebot */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <PuzzlePieceIcon className="h-5 w-5 mr-2 text-purple-400" />
                  Configurações Específicas do Typebot
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL do Typebot</label>
                  <input
                    type="url"
                    value={formData.urlN8N}
                    onChange={(e) => setFormData({...formData, urlN8N: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                    placeholder="https://typebot.io/api/v1/typebots/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Slug do Typebot</label>
                  <input
                    type="text"
                    value={formData.typebotSlug}
                    onChange={(e) => setFormData({...formData, typebotSlug: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
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
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
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
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
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
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                      placeholder="sair"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Palavra para Reiniciar</label>
                    <input
                      type="text"
                      value={formData.typebotKeywordRestart}
                      onChange={(e) => setFormData({...formData, typebotKeywordRestart: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                      placeholder="reiniciar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem Desconhecida</label>
                  <textarea
                    value={formData.typebotUnknownMessage}
                    onChange={(e) => setFormData({...formData, typebotUnknownMessage: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                    placeholder="Desculpe, não entendi. Pode repetir?"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem de Reinício</label>
                  <textarea
                    value={formData.typebotRestartMessage}
                    onChange={(e) => setFormData({...formData, typebotRestartMessage: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                    placeholder="Conversa reiniciada com sucesso!"
                    rows="3"
                  />
                </div>
              </div>

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
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  {editingQueueIntegration ? 'Atualizar' : 'Criar'} Integração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
