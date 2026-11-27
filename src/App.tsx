import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { BrandLogo } from './components/BrandLogo';
import { CatalogView } from './components/CatalogView';
import { DashboardView } from './components/DashboardView';
import {
  ClientsView,
  InventoryView,
  LogisticsView,
  ReportsView,
  SettingsView,
  UsersView,
  SalesView,
} from './components/ErpModules';
import { LandingPage } from './components/LandingPage';
import { OrderWizardView } from './components/OrderWizardView';
import {
  ADMIN_AVATAR_IMAGE,
  INITIAL_CATEGORIES,
  INITIAL_CLIENTS,
  INITIAL_DISPATCHES,
  INITIAL_MOVEMENTS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  formatKg,
} from './data/seedData';
import type {
  Category,
  Client,
  CompanySettings,
  Dispatch,
  InventoryMovement,
  LeadInquiry,
  ModuleId,
  MovementType,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Sale,
  UserAccount,
  UserRole,
} from './types/erp';

const STORAGE_KEY = 'andes_fresh_erp_state_v1';

interface PersistedState {
  products: Product[];
  categories: Category[];
  clients: Client[];
  users: UserAccount[];
  orders: Order[];
  sales: Sale[];
  dispatches: Dispatch[];
  movements: InventoryMovement[];
  settings: CompanySettings;
  leads: LeadInquiry[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.products && parsed.clients && parsed.orders) {
        return {
          products: parsed.products,
          categories: parsed.categories || INITIAL_CATEGORIES,
          clients: parsed.clients,
          users: parsed.users || INITIAL_USERS,
          orders: parsed.orders,
          sales: parsed.sales || INITIAL_SALES,
          dispatches: parsed.dispatches || INITIAL_DISPATCHES,
          movements: parsed.movements || INITIAL_MOVEMENTS,
          settings: parsed.settings || INITIAL_SETTINGS,
          leads: parsed.leads || [],
        };
      }
    }
  } catch {
    // fallback to clean seed state
  }
  return {
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    clients: INITIAL_CLIENTS,
    users: INITIAL_USERS,
    orders: INITIAL_ORDERS,
    sales: INITIAL_SALES,
    dispatches: INITIAL_DISPATCHES,
    movements: INITIAL_MOVEMENTS,
    settings: INITIAL_SETTINGS,
    leads: [],
  };
}

