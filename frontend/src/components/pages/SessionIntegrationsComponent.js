import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/apiClient';
import {
  DevicePhoneMobileIcon,
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
  LinkIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

export default function SessionIntegrationsComponent() {
  const [sessions, setSessions] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [sessionIntegrations, setSessionIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSessionIntegration, setEditingSessionIntegration] = useState(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [formData, setFormData] = useState({
    sessionId: '',
    integrationId: '',
    urlN8N: '',
    typebotSlug: '',
    typebotExpires: 0,
    typebotKeywordFinish: 'sair',
    typebotKeywordRestart: 'reiniciar',
    typebotUnknownMessage: 'Desculpe, não entendi. Pode repetir?',
    typebotDelayMessage: 1000,
    typebotRestartMessage: 'Conversa reiniciada com sucesso!',
    active: true,
    triggerOnlyWithoutQueue: true // Nova opção: só ativar quando não tem fila
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchSessions(),
        fetchIntegrations(),
        fetchSessionIntegrations()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(apiUrl('/api/sessions'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
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

  const fetchSessionIntegrations = async () => {
    try {
      const response = await fetch(apiUrl('/api/session-integrations'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSessionIntegrations(data);
      }
    } catch (error) {
      console.error('Erro ao buscar integrações de sessão:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSessionIntegration 
        ? apiUrl(`/api/session-integrations/${editingSessionIntegration.id}`)
        : apiUrl('/api/session-integrations');
      
      const method = editingSessionIntegration ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchSessionIntegrations();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao salvar integração de sessão');
      }
    } catch (error) {
      console.error('Erro ao salvar integração de sessão:', error);
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta integração de sessão?')) return;

    try {
      const response = await fetch(apiUrl(`/api/session-integrations/${id}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchSessionIntegrations();
        setError('');
      } else {
        setError('Erro ao excluir integração de sessão');
      }
    } catch (error) {
      console.error('Erro ao excluir integração de sessão:', error);
      setError('Erro ao conectar com o servidor');
    }
  };

  const toggleActive = async (sessionIntegration) => {
    try {
      const response = await fetch(apiUrl(`/api/session-integrations/${sessionIntegration.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sessionIntegration, active: !sessionIntegration.active })
      });

      if (response.ok) {
        fetchSessionIntegrations();
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
      sessionId: '',
      integrationId: '',
      urlN8N: '',
      typebotSlug: '',
      typebotExpires: 0,
      typebotKeywordFinish: 'sair',
      typebotKeywordRestart: 'reiniciar',
      typebotUnknownMessage: 'Desculpe, não entendi. Pode repetir?',
      typebotDelayMessage: 1000,
      typebotRestartMessage: 'Conversa reiniciada com sucesso!',
      active: true,
      triggerOnlyWithoutQueue: true
    });
    setEditingSessionIntegration(null);
  };

  const openModal = (sessionIntegration = null, sessionId = '') => {
    if (sessionIntegration) {
      setFormData({
        sessionId: sessionIntegration.sessionId || '',
        integrationId: sessionIntegration.integrationId || '',
        urlN8N: sessionIntegration.urlN8N || '',
        typebotSlug: sessionIntegration.typebotSlug || '',
        typebotExpires: sessionIntegration.typebotExpires || 0,
        typebotKeywordFinish: sessionIntegration.typebotKeywordFinish || 'sair',
        typebotKeywordRestart: sessionIntegration.typebotKeywordRestart || 'reiniciar',
        typebotUnknownMessage: sessionIntegration.typebotUnknownMessage || 'Desculpe, não entendi. Pode repetir?',
        typebotDelayMessage: sessionIntegration.typebotDelayMessage || 1000,
        typebotRestartMessage: sessionIntegration.typebotRestartMessage || 'Conversa reiniciada com sucesso!',
        active: sessionIntegration.active !== undefined ? sessionIntegration.active : true,
        triggerOnlyWithoutQueue: sessionIntegration.triggerOnlyWithoutQueue !== undefined ? sessionIntegration.triggerOnlyWithoutQueue : true
      });
      setEditingSessionIntegration(sessionIntegration);
    } else {
      resetForm();
      if (sessionId) {
        setFormData(prev => ({ ...prev, sessionId }));
      }
    }
    setShowModal(true);
  };

  const getSessionName = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.name || session.number : 'Sessão não encontrada';
  };

  const getSessionStatus = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.status : 'disconnected';
  };

  const getIntegrationName = (integrationId) => {
    const integration = integrations.find(i => i.id === integrationId);
    return integration ? integration.name : 'Integração não encontrada';
  };

  const getSessionIntegrationsBySession = (sessionId) => {
    return sessionIntegrations.filter(si => si.sessionId === sessionId);
  };

  const filteredSessions = selectedSession 
    ? sessions.filter(s => s.id.toString() === selectedSession)
    : sessions;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'connecting':
        return <SignalIcon className="h-5 w-5 text-yellow-400 animate-pulse" />;
      default:
        return <XMarkIcon className="h-5 w-5 text-red-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Carregando integrações por conexão...</p>
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
            <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
              <DevicePhoneMobileIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Integrações por Conexão
              </h1>
              <p className="text-slate-400">Configure integrações automáticas para cada conexão WhatsApp</p>
            </div>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nova Integração de Conexão</span>
          </button>
        </div>
      </div>

      {/* Filtro por Sessão */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">Filtrar por Conexão</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
          >
            <option value="">Todas as conexões</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name || session.number} - {session.status}
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

      {/* Lista de Sessões com suas Integrações */}
      <div className="space-y-6">
        {filteredSessions.map((session) => {
          const sessionIntegrationsForSession = getSessionIntegrationsBySession(session.id);
          
          return (
            <div 
              key={session.id}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-white">{session.name || session.number}</h3>
                      {getStatusIcon(session.status)}
                      <span className={`text-sm font-medium capitalize ${
                        session.status === 'connected' ? 'text-green-400' :
                        session.status === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-slate-400">{sessionIntegrationsForSession.length} integração(ões) configurada(s)</p>
                  </div>
                </div>
                
                <button
                  onClick={() => openModal(null, session.id)}
                  className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Adicionar Integração</span>
                </button>
              </div>

              {/* Integrações da Sessão */}
              {sessionIntegrationsForSession.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {sessionIntegrationsForSession.map((si) => (
                    <div 
                      key={si.id}
                      className="bg-slate-800/50 rounded-xl p-4 border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <PuzzlePieceIcon className="h-5 w-5 text-purple-400" />
                          <span className="font-medium text-white">
                            {getIntegrationName(si.integrationId)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {si.active ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-400" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Slug:</span>
                          <span className="text-slate-300">{si.typebotSlug || 'Não configurado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Expira em:</span>
                          <span className="text-slate-300">{si.typebotExpires || 0} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Só sem fila:</span>
                          <span className={`text-sm font-medium ${si.triggerOnlyWithoutQueue ? 'text-green-300' : 'text-blue-300'}`}>
                            {si.triggerOnlyWithoutQueue ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(si)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                            si.active 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {si.active ? (
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
                          onClick={() => openModal(si)}
                          className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                        >
                          <PencilIcon className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(si.id)}
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
                  <p>Nenhuma integração configurada para esta conexão</p>
                  <button
                    onClick={() => openModal(null, session.id)}
                    className="mt-3 text-green-400 hover:text-green-300 transition-colors"
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
      {sessions.length === 0 && (
        <div className="text-center py-12">
          <DevicePhoneMobileIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma conexão encontrada</h3>
          <p className="text-slate-400 mb-6">Crie conexões primeiro para configurar integrações</p>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingSessionIntegration ? 'Editar Integração de Conexão' : 'Nova Integração de Conexão'}
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
                  <Cog6ToothIcon className="h-5 w-5 mr-2 text-green-400" />
                  Configuração Base
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Conexão</label>
                    <select
                      value={formData.sessionId}
                      onChange={(e) => setFormData({...formData, sessionId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                      required
                    >
                      <option value="">Selecione uma conexão</option>
                      {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                          {session.name || session.number} - {session.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Integração Base</label>
                    <select
                      value={formData.integrationId}
                      onChange={(e) => setFormData({...formData, integrationId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
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

                {/* Nova opção: Só ativar quando não tem fila */}
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.triggerOnlyWithoutQueue}
                      onChange={(e) => setFormData({...formData, triggerOnlyWithoutQueue: e.target.checked})}
                      className="w-5 h-5 text-green-600 bg-slate-600 border-slate-500 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div>
                      <span className="text-white font-medium">Ativar apenas quando não há fila</span>
                      <p className="text-sm text-slate-400">
                        Se marcado, a integração só funcionará para tickets sem fila definida. 
                        Quando o ticket for direcionado para uma fila, a integração parará automaticamente.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Configurações do Typebot - mesmo código anterior */}
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
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                    placeholder="https://typebot.io/api/v1/typebots/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Slug do Typebot</label>
                  <input
                    type="text"
                    value={formData.typebotSlug}
                    onChange={(e) => setFormData({...formData, typebotSlug: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
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
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
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
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
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
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                      placeholder="sair"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Palavra para Reiniciar</label>
                    <input
                      type="text"
                      value={formData.typebotKeywordRestart}
                      onChange={(e) => setFormData({...formData, typebotKeywordRestart: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                      placeholder="reiniciar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem Desconhecida</label>
                  <textarea
                    value={formData.typebotUnknownMessage}
                    onChange={(e) => setFormData({...formData, typebotUnknownMessage: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                    placeholder="Desculpe, não entendi. Pode repetir?"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mensagem de Reinício</label>
                  <textarea
                    value={formData.typebotRestartMessage}
                    onChange={(e) => setFormData({...formData, typebotRestartMessage: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                    placeholder="Conversa reiniciada with sucesso!"
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
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                >
                  {editingSessionIntegration ? 'Atualizar' : 'Criar'} Integração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
