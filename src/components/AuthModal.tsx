import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, User, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { UserAccount, UserRole } from '../types/erp';

interface AuthModalProps {
  users: UserAccount[];
  initialTab?: 'login' | 'register';
  intentMessage?: string;
  onClose: () => void;
  onLoginUser: (user: UserAccount) => void;
  onRegisterUser: (payload: {
    nombreCompleto: string;
    email: string;
    rol: UserRole;
  }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  users,
  initialTab = 'login',
  intentMessage,
  onClose,
  onLoginUser,
  onRegisterUser,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [emailInput, setEmailInput] = useState('cmendoza@andesfresh.pe');
  const [passwordInput, setPasswordInput] = useState('••••••••');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('VENDEDOR');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const matched = users.find(
      (u) =>
        u.activo &&
        (u.email.toLowerCase() === emailInput.trim().toLowerCase() ||
          u.username.toLowerCase() === emailInput.trim().toLowerCase())
    );
    if (!matched) {
      setError('Usuario no encontrado o inactivo. Usa el acceso rápido o registra una cuenta.');
      return;
    }
    onLoginUser(matched);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regName.trim().length < 3) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    onRegisterUser({
      nombreCompleto: regName.trim(),
      email: regEmail.trim(),
      rol: regRole,
    });
  };

  const adminUser = users.find((u) => u.rol === 'ADMIN' && u.activo) || users[0];
  const sellerUser = users.find((u) => u.rol === 'VENDEDOR' && u.activo) || users[1] || users[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#062113]/70 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#DCE8E0] shadow-2xl overflow-hidden">
        {/* Emerald Top Banner */}
        <div className="bg-gradient-to-r from-[#072B19] to-[#125532] px-6 py-5 flex items-center justify-between">
          <BrandLogo size="sm" theme="dark" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de acceso"
            className="rounded-lg p-1.5 text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-bold text-[#12261B]">
              {tab === 'login' ? 'Acceso al Sistema ERP' : 'Crear Cuenta de Acceso'}
            </h2>
            <p className="text-xs text-[#546B5D] mt-1">
              {intentMessage || 'Gestiona pedidos, inventario, ventas y despachos en Lima.'}
            </p>
          </div>

          {/* Segmented Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F0F5F1] border border-[#E0EBE3]">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-[#12261B] shadow-sm'
                  : 'text-[#546B5D] hover:text-[#12261B]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#12261B] shadow-sm'
                  : 'text-[#546B5D] hover:text-[#12261B]'
              }`}
            >
              Registrar Cuenta
            </button>
          </div>

          {tab === 'login' ? (
            <>
              {/* Quick Demo Role Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#3C5647]">Acceso directo por perfil</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onLoginUser(adminUser)}
                    className="flex flex-col items-start rounded-xl border border-[#CFE3D5] bg-[#F4FAF6] px-3.5 py-2.5 text-left hover:border-[#2CA947] hover:bg-[#EAF7EE] transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#0F492B] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#28A845]" />
                      Administrador
                    </span>
                    <span className="text-[11px] text-[#546B5D] mt-0.5 truncate w-full">
                      {adminUser.nombreCompleto}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginUser(sellerUser)}
                    className="flex flex-col items-start rounded-xl border border-[#CFE3D5] bg-[#F4FAF6] px-3.5 py-2.5 text-left hover:border-[#2CA947] hover:bg-[#EAF7EE] transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#0F492B] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#28A845]" />
                      Vendedor B2B
                    </span>
                    <span className="text-[11px] text-[#546B5D] mt-0.5 truncate w-full">
                      {sellerUser.nombreCompleto}
                    </span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-2 border-t border-[#EBF2ED]">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Correo o usuario
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#738A7C] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] pl-9 pr-3 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#738A7C] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] pl-9 pr-3 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-xs font-medium text-[#C82333]">{error}</p>}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6BE13C] to-[#27A646] px-4 py-3 text-sm font-bold text-[#072817] hover:brightness-105 transition-all cursor-pointer"
                >
                  Ingresar al Sistema
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej. Valeria Paredes"
                  className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Correo Corporativo
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="vparedes@andesfresh.pe"
                  className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Perfil Operativo
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                >
                  <option value="VENDEDOR">Vendedor B2B</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {error && <p className="text-xs font-medium text-[#C82333]">{error}</p>}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6BE13C] to-[#27A646] px-4 py-3 text-sm font-bold text-[#072817] hover:brightness-105 transition-all cursor-pointer"
              >
                Registrar y Entrar
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
