import React, { useState } from 'react';
import IntegrationsComponent from './IntegrationsComponent';
import QueueIntegrationsComponent from './QueueIntegrationsComponent';
import SessionIntegrationsComponent from './SessionIntegrationsComponent';
import {
  PuzzlePieceIcon,
  QueueListIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function IntegrationsMainComponent() {
  const [activeTab, setActiveTab] = useState('integrations');

  const tabs = [
    {
      id: 'integrations',
      name: 'Integrações Base',
      icon: PuzzlePieceIcon,
      description: 'Configurações gerais de integrações',
      component: IntegrationsComponent
    },
    {
      id: 'queue-integrations',
      name: 'Por Fila',
      icon: QueueListIcon,
      description: 'Integrações específicas por fila',
      component: QueueIntegrationsComponent
    },
    {
      id: 'session-integrations',
      name: 'Por Conexão',
      icon: DevicePhoneMobileIcon,
      description: 'Integrações automáticas por conexão',
      component: SessionIntegrationsComponent
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || IntegrationsComponent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header com navegação por tabs */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Cog6ToothIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Central de Integrações
              </h1>
              <p className="text-slate-400">Gerencie todas as suas integrações e automações</p>
            </div>
          </div>

          {/* Tabs de navegação */}
          <div className="flex space-x-1 bg-slate-700/50 rounded-xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 flex-1 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{tab.name}</div>
                    <div className={`text-xs ${
                      activeTab === tab.id ? 'text-purple-100' : 'text-slate-400'
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo da tab ativa */}
      <div className="relative">
        <ActiveComponent />
      </div>

      {/* Informações sobre o tipo de integração ativa */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-4 shadow-xl max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon || PuzzlePieceIcon, {
              className: "h-5 w-5 text-purple-400"
            })}
            <span className="font-medium text-white">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {getTabInfo(activeTab)}
          </p>
        </div>
      </div>
    </div>
  );
}

function getTabInfo(activeTab) {
  switch (activeTab) {
    case 'integrations':
      return 'Configure integrações base que podem ser reutilizadas em filas e conexões. Essas são as configurações principais que servem como modelo.';
    case 'queue-integrations':
      return 'Configure integrações específicas para cada fila. A integração será ativada quando um ticket for direcionado para a fila e permanecerá ativa até ser aceito por um atendente.';
    case 'session-integrations':
      return 'Configure integrações automáticas por conexão. Pode funcionar para todos os tickets ou apenas para aqueles sem fila definida, parando automaticamente quando o ticket for direcionado para uma fila.';
    default:
      return '';
  }
}