export default function App() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Order Wizard shared cart state so Catalog quick-add connects directly to Pedidos
  const [orderCart, setOrderCart] = useState<OrderItem[]>([]);

  // Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authIntentModule, setAuthIntentModule] = useState<ModuleId>('dashboard');
  const [authIntentMsg, setAuthIntentMsg] = useState<string | undefined>(undefined);

  // Header Popovers
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota error
    }
  }, [state]);

  const criticalProducts = useMemo(
    () =>
      state.products.filter(
        (p) =>
          p.estado === 'Activo' &&
          p.stockKg <= state.settings.umbralStockCriticoKg
      ),
    [state.products, state.settings.umbralStockCriticoKg]
  );

  const pendingDispatches = useMemo(
    () =>
      state.dispatches.filter(
        (d) => d.estadoLogistico === 'Pendiente' || d.estadoLogistico === 'En preparación'
      ),
    [state.dispatches]
  );

  const totalAlerts = criticalProducts.length + pendingDispatches.length;

  // Quick search jump results
  const searchMatches = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    const prodHits = state.products
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => ({
        label: p.nombre,
        sub: `${p.categoriaNombre} · ${formatKg(p.stockKg)}`,
        module: 'productos' as ModuleId,
      }));
    const clientHits = state.clients
      .filter((c) => c.razonSocial.toLowerCase().includes(q) || c.ruc.includes(q))
      .slice(0, 2)
      .map((c) => ({
        label: c.razonSocial,
        sub: `RUC ${c.ruc} · ${c.distrito}`,
        module: 'clientes' as ModuleId,
      }));
    const orderHits = state.orders
      .filter((o) => o.numeroPedido.toLowerCase().includes(q))
      .slice(0, 2)
      .map((o) => ({
        label: o.numeroPedido,
        sub: `${o.clienteNombre} · ${o.estado}`,
        module: 'pedidos' as ModuleId,
      }));
    return [...prodHits, ...clientHits, ...orderHits];
  }, [globalSearch, state.products, state.clients, state.orders]);

  const handleOpenAuth = (
    intent: 'login' | 'register' | 'order' = 'login',
    preselectedProduct?: Product
  ) => {
    if (preselectedProduct) {
      handleAddProductToOrder(preselectedProduct, 20);
      setAuthIntentModule('pedidos');
      setAuthIntentMsg(
        `Inicia sesión para completar tu pedido con ${preselectedProduct.nombre} (20 kg pre-cargados).`
      );
      setAuthTab('login');
    } else if (intent === 'order') {
      setAuthIntentModule('pedidos');
      setAuthIntentMsg('Ingresa al portal para registrar tu pedido B2B en 3 pasos.');
      setAuthTab('login');
    } else if (intent === 'register') {
      setAuthIntentModule('dashboard');
      setAuthIntentMsg(undefined);
      setAuthTab('register');
    } else {
      setAuthIntentModule('dashboard');
      setAuthIntentMsg(undefined);
      setAuthTab('login');
    }
    setAuthModalOpen(true);
  };

  const handleLoginUser = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveModule(authIntentModule);
    setAuthModalOpen(false);
  };

  const handleRegisterUser = (payload: {
    nombreCompleto: string;
    email: string;
    rol: UserRole;
  }) => {
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: payload.email.split('@')[0],
      nombreCompleto: payload.nombreCompleto,
      email: payload.email,
      rol: payload.rol,
      cargo: payload.rol === 'ADMIN' ? 'Administrador' : 'Vendedor B2B',
      activo: true,
    };
    setState((prev) => ({ ...prev, users: [...prev.users, newUser] }));
    setCurrentUser(newUser);
    setActiveModule(authIntentModule);
    setAuthModalOpen(false);
  };

  const handleSubmitLead = (lead: Omit<LeadInquiry, 'id' | 'fecha'>) => {
    const newLead: LeadInquiry = {
      ...lead,
      id: `lead-${Date.now()}`,
      fecha: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({ ...prev, leads: [newLead, ...prev.leads] }));
  };

  const handleAddProductToOrder = (product: Product, defaultKg = 25) => {
    setOrderCart((prev) => {
      const existing = prev.find((i) => i.productoId === product.id);
      const nextQty = Math.min(
        product.stockKg,
        (existing?.cantidadKg || 0) + defaultKg
      );
      if (nextQty <= 0) return prev;
      if (existing) {
        return prev.map((i) =>
          i.productoId === product.id
            ? {
                ...i,
                cantidadKg: nextQty,
                subtotal: Number((nextQty * product.precioKg).toFixed(2)),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          productoId: product.id,
          codigoProducto: product.codigo,
          nombreProducto: product.nombre,
          categoriaNombre: product.categoriaNombre,
          cantidadKg: nextQty,
          precioKg: product.precioKg,
          subtotal: Number((nextQty * product.precioKg).toFixed(2)),
          imagenUrl: product.imagenUrl,
        },
      ];
    });
  };

  const handleSaveProduct = (
    payload: Omit<Product, 'id' | 'fechaRegistro'> & { id?: number }
  ) => {
    setState((prev) => {
      if (payload.id) {
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === payload.id ? { ...p, ...payload, id: p.id } : p
          ),
        };
      }
      const nextId = Math.max(0, ...prev.products.map((p) => p.id)) + 1;
      const newProd: Product = {
        ...payload,
        id: nextId,
        fechaRegistro: new Date().toISOString().slice(0, 10),
      };
      return { ...prev, products: [newProd, ...prev.products] };
    });
  };

  const handleCreateOrder = (payload: {
    cliente: Client;
    vendedor: UserAccount;
    fecha: string;
    observacion: string;
    items: OrderItem[];
  }): Order => {
    const subtotal = Number(
      payload.items.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2)
    );
    const qualifiesDiscount =
      subtotal >= state.settings.montoMinimoDescuentoSoles;
    const descuento = qualifiesDiscount
      ? Number(((subtotal * state.settings.porcentajeDescuento) / 100).toFixed(2))
      : 0;
    const total = Number((subtotal - descuento).toFixed(2));

    const nextOrderNum =
      137 + Math.max(0, state.orders.length - INITIAL_ORDERS.length);
    const numeroPedido = `PED-2026-0${nextOrderNum}`;
    const numeroVenta = `VTA-2026-0${nextOrderNum}`;
    const nextOrderId = Math.max(0, ...state.orders.map((o) => o.id)) + 1;
    const nextSaleId = Math.max(0, ...state.sales.map((s) => s.id)) + 1;
    const nextDispatchId = Math.max(0, ...state.dispatches.map((d) => d.id)) + 1;

    const newOrder: Order = {
      id: nextOrderId,
      numeroPedido,
      clienteId: payload.cliente.id,
      clienteRuc: payload.cliente.ruc,
      clienteNombre: payload.cliente.razonSocial,
      clienteTipo: payload.cliente.tipo,
      vendedorId: payload.vendedor.id,
      vendedorNombre: payload.vendedor.nombreCompleto,
      fecha: payload.fecha,
      subtotal,
      descuento,
      total,
      estado: 'Confirmado',
      observacion: payload.observacion,
      items: payload.items,
    };

    const newSale: Sale = {
      id: nextSaleId,
      numeroVenta,
      pedidoId: nextOrderId,
      numeroPedido,
      clienteId: payload.cliente.id,
      clienteNombre: payload.cliente.razonSocial,
      clienteRuc: payload.cliente.ruc,
      vendedorNombre: payload.vendedor.nombreCompleto,
      fecha: payload.fecha,
      subtotal,
      descuento,
      total,
      productosResumen: payload.items
        .map((i) => `${i.nombreProducto} (${i.cantidadKg} kg)`)
        .join(', '),
      itemsCount: payload.items.length,
      estado: 'Registrada',
    };

    const newDispatch: Dispatch = {
      id: nextDispatchId,
      pedidoId: nextOrderId,
      numeroPedido,
      clienteNombre: payload.cliente.razonSocial,
      clienteDireccion: payload.cliente.direccion,
      estadoLogistico: 'Confirmado',
      responsableNombre: 'Marco Huamán',
      vehiculo: 'Furgón Refrigerado AF-01 (B7X-814)',
      zonaLima: `Lima / ${payload.cliente.distrito}`,
      fechaProgramada: payload.fecha,
      observaciones: payload.observacion,
      totalPedido: total,
      eventos: [
        {
          estado: 'Confirmado',
          fecha: `${payload.fecha} 06:00`,
          responsable: payload.vendedor.nombreCompleto,
          nota: 'Pedido confirmado y asignado a despacho matinal.',
        },
      ],
    };

    const nowStamp = `${payload.fecha} 06:00`;
    let nextMovId = Math.max(0, ...state.movements.map((m) => m.id)) + 1;
    const newMovements: InventoryMovement[] = [];

    const updatedProducts = state.products.map((prod) => {
      const line = payload.items.find((i) => i.productoId === prod.id);
      if (!line) return prod;
      const nextStock = Math.max(0, Number((prod.stockKg - line.cantidadKg).toFixed(2)));
      newMovements.push({
        id: nextMovId++,
        productoId: prod.id,
        productoCodigo: prod.codigo,
        productoNombre: prod.nombre,
        tipo: 'SALIDA',
        cantidadKg: line.cantidadKg,
        stockAnterior: prod.stockKg,
        stockNuevo: nextStock,
        motivo: `Venta pedido ${numeroPedido}`,
        referencia: numeroPedido,
        usuarioNombre: payload.vendedor.nombreCompleto,
        fecha: nowStamp,
      });
      return {
        ...prod,
        stockKg: nextStock,
        ultimoMovimiento: payload.fecha,
      };
    });

    setState((prev) => ({
      ...prev,
      products: updatedProducts,
      orders: [newOrder, ...prev.orders],
      sales: [newSale, ...prev.sales],
      dispatches: [newDispatch, ...prev.dispatches],
      movements: [...newMovements, ...prev.movements],
    }));

    setOrderCart([]);
    return newOrder;
  };

  const handleUpdateOrderStatus = (orderId: number, status: OrderStatus) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, estado: status } : o
      ),
      dispatches: prev.dispatches.map((d) =>
        d.pedidoId === orderId ? { ...d, estadoLogistico: status } : d
      ),
    }));
  };

  const handleRegisterMovement = (payload: {
    productoId: number;
    tipo: MovementType;
    cantidadKg: number;
    motivo: string;
    referencia: string;
  }) => {
    setState((prev) => {
      const target = prev.products.find((p) => p.id === payload.productoId);
      if (!target) return prev;
      const nextStock =
        payload.tipo === 'ENTRADA'
          ? target.stockKg + payload.cantidadKg
          : payload.tipo === 'SALIDA'
            ? Math.max(0, target.stockKg - payload.cantidadKg)
            : payload.cantidadKg;
      const nextId = Math.max(0, ...prev.movements.map((m) => m.id)) + 1;
      const today = new Date().toISOString().slice(0, 10);
      const mov: InventoryMovement = {
        id: nextId,
        productoId: target.id,
        productoCodigo: target.codigo,
        productoNombre: target.nombre,
        tipo: payload.tipo,
        cantidadKg: payload.cantidadKg,
        stockAnterior: target.stockKg,
        stockNuevo: Number(nextStock.toFixed(2)),
        motivo: payload.motivo,
        referencia: payload.referencia,
        usuarioNombre: currentUser?.nombreCompleto || 'Carlos Mendoza',
        fecha: `${today} 09:30`,
      };
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === target.id
            ? { ...p, stockKg: mov.stockNuevo, ultimoMovimiento: today }
            : p
        ),
        movements: [mov, ...prev.movements],
      };
    });
  };

  const handleSaveClient = (client: Omit<Client, 'id'> & { id?: number }) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.clients.map((c) => c.id)) + 1;
      return {
        ...prev,
        clients: [{ ...client, id: nextId }, ...prev.clients],
      };
    });
  };

  const handleToggleVoidSale = (saleId: number) => {
    setState((prev) => ({
      ...prev,
      sales: prev.sales.map((s) =>
        s.id === saleId ? { ...s, estado: 'Anulada' } : s
      ),
    }));
  };

  const handleAdvanceDispatchStatus = (
    dispatchId: number,
    nextStatus: OrderStatus
  ) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setState((prev) => ({
      ...prev,
      dispatches: prev.dispatches.map((d) => {
        if (d.id !== dispatchId) return d;
        return {
          ...d,
          estadoLogistico: nextStatus,
          eventos: [
            ...d.eventos,
            {
              estado: nextStatus,
              fecha: now,
              responsable: currentUser?.nombreCompleto || d.responsableNombre,
              nota: `Estado logístico actualizado a ${nextStatus}.`,
            },
          ],
        };
      }),
    }));
  };

  const handleAddUser = (payload: {
    nombreCompleto: string;
    email: string;
    rol: UserRole;
    cargo: string;
  }) => {
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: payload.email.split('@')[0],
      nombreCompleto: payload.nombreCompleto,
      email: payload.email,
      rol: payload.rol,
      cargo: payload.cargo,
      activo: true,
    };
    setState((prev) => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const handleToggleUserActive = (userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId ? { ...u, activo: !u.activo } : u
      ),
    }));
  };

  const handleResetDemo = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState({
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      clients: INITIAL_CLIENTS,
      users: INITIAL_USERS,
      orders: INITIAL_ORDERS,
      sales: INITIAL_SALES,
      dispatches: INITIAL_DISPATCHES,
      movements: INITIAL_MOVEMENTS,
      settings: INITIAL_SETTINGS,
      leads: [],
    });
    setOrderCart([]);
  };

  // Landing Page View when not signed into ERP
  if (!currentUser) {
    return (
      <>
        <LandingPage
          products={state.products}
          settings={state.settings}
          onOpenAuth={handleOpenAuth}
          onSubmitLead={handleSubmitLead}
        />
        {authModalOpen && (
          <AuthModal
            users={state.users}
            initialTab={authTab}
            intentMessage={authIntentMsg}
            onClose={() => setAuthModalOpen(false)}
            onLoginUser={handleLoginUser}
            onRegisterUser={handleRegisterUser}
          />
        )}
      </>
    );
  }

  const navItems: {
    id: ModuleId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'inventario', label: 'Inventario', icon: Boxes },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
    { id: 'ventas', label: 'Ventas', icon: Receipt },
    { id: 'logistica', label: 'Logística', icon: Truck },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'usuarios', label: 'Usuarios', icon: UserCheck, adminOnly: true },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || currentUser.rol === 'ADMIN'
  );

  return (
    <div className="min-h-screen flex bg-[#EFF5F0] text-[#17281E]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      {/* Left Deep Emerald Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[248px] shrink-0 flex flex-col justify-between bg-gradient-to-b from-[#072B19] via-[#0B3C23] to-[#0E4A2C] text-white transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveModule('dashboard')}
              className="text-left cursor-pointer focus:outline-none"
            >
              <BrandLogo size="md" theme="dark" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-white/70 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav aria-label="Menú principal ERP" className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveModule(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7CEB3B] to-[#2BB148] text-[#072817] font-bold shadow-[0_6px_18px_rgba(92,220,58,0.28)]'
                      : 'text-white/80 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'pedidos' && orderCart.length > 0 && (
                    <span
                      className={`font-mono-num text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[#072817]/15 text-[#072817]'
                          : 'bg-[#7CEB3B]/20 text-[#9CF95A]'
                      }`}
                    >
                      {orderCart.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setCurrentUser(null);
              setProfileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#F6FAF7]/90 backdrop-blur-md border-b border-[#E1EBE3] px-4 sm:px-7 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú lateral"
              className="lg:hidden p-2 rounded-xl bg-white border border-[#DCE8E0] text-[#17281E]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#748B7D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Buscar productos, pedidos o clientes..."
                className="w-full rounded-full bg-white border border-[#DCE8E0] pl-10 pr-4 py-2 text-xs sm:text-sm text-[#12261B] placeholder:text-[#7E9487] focus:border-[#28A845] focus:outline-none shadow-2xs"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#748B7D] hover:text-[#12261B] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Quick Search Dropdown */}
              {searchMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white border border-[#DCE8E0] shadow-xl p-2 z-40">
                  {searchMatches.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveModule(m.module);
                        setGlobalSearch('');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F2F7F3] flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#12261B]">{m.label}</div>
                        <div className="text-[11px] text-[#5B7264]">{m.sub}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#1E7A3E] capitalize">
                        {m.module}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAlertsOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label="Notificaciones operativas"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#DCE8E0] text-[#354E3F] hover:bg-[#F2F7F3] transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white font-mono-num">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-[#DCE8E0] shadow-xl p-4 z-40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#12261B]">
                      Alertas Operativas ({totalAlerts})
                    </span>
                    <button
                      type="button"
                      onClick={() => setAlertsOpen(false)}
                      className="text-[#748B7D] hover:text-[#12261B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {criticalProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('inventario');
                          setAlertsOpen(false);
                        }}
                        className="w-full text-left rounded-xl bg-[#FEF2F2] border border-[#F7D4D4] p-2.5 hover:brightness-98 cursor-pointer"
                      >
                        <div className="font-bold text-[#B91C1C] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {criticalProducts.length} productos con stock crítico
                        </div>
                        <div className="text-[#7F1D1D] mt-0.5 truncate">
                          {criticalProducts.map((p) => p.nombre).join(', ')}
                        </div>
                      </button>
                    )}
                    {pendingDispatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('logistica');
                          setAlertsOpen(false);
                        }}
                        className="w-full text-left rounded-xl bg-[#F4FAF6] border border-[#D4E7DA] p-2.5 hover:brightness-98 cursor-pointer"
                      >
                        <div className="font-bold text-[#14592F] flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5" />
                          {pendingDispatches.length} despachos en preparación
                        </div>
                        <div className="text-[#496253] mt-0.5">
                          Revisar rutas programadas en Lima
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setAlertsOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-full bg-white border border-[#DCE8E0] pl-1.5 pr-3 py-1 hover:bg-[#F2F7F3] transition-colors cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || ADMIN_AVATAR_IMAGE}
                  alt={currentUser.nombreCompleto}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover shrink-0"
                />
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold text-[#12261B] whitespace-nowrap">
                    {currentUser.nombreCompleto}
                  </div>
                  <div className="text-[11px] text-[#5B7264] whitespace-nowrap">
                    {currentUser.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#5B7264]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white border border-[#DCE8E0] shadow-xl p-2 z-40 space-y-1">
                  <div className="px-3 py-2 border-b border-[#EFF4F0]">
                    <div className="text-xs font-bold text-[#12261B]">
                      {currentUser.nombreCompleto}
                    </div>
                    <div className="text-[11px] text-[#5B7264]">{currentUser.email}</div>
                  </div>
                  <div className="px-2 pt-1 text-[11px] font-semibold text-[#61786A]">
                    Cambiar usuario activo
                  </div>
                  {state.users
                    .filter((u) => u.activo)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setCurrentUser(u);
                          if (u.rol === 'VENDEDOR' && activeModule === 'usuarios') {
                            setActiveModule('dashboard');
                          }
                          setProfileOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                          u.id === currentUser.id
                            ? 'bg-[#EAF8EE] font-bold text-[#14592F]'
                            : 'text-[#314A3B] hover:bg-[#F2F7F3]'
                        }`}
                      >
                        <span>{u.nombreCompleto}</span>
                        <span className="text-[10px] font-mono-num">
                          {u.rol}
                        </span>
                      </button>
                    ))}
                  <div className="pt-1 border-t border-[#EFF4F0]">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentUser(null);
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#C82333] hover:bg-[#FEF2F2] cursor-pointer"
                    >
                      Volver a la página pública
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Active ERP Module Viewport */}
        <main className="flex-1 p-4 sm:p-7 max-w-[1440px] w-full mx-auto">
          {activeModule === 'dashboard' && (
            <DashboardView
              products={state.products}
              orders={state.orders}
              sales={state.sales}
              settings={state.settings}
              onNavigate={setActiveModule}
            />
          )}

          {activeModule === 'productos' && (
            <CatalogView
              products={state.products}
              categories={state.categories}
              settings={state.settings}
              userRole={currentUser.rol}
              searchQuery={globalSearch}
              orderCartCount={orderCart.length}
              onAddToOrder={(p) => handleAddProductToOrder(p, 25)}
              onGoToOrder={() => setActiveModule('pedidos')}
              onSaveProduct={handleSaveProduct}
            />
          )}

          {activeModule === 'pedidos' && (
            <OrderWizardView
              products={state.products}
              clients={state.clients}
              users={state.users}
              orders={state.orders}
              settings={state.settings}
              currentUser={currentUser}
              cartItems={orderCart}
              onUpdateCart={setOrderCart}
              onCreateOrder={handleCreateOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeModule === 'inventario' && (
            <InventoryView
              products={state.products}
              movements={state.movements}
              settings={state.settings}
              userRole={currentUser.rol}
              searchQuery={globalSearch}
              onRegisterMovement={handleRegisterMovement}
            />
          )}

          {activeModule === 'clientes' && (
            <ClientsView
              clients={state.clients}
              searchQuery={globalSearch}
              onSaveClient={handleSaveClient}
            />
          )}

          {activeModule === 'ventas' && (
            <SalesView
              sales={state.sales}
              userRole={currentUser.rol}
              searchQuery={globalSearch}
              onToggleVoidSale={handleToggleVoidSale}
            />
          )}

          {activeModule === 'logistica' && (
            <LogisticsView
              dispatches={state.dispatches}
              onAdvanceDispatchStatus={handleAdvanceDispatchStatus}
            />
          )}

          {activeModule === 'reportes' && (
            <ReportsView
              products={state.products}
              orders={state.orders}
              sales={state.sales}
            />
          )}

          {activeModule === 'usuarios' && (
            <UsersView
              users={state.users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onToggleActive={handleToggleUserActive}
            />
          )}

          {activeModule === 'configuracion' && (
            <SettingsView
              settings={state.settings}
              userRole={currentUser.rol}
              onSaveSettings={(next) =>
                setState((prev) => ({ ...prev, settings: next }))
              }
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
