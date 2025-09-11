import React, { useState, useEffect, useRef } from 'react';
import { 
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  ServerIcon,
  UserGroupIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  TrashIcon,
  CloudArrowUpIcon,
  PlusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function SettingsComponent() {
  const { user } = useAuth();
  const { 
    settings, 
    loading: settingsLoading, 
    updateSetting, 
    uploadLogo, 
    removeLogo, 
    getSetting, 
    getLogoUrl 
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [formValues, setFormValues] = useState({});
  const fileInputRef = useRef(null);

  // Estados para alteração de perfil
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Configurações de grupos
  const [groupSettings, setGroupSettings] = useState({
    showGroups: false, // Desativado por padrão
    showIndividuals: true,
    groupNotifications: true,
    autoJoinGroups: false,
    groupAdminOnly: false
  });

  // Persistência em localStorage removida por motivos de segurança / política
  useEffect(() => {
    // Carregar dados do usuário no formulário
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Salvar configurações (apenas em memória agora)
  const saveGroupSettings = (newSettings) => {
    const oldShowGroups = groupSettings.showGroups;
    setGroupSettings(newSettings);
    if (oldShowGroups !== newSettings.showGroups) {
      window.dispatchEvent(new CustomEvent('groupSettingsChanged', { detail: { showGroups: newSettings.showGroups } }));
    }
    showMessage('Configurações de grupos atualizadas (não persistidas).');
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'appearance', label: 'Aparência', icon: PaintBrushIcon },
    { id: 'chat', label: 'Chat', icon: Cog6ToothIcon },
    { id: 'groups', label: 'Grupos', icon: UserGroupIcon },
    { id: 'notifications', label: 'Notificações', icon: BellIcon },
    { id: 'security', label: 'Segurança', icon: ShieldCheckIcon },
    { id: 'system', label: 'Sistema', icon: ServerIcon }
  ];

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // ====== CHAT SETTINGS HANDLERS ======
  const chatSettingValue = (key, def='') => (settings[key]?.value ?? def);
  const [chatForm, setChatForm] = useState({
    attendantIntro: '',
    protocolEnabled: true,
    farewellTemplate: '',
    npsEnabled: true,
    npsRequest: ''
  });

  useEffect(() => {
    setChatForm({
      attendantIntro: chatSettingValue('chat_attendant_intro_template','Olá! Meu nome é {nome} e vou continuar seu atendimento. Como posso ajudar?'),
      protocolEnabled: (chatSettingValue('chat_protocol_enabled','true') === 'true' || chatSettingValue('chat_protocol_enabled','true') === '1'),
      farewellTemplate: chatSettingValue('chat_farewell_template','Atendimento encerrado.{protocoloParte}'),
      npsEnabled: (chatSettingValue('chat_nps_enabled','true') === 'true' || chatSettingValue('chat_nps_enabled','true') === '1'),
      npsRequest: chatSettingValue('chat_nps_request_template','Sua opinião é muito importante! Responda com uma nota de 0 a 10: quanto você recomendaria nosso atendimento?')
    });
  }, [settings]);

  const handleChatFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setChatForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveChatSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await Promise.all([
        updateSetting('chat_attendant_intro_template', chatForm.attendantIntro),
        updateSetting('chat_protocol_enabled', chatForm.protocolEnabled ? 'true' : 'false'),
        updateSetting('chat_farewell_template', chatForm.farewellTemplate),
        updateSetting('chat_nps_enabled', chatForm.npsEnabled ? 'true' : 'false'),
        updateSetting('chat_nps_request_template', chatForm.npsRequest)
      ]);
      showMessage('Configurações de chat salvas.');
    } catch (err) {
      console.error(err);
      showMessage('Erro ao salvar configurações de chat.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar dados do perfil
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!profileData.name.trim()) {
      showMessage('Nome é obrigatório.', 'error');
      return;
    }

    if (!profileData.email.trim()) {
      showMessage('Email é obrigatório.', 'error');
      return;
    }

    try {
      setProfileLoading(true);
      
      const updateData = {
        name: profileData.name.trim(),
        email: profileData.email.trim()
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('Perfil atualizado com sucesso!');
        
        // Atualizar contexto de auth se disponível
        // window.location.reload(); // Opcional para recarregar dados
      } else {
        const error = await response.json();
        showMessage(error.message || 'Erro ao atualizar perfil.', 'error');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showMessage('Erro ao conectar com o servidor.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Função para alterar senha
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!profileData.currentPassword) {
      showMessage('Senha atual é obrigatória.', 'error');
      return;
    }

    if (!profileData.newPassword) {
      showMessage('Nova senha é obrigatória.', 'error');
      return;
    }

    if (profileData.newPassword.length < 6) {
      showMessage('Nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      showMessage('Confirmação de senha não confere.', 'error');
      return;
    }

    try {
      setProfileLoading(true);
      
      const passwordData = {
        currentPassword: profileData.currentPassword,
        newPassword: profileData.newPassword
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        showMessage('Senha alterada com sucesso!');
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await response.json();
        showMessage(error.message || 'Erro ao alterar senha.', 'error');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showMessage('Erro ao conectar com o servidor.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Função para upload de logo
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validação mais flexível - aceitar qualquer arquivo de imagem
    const validImageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'image/bmp', 'image/svg+xml', 'image/tiff', 'image/ico', 'image/heic'
    ];
    
    const isValidImage = file.type.startsWith('image/') || validImageTypes.includes(file.type);
    
    if (!isValidImage) {
      showMessage('Por favor, selecione um arquivo de imagem válido.', 'error');
      return;
    }

    // Validar tamanho aumentado para 10MB para aceitar imagens maiores
    if (file.size > 10 * 1024 * 1024) {
      showMessage('O arquivo deve ter no máximo 10MB.', 'error');
      return;
    }

    try {
      setLogoUploading(true);
      await uploadLogo(file);
      showMessage('Logo atualizado com sucesso! O sistema ajustou automaticamente o tamanho e qualidade.');
    } catch (error) {
      showMessage('Erro ao fazer upload do logo: ' + error.message, 'error');
    } finally {
      setLogoUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Função para remover logo
  const handleLogoRemove = async () => {
    if (!window.confirm('Tem certeza que deseja remover o logo?')) {
      return;
    }

    try {
      setLogoUploading(true);
      await removeLogo();
      showMessage('Logo removido com sucesso!');
    } catch (error) {
      showMessage('Erro ao remover logo: ' + error.message, 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  // Função para atualizar configurações de aparência
  const handleAppearanceUpdate = async (key, value) => {
    try {
      console.log(`🎨 Atualizando ${key} para:`, value);
      await updateSetting(key, value);
      showMessage('Configuração atualizada com sucesso!');
    } catch (error) {
      showMessage('Erro ao atualizar configuração: ' + error.message, 'error');
    }
  };

  // Função com debounce para atualizações automáticas
  const debouncedUpdate = useRef(null);
  const handleInputChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    
    // Cancelar timeout anterior
    if (debouncedUpdate.current) {
      clearTimeout(debouncedUpdate.current);
    }
    
    // Agendar nova atualização
    debouncedUpdate.current = setTimeout(() => {
      handleAppearanceUpdate(key, value);
    }, 1000); // 1 segundo de delay
  };

  // Limpar timeout ao desmontar componente
  useEffect(() => {
    return () => {
      if (debouncedUpdate.current) {
        clearTimeout(debouncedUpdate.current);
      }
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8">
            {/* Informações do Perfil Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Informações do Perfil</h3>
                  <p className="text-slate-400 text-sm">Atualize seus dados pessoais</p>
                </div>
              </div>
              
              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg font-semibold"
                  >
                    {profileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Alteração de Senha Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg mr-3">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Alterar Senha</h3>
                  <p className="text-slate-400 text-sm">Mantenha sua conta segura</p>
                </div>
              </div>
              
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Senha Atual *</label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-slate-400"
                      placeholder="Digite sua senha atual"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Nova Senha *</label>
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-slate-400"
                        placeholder="Digite a nova senha"
                        minLength="6"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-2">Mínimo de 6 caracteres</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Confirmar Nova Senha *</label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-slate-400"
                        placeholder="Confirme a nova senha"
                        minLength="6"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg font-semibold"
                  >
                    {profileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Alterando...
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                        Alterar Senha
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Informações da Conta */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Conta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ID do Usuário:</span>
                  <span className="ml-2 text-gray-600">{user?.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Criado em:</span>
                  <span className="ml-2 text-gray-600">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Último acesso:</span>
                  <span className="ml-2 text-gray-600">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-green-600 font-medium">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Notificação</h3>
              <div className="space-y-4">
                {['Notificações por email', 'Notificações push', 'Alertas de novos tickets'].map((setting) => (
                  <div key={setting} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700">{setting}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
                <div className="mt-4">
                  <button
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    onClick={async () => {
                      try {
                        if (!window.zazapSubscribeToPush) {
                          showMessage('Registro de notificações não disponível.', 'error');
                          return;
                        }
                        await window.zazapSubscribeToPush();
                        showMessage('Inscrição push registrada com sucesso!');
                      } catch (err) {
                        showMessage(err.message || 'Falha ao registrar push', 'error');
                      }
                    }}
                  >
                    Ativar Push
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div className="space-y-8">
            {/* Header Dashboard Style */}
            <div className="flex items-center mb-8">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Configurações de Grupos</h3>
                <p className="text-slate-400 text-sm">Gerencie a visibilidade e comportamento dos grupos</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Visibilidade Dashboard Style */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <div className="p-1 bg-emerald-500/20 rounded-lg mr-2">
                    <BellIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  Visibilidade
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <UserGroupIcon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">Mostrar grupos</span>
                        <p className="text-xs text-slate-400">Exibir conversas de grupos na lista de contatos</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={groupSettings.showGroups}
                        onChange={(e) => saveGroupSettings({...groupSettings, showGroups: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        groupSettings.showGroups ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${
                          groupSettings.showGroups ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <UserIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">Mostrar contatos individuais</span>
                        <p className="text-xs text-slate-400">Exibir conversas individuais na lista de contatos</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={groupSettings.showIndividuals}
                        onChange={(e) => saveGroupSettings({...groupSettings, showIndividuals: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        groupSettings.showIndividuals ? 'bg-blue-500' : 'bg-slate-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${
                          groupSettings.showIndividuals ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notificações Dashboard Style */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <div className="p-1 bg-yellow-500/20 rounded-lg mr-2">
                    <BellIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  Notificações
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <BellIcon className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">Notificações de grupos</span>
                        <p className="text-xs text-slate-400">Receber notificações de mensagens em grupos</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={groupSettings.groupNotifications}
                        onChange={(e) => saveGroupSettings({...groupSettings, groupNotifications: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        groupSettings.groupNotifications ? 'bg-yellow-500' : 'bg-slate-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${
                          groupSettings.groupNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Comportamento Dashboard Style */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <div className="p-1 bg-purple-500/20 rounded-lg mr-2">
                    <Cog6ToothIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  Comportamento
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <PlusIcon className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">Aceitar convites automaticamente</span>
                        <p className="text-xs text-slate-400">Entrar automaticamente em grupos quando adicionado</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={groupSettings.autoJoinGroups}
                        onChange={(e) => saveGroupSettings({...groupSettings, autoJoinGroups: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        groupSettings.autoJoinGroups ? 'bg-green-500' : 'bg-slate-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${
                          groupSettings.autoJoinGroups ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <ShieldCheckIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">Somente administradores</span>
                        <p className="text-xs text-slate-400">Responder apenas a mensagens de administradores em grupos</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={groupSettings.groupAdminOnly}
                        onChange={(e) => saveGroupSettings({...groupSettings, groupAdminOnly: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        groupSettings.groupAdminOnly ? 'bg-red-500' : 'bg-slate-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${
                          groupSettings.groupAdminOnly ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Informações Dashboard Style */}
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-6 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-blue-200 mb-4 flex items-center">
                  <div className="p-1 bg-blue-500/30 rounded-lg mr-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-300" />
                  </div>
                  Informação
                </h4>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Quando os grupos estão habilitados, uma nova aba "Grupos" aparecerá na lista de conversas. 
                  Quando desabilitados, todos os grupos desaparecerão da interface.
                </p>
              </div>

            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8">
            {/* Header Dashboard Style */}
            <div className="flex items-center mb-8">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg mr-3">
                <BellIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Configurações de Notificações</h3>
                <p className="text-slate-400 text-sm">Gerencie como e quando receber notificações</p>
              </div>
            </div>

            {/* Notificações do Sistema Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-1 bg-yellow-500/20 rounded-lg mr-2">
                  <BellIcon className="h-5 w-5 text-yellow-400" />
                </div>
                Notificações do Sistema
              </h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">Notificações de novas mensagens</span>
                      <p className="text-xs text-slate-400">Receber alertas quando novas mensagens chegarem</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-6 bg-slate-600 rounded-full transition-colors peer-checked:bg-green-500">
                      <div className="w-5 h-5 bg-white rounded-full transition-transform mt-0.5 translate-x-0.5 peer-checked:translate-x-6"></div>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <UserIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">Notificações de status de usuário</span>
                      <p className="text-xs text-slate-400">Alertas quando usuários ficam online/offline</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={false}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-6 bg-slate-600 rounded-full transition-colors peer-checked:bg-blue-500">
                      <div className="w-5 h-5 bg-white rounded-full transition-transform mt-0.5 translate-x-0.5 peer-checked:translate-x-6"></div>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Cog6ToothIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">Notificações de sistema</span>
                      <p className="text-xs text-slate-400">Alertas sobre atualizações e manutenções</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-6 bg-slate-600 rounded-full transition-colors peer-checked:bg-purple-500">
                      <div className="w-5 h-5 bg-white rounded-full transition-transform mt-0.5 translate-x-0.5 peer-checked:translate-x-6"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Configurações Avançadas Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-1 bg-orange-500/20 rounded-lg mr-2">
                  <Cog6ToothIcon className="h-5 w-5 text-orange-400" />
                </div>
                Configurações Avançadas
              </h4>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Som das Notificações</label>
                  <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400">
                    <option>Padrão</option>
                    <option>Sino</option>
                    <option>Alerta</option>
                    <option>Sem som</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Frequência de Notificações</label>
                  <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400">
                    <option>Imediata</option>
                    <option>A cada 5 minutos</option>
                    <option>A cada 15 minutos</option>
                    <option>A cada hora</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-8">
            {/* Header Dashboard Style */}
            <div className="flex items-center mb-8">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
                <ServerIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Configurações do Sistema</h3>
                <p className="text-slate-400 text-sm">Gerencie configurações gerais do sistema</p>
              </div>
            </div>

            {/* Informações do Sistema Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-1 bg-indigo-500/20 rounded-lg mr-2">
                  <ServerIcon className="h-5 w-5 text-indigo-400" />
                </div>
                Informações do Sistema
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <span className="text-sm text-slate-400">Versão do Sistema</span>
                    <p className="text-lg font-semibold text-white">ZazaPremium v2.0.1</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <span className="text-sm text-slate-400">Tempo Online</span>
                    <p className="text-lg font-semibold text-white">72h 15min</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <span className="text-sm text-slate-400">Usuários Ativos</span>
                    <p className="text-lg font-semibold text-white">15/50</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <span className="text-sm text-slate-400">Último Backup</span>
                    <p className="text-lg font-semibold text-white">Hoje 03:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações Gerais Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-1 bg-purple-500/20 rounded-lg mr-2">
                  <Cog6ToothIcon className="h-5 w-5 text-purple-400" />
                </div>
                Configurações Gerais
              </h4>
              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Título do Sistema</label>
                  <input
                    type="text"
                    defaultValue="ZazaPremium - Sistema de Atendimento"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Timeout de Sessão (minutos)</label>
                  <input
                    type="number"
                    defaultValue="30"
                    min="5"
                    max="480"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                  <div>
                    <span className="text-sm font-semibold text-white">Modo de Manutenção</span>
                    <p className="text-xs text-slate-400">Ativar quando necessário realizar manutenções</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={false}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-6 bg-slate-600 rounded-full transition-colors peer-checked:bg-red-500">
                      <div className="w-5 h-5 bg-white rounded-full transition-transform mt-0.5 translate-x-0.5 peer-checked:translate-x-6"></div>
                    </div>
                  </label>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Salvar Configurações
                </button>
              </form>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8">
            {/* Header Dashboard Style */}
            <div className="flex items-center mb-8">
              <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg mr-3">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Configurações de Segurança</h3>
                <p className="text-slate-400 text-sm">Gerencie a segurança da sua conta</p>
              </div>
            </div>

            {/* Alterar Senha Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-1 bg-red-500/20 rounded-lg mr-2">
                  <ShieldCheckIcon className="h-5 w-5 text-red-400" />
                </div>
                Alterar Senha
              </h4>
              <form className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Senha Atual</label>
                  <input
                    type="password"
                    placeholder="Digite sua senha atual"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Digite a nova senha"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Confirme a nova senha"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all duration-200"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Alterar Senha
                </button>
              </form>
            </div>

            {/* Autenticação em Duas Etapas Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-1 bg-emerald-500/20 rounded-lg mr-2">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
                </div>
                Autenticação em Duas Etapas
              </h4>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">2FA Habilitada</span>
                    <p className="text-xs text-slate-400">Proteja sua conta com autenticação dupla</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked={false}
                    className="sr-only peer" 
                  />
                  <div className="w-12 h-6 bg-slate-600 rounded-full transition-colors peer-checked:bg-emerald-500">
                    <div className="w-5 h-5 bg-white rounded-full transition-transform mt-0.5 translate-x-0.5 peer-checked:translate-x-6"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <form onSubmit={saveChatSettings} className="space-y-8">
            {/* Header Dashboard Style */}
            <div className="flex items-center mb-8">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mr-3">
                <Cog6ToothIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Configurações de Chat</h3>
                <p className="text-slate-400 text-sm">Personalize mensagens automáticas e coleta de feedback</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Template de Apresentação */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600 lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-3">Template de Apresentação</label>
                <textarea
                  name="attendantIntro"
                  value={chatForm.attendantIntro}
                  onChange={handleChatFormChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder-slate-400 text-sm"
                  placeholder="Digite o template de apresentação..."
                />
                <p className="text-xs text-slate-500 mt-2 bg-slate-800/50 p-2 rounded-lg">
                  💡 <strong>Variáveis disponíveis:</strong> <code className="bg-slate-700 px-2 py-1 rounded text-cyan-300">{'{nome}'}</code>
                </p>
              </div>

              {/* Template de Despedida */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
                <label className="block text-sm font-semibold text-slate-300 mb-3">Template de Despedida</label>
                <textarea
                  name="farewellTemplate"
                  value={chatForm.farewellTemplate}
                  onChange={handleChatFormChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder-slate-400 text-sm"
                  placeholder="Digite o template de despedida..."
                />
                <p className="text-xs text-slate-500 mt-2 bg-slate-800/50 p-2 rounded-lg">
                  💡 <strong>Variáveis:</strong> <code className="bg-slate-700 px-1 rounded text-cyan-300">{'{protocolo}'}</code> <code className="bg-slate-700 px-1 rounded text-cyan-300">{'{protocoloParte}'}</code>
                </p>
              </div>

              {/* Pergunta NPS */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
                <label className="block text-sm font-semibold text-slate-300 mb-3">Pergunta NPS</label>
                <textarea
                  name="npsRequest"
                  value={chatForm.npsRequest}
                  onChange={handleChatFormChange}
                  rows={3}
                  className={`w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder-slate-400 text-sm ${
                    !chatForm.npsEnabled ? 'opacity-50' : ''
                  }`}
                  placeholder="Digite a pergunta do NPS..."
                  disabled={!chatForm.npsEnabled}
                />
                <p className="text-xs text-slate-500 mt-2 bg-slate-800/50 p-2 rounded-lg">
                  ⭐ Usada se coleta de NPS estiver habilitada
                </p>
              </div>

              {/* Configurações de Protocolo */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <div className="flex items-center">
                      <input
                        id="protocolEnabled"
                        name="protocolEnabled"
                        type="checkbox"
                        checked={chatForm.protocolEnabled}
                        onChange={handleChatFormChange}
                        className="h-5 w-5 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-700"
                      />
                      <label htmlFor="protocolEnabled" className="text-sm font-semibold text-white ml-3 cursor-pointer">
                        Gerar protocolo
                      </label>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${chatForm.protocolEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${chatForm.protocolEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/40">
                    <div className="flex items-center">
                      <input
                        id="npsEnabled"
                        name="npsEnabled"
                        type="checkbox"
                        checked={chatForm.npsEnabled}
                        onChange={handleChatFormChange}
                        className="h-5 w-5 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-700"
                      />
                      <label htmlFor="npsEnabled" className="text-sm font-semibold text-white ml-3 cursor-pointer">
                        Coletar NPS
                      </label>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${chatForm.npsEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${chatForm.npsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botão Salvar Dashboard Style */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-6 w-6 mr-3" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </form>
        );
      case 'appearance':
        return (
          <div className="space-y-8">
            {/* Logo do Sistema Dashboard Style */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-6 rounded-2xl border border-slate-600 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mr-3">
                  <PaintBrushIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Configurações de Aparência</h3>
                  <p className="text-slate-400 text-sm">Personalize a identidade visual</p>
                </div>
              </div>
              
              {/* Logo da Empresa */}
              <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/40">
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <PhotoIcon className="h-5 w-5 mr-2 text-purple-400" />
                  Logo da Empresa
                </h4>
                <div className="space-y-6">
                  {/* Preview do Logo */}
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                      {getLogoUrl() ? (
                        <img 
                          src={getLogoUrl()} 
                          alt="Logo da empresa" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <PhotoIcon className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 mb-3 font-medium">
                        Logo da empresa. Este logo aparecerá na tela de login, barra de menu e PWA.
                      </p>
                      <p className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-600/30">
                        📝 Aceita qualquer formato de imagem (JPEG, PNG, GIF, WebP, BMP, SVG, etc.).<br/>
                        🎯 O sistema ajusta automaticamente o tamanho e qualidade.<br/>
                        📏 Máximo: 10MB
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação Dashboard Style */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={logoUploading}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      {logoUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                          {getLogoUrl() ? 'Alterar Logo' : 'Enviar Logo'}
                        </>
                      )}
                    </button>
                    
                    {getLogoUrl() && (
                      <button
                        onClick={handleLogoRemove}
                        disabled={logoUploading}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                      >
                        <TrashIcon className="w-5 h-5 mr-2" />
                        Remover Logo
                      </button>
                    )}
                  </div>

                  {/* Input de arquivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.ico,.heic"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Nome da Empresa */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">Informações da Empresa</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                    <input
                      type="text"
                      value={formValues.company_name ?? getSetting('company_name', 'Zazap')}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título do Sistema</label>
                    <input
                      type="text"
                      value={formValues.system_title ?? getSetting('system_title', 'Zazap - Sistema de Atendimento')}
                      onChange={(e) => handleInputChange('system_title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Título que aparece no sistema"
                    />
                  </div>
                </div>
              </div>

              {/* Cor Primária */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">Cores do Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formValues.primary_color ?? getSetting('primary_color', '#eab308')}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="color-picker"
                      />
                      <input
                        type="text"
                        value={formValues.primary_color ?? getSetting('primary_color', '#eab308')}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#eab308"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cor principal usada em botões e destaques</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-slate-600/50 to-slate-700/50 rounded-2xl mb-6 inline-block">
                <Cog6ToothIcon className="mx-auto h-16 w-16 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Em desenvolvimento</h3>
              <p className="text-sm text-slate-400 max-w-md">Esta seção estará disponível em breve. Estamos trabalhando para trazer mais funcionalidades.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      {/* Header Dashboard Style */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
            <Cog6ToothIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-slate-400 mt-1">Gerencie suas preferências e configurações do sistema</p>
          </div>
        </div>
      </div>

      {/* Message Dashboard Style */}
      {message && (
        <div className={`mb-6 px-6 py-4 rounded-2xl flex items-center space-x-3 border backdrop-blur-sm ${
          messageType === 'error' 
            ? 'bg-red-500/10 border-red-500/30 text-red-300' 
            : 'bg-green-500/10 border-green-500/30 text-green-300'
        }`}>
          {messageType === 'error' ? (
            <ExclamationTriangleIcon className="h-5 w-5" />
          ) : (
            <CheckIcon className="h-5 w-5" />
          )}
          <span className="font-medium">{message}</span>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Tabs Dashboard Style */}
        <div className="bg-slate-700/40 border-b border-slate-600">
          <nav className="flex flex-wrap gap-2 p-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group px-4 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                      : 'text-slate-300 bg-slate-700/50 hover:bg-slate-600/50 hover:text-white hover:scale-105'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Dashboard Style */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
