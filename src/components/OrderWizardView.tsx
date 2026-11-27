import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  calculateOrderTotals,
  formatKg,
  formatSoles,
} from '../data/seedData';
import type {
  Client,
  CompanySettings,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  UserAccount,
} from '../types/erp';

interface OrderWizardViewProps {
  products: Product[];
  clients: Client[];
  users: UserAccount[];
  orders: Order[];
  settings: CompanySettings;
  currentUser: UserAccount;
  cartItems: OrderItem[];
  onUpdateCart: (items: OrderItem[]) => void;
  onCreateOrder: (payload: {
    cliente: Client;
    vendedor: UserAccount;
    fecha: string;
    observacion: string;
    items: OrderItem[];
  }) => Order;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => void;
}

export const OrderWizardView: React.FC<OrderWizardViewProps> = ({
  products,
  clients,
  users,
  orders,
  settings,
  currentUser,
  cartItems,
  onUpdateCart,
  onCreateOrder,
  onUpdateOrderStatus,
}) => {
  const [subView, setSubView] = useState<'new' | 'history'>('new');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const activeClients = useMemo(
    () => clients.filter((c) => c.estado === 'Activo'),
    [clients]
  );
  const sellers = useMemo(
    () => users.filter((u) => u.activo),
    [users]
  );

  const [selectedClientId, setSelectedClientId] = useState<number>(
    activeClients[0]?.id || 1
  );
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    sellers.find((s) => s.nombreCompleto === 'Ana Torres')?.id || currentUser.id
  );
  const [orderDate, setOrderDate] = useState<string>('2026-01-31');
  const [observacion, setObservacion] = useState<string>(
    'Entrega en horario de la mañana.'
  );
  const [productQuery, setProductQuery] = useState<string>('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>('Todos');

  const selectedClient = useMemo(
    () => activeClients.find((c) => c.id === selectedClientId) || activeClients[0],
    [activeClients, selectedClientId]
  );

  const selectedSeller = useMemo(
    () => sellers.find((s) => s.id === selectedSellerId) || currentUser,
    [sellers, selectedSellerId, currentUser]
  );

  const activeProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (p.estado !== 'Activo') return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.categoriaNombre.toLowerCase().includes(q)
      );
    });
  }, [products, productQuery]);

  // Stock verification across all items in cart
  const stockValid = useMemo(() => {
    if (cartItems.length === 0) return true;
    return cartItems.every((item) => {
      const prod = products.find((p) => p.id === item.productoId);
      return prod ? item.cantidadKg > 0 && item.cantidadKg <= prod.stockKg : false;
    });
  }, [cartItems, products]);

  const totals = useMemo(
    () => calculateOrderTotals(cartItems, settings),
    [cartItems, settings]
  );

  const handleSetItemQty = (prod: Product, nextQty: number) => {
    const clamped = Math.max(0, Math.min(prod.stockKg, Number(nextQty.toFixed(2))));
    if (clamped <= 0) {
      onUpdateCart(cartItems.filter((i) => i.productoId !== prod.id));
      return;
    }

    const exists = cartItems.find((i) => i.productoId === prod.id);
    if (exists) {
      onUpdateCart(
        cartItems.map((i) =>
          i.productoId === prod.id
            ? {
                ...i,
                cantidadKg: clamped,
                subtotal: Number((clamped * prod.precioKg).toFixed(2)),
              }
            : i
        )
      );
    } else {
      onUpdateCart([
        ...cartItems,
        {
          productoId: prod.id,
          codigoProducto: prod.codigo,
          nombreProducto: prod.nombre,
          categoriaNombre: prod.categoriaNombre,
          cantidadKg: clamped,
          precioKg: prod.precioKg,
          subtotal: Number((clamped * prod.precioKg).toFixed(2)),
          imagenUrl: prod.imagenUrl,
        },
      ]);
    }
  };

  const handleCancelWizard = () => {
    setStep(1);
    onUpdateCart([]);
    setConfirmedOrder(null);
  };

  const handleConfirm = () => {
    if (!selectedClient || cartItems.length === 0 || !totals.meetsMinimum || !stockValid) {
      return;
    }
    const created = onCreateOrder({
      cliente: selectedClient,
      vendedor: selectedSeller,
      fecha: orderDate,
      observacion: observacion.trim() || 'Sin observaciones.',
      items: cartItems,
    });
    setConfirmedOrder(created);
  };

  const filteredOrders = useMemo(() => {
    if (historyFilter === 'Todos') return orders;
    return orders.filter((o) => o.estado === historyFilter);
  }, [orders, historyFilter]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#5B7264]">
            <span>Pedidos</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#12261B]">
              {subView === 'new' ? 'Nuevo Pedido' : 'Historial de Pedidos'}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B] mt-1">
            {subView === 'new' ? 'Registrar Pedido' : 'Gestión de Pedidos'}
          </h1>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#DCE8E0] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setSubView('new');
              setConfirmedOrder(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'new'
                ? 'bg-[#0F4A2B] text-white'
                : 'text-[#546B5D] hover:text-[#12261B]'
            }`}
          >
            Nuevo Pedido
          </button>
          <button
            type="button"
            onClick={() => setSubView('history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'history'
                ? 'bg-[#0F4A2B] text-white'
                : 'text-[#546B5D] hover:text-[#12261B]'
            }`}
          >
            Historial ({orders.length})
          </button>
        </div>
      </div>

      {subView === 'history' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {['Todos', 'Pendiente', 'Confirmado', 'En preparación', 'Despachado', 'Entregado'].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setHistoryFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    historyFilter === st
                      ? 'bg-[#0F4A2B] text-white'
                      : 'bg-white border border-[#DCE8E0] text-[#496253] hover:bg-[#F2F7F3]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="rounded-2xl bg-white border border-[#E2ECE5] overflow-hidden shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F6FAF7] border-b border-[#E4EDE6] text-xs text-[#546B5D]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">N° Pedido</th>
                    <th className="py-3 px-4 font-semibold">Cliente</th>
                    <th className="py-3 px-4 font-semibold">Vendedor</th>
                    <th className="py-3 px-4 font-semibold">Fecha</th>
                    <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                    <th className="py-3 px-4 font-semibold text-right">Descuento</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF4F0]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F9FCFA]">
                      <td className="py-3.5 px-4 font-mono-num text-xs font-bold text-[#12261B] whitespace-nowrap">
                        {order.numeroPedido}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#12261B]">
                          {order.clienteNombre}
                        </div>
                        <div className="font-mono-num text-xs text-[#61786A]">
                          RUC {order.clienteRuc} · {order.items.length} ítems
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#496253]">
                        {order.vendedorNombre}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-xs text-[#546B5D] whitespace-nowrap">
                        {order.fecha}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-xs text-[#496253] text-right whitespace-nowrap">
                        {formatSoles(order.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-xs text-[#1E7A3E] text-right whitespace-nowrap">
                        {order.descuento > 0 ? `-${formatSoles(order.descuento)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-xs font-bold text-[#12261B] text-right whitespace-nowrap">
                        {formatSoles(order.total)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          aria-label={`Estado pedido ${order.numeroPedido}`}
                          value={order.estado}
                          onChange={(e) =>
                            onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="rounded-lg border border-[#D4E2D8] bg-[#FAFDFB] px-2.5 py-1 text-xs font-semibold text-[#12261B] focus:border-[#28A845] focus:outline-none cursor-pointer"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="En preparación">En preparación</option>
                          <option value="Despachado">Despachado</option>
                          <option value="Entregado">Entregado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : confirmedOrder ? (
        /* Order Confirmation Success View */
        <div className="rounded-2xl bg-white border border-[#DCE8E0] p-8 max-w-2xl mx-auto text-center shadow-[0_6px_24px_rgba(14,54,32,0.05)] space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F8EA] text-[#1D8E3F]">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#12261B]">
              Pedido {confirmedOrder.numeroPedido} registrado
            </h2>
            <p className="text-sm text-[#546B5D] mt-1">
              Se generó el comprobante de venta, se descontó el stock del inventario y se programó el despacho en Logística.
            </p>
          </div>
          <div className="rounded-xl bg-[#F6FAF7] border border-[#E2ECE5] p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[#5B7264]">Cliente:</span>
              <span className="font-semibold text-[#12261B]">{confirmedOrder.clienteNombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5B7264]">Ítems:</span>
              <span className="font-mono-num font-semibold text-[#12261B]">
                {confirmedOrder.items.length} productos
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5B7264]">Total neto:</span>
              <span className="font-mono-num font-bold text-[#157A39]">
                {formatSoles(confirmedOrder.total)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSubView('history')}
              className="px-5 py-2.5 rounded-xl border border-[#DCE8E0] text-sm font-semibold text-[#12261B] hover:bg-[#F2F7F3] cursor-pointer"
            >
              Ver historial de pedidos
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setStep(1);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5ED938] to-[#24A446] text-sm font-bold text-white hover:brightness-105 cursor-pointer"
            >
              Registrar otro pedido
            </button>
          </div>
        </div>
      ) : (
        /* 3-Step Order Wizard Matching Screenshot Panel 4 */
        <div className="space-y-6">
          {/* Horizontal Stepper */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2">
            {[
              { num: 1 as const, label: 'Datos del pedido' },
              { num: 2 as const, label: 'Agregar productos' },
              { num: 3 as const, label: 'Confirmación' },
            ].map((s, idx) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    type="button"
                    onClick={() => setStep(s.num)}
                    className="inline-flex items-center gap-2.5 cursor-pointer group"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-mono-num transition-colors ${
                        isActive
                          ? 'bg-[#28A845] text-white shadow-sm'
                          : isDone
                            ? 'bg-[#136535] text-white'
                            : 'bg-[#DCE6DF] text-[#5B7264]'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                        isActive
                          ? 'text-[#12261B]'
                          : isDone
                            ? 'text-[#1A6B39]'
                            : 'text-[#6A8073]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                  {idx < 2 && (
                    <div
                      aria-hidden="true"
                      className={`hidden sm:block h-[2px] w-14 rounded-full ${
                        step > s.num ? 'bg-[#28A845]' : 'bg-[#D6E2D9]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* 2-Column Main Split: Left Step Form / Picker + Right Resumen del pedido */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Workspace */}
            <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E2ECE5] p-6 shadow-[0_4px_18px_rgba(14,54,32,0.03)]">
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#12261B]">
                      Datos del pedido
                    </h2>
                    <p className="text-xs text-[#5B7264] mt-0.5">
                      Selecciona el cliente B2B, ejecutivo comercial y fecha de entrega programada.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                      Cliente <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                    >
                      {activeClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.razonSocial} – {client.ruc}
                        </option>
                      ))}
                    </select>
                    {selectedClient && (
                      <p className="text-xs text-[#5B7264] mt-1.5">
                        {selectedClient.tipo} · {selectedClient.direccion}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                        Vendedor <span className="text-[#DC2626]">*</span>
                      </label>
                      <select
                        value={selectedSellerId}
                        onChange={(e) => setSelectedSellerId(e.target.value)}
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      >
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombreCompleto}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                        Fecha <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm font-mono-num text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                      Observación
                    </label>
                    <textarea
                      rows={3}
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      placeholder="Horario preferente, puerta de descarga o instrucciones..."
                      className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#12261B]">
                        Agregar productos
                      </h2>
                      <p className="text-xs text-[#5B7264]">
                        Ajusta los kilogramos requeridos según disponibilidad en almacén.
                      </p>
                    </div>
                    <div className="relative w-full sm:w-56">
                      <Search className="w-4 h-4 text-[#748B7D] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] pl-9 pr-3 py-2 text-xs text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-[#EFF4F0] max-h-[380px] overflow-y-auto pr-1">
                    {activeProducts.map((prod) => {
                      const inCart = cartItems.find((i) => i.productoId === prod.id);
                      const qty = inCart?.cantidadKg || 0;

                      return (
                        <div
                          key={prod.id}
                          className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={prod.imagenUrl}
                              alt={prod.nombre}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-xl object-contain border border-[#E8F0EA] bg-white shrink-0 p-1"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#12261B] truncate">
                                {prod.nombre}
                              </div>
                              <div className="font-mono-num text-xs text-[#5B7264]">
                                {formatSoles(prod.precioKg)} / kg · Disp: {formatKg(prod.stockKg)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetItemQty(prod, Math.max(0, qty - 10))}
                              aria-label={`Restar 10 kg de ${prod.nombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4E2D8] text-[#314A3B] hover:bg-[#F2F7F3] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={prod.stockKg}
                              step="5"
                              value={qty || ''}
                              placeholder="0"
                              onChange={(e) =>
                                handleSetItemQty(prod, Number(e.target.value) || 0)
                              }
                              className="w-16 rounded-lg border border-[#D4E2D8] px-2 py-1.5 text-center text-xs font-mono-num font-bold text-[#12261B] focus:border-[#28A845] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetItemQty(prod, qty + 10)}
                              aria-label={`Sumar 10 kg de ${prod.nombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF8EE] text-[#177A3B] hover:bg-[#D5F2DD] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#12261B]">
                      Confirmación del pedido
                    </h2>
                    <p className="text-xs text-[#5B7264]">
                      Revisa el detalle completo antes de emitir el pedido y generar la guía de despacho.
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F7FBF8] border border-[#E2ECE5] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#5B7264]">Cliente:</span>
                      <div className="font-bold text-[#12261B] mt-0.5">
                        {selectedClient?.razonSocial}
                      </div>
                      <div className="font-mono-num text-[#5B7264]">
                        RUC {selectedClient?.ruc}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#5B7264]">Responsable y fecha:</span>
                      <div className="font-bold text-[#12261B] mt-0.5">
                        {selectedSeller.nombreCompleto} · {orderDate}
                      </div>
                      <div className="text-[#5B7264] truncate">{observacion}</div>
                    </div>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center rounded-xl border border-dashed border-[#CFE0D4]">
                      <ShoppingBag className="w-8 h-8 text-[#748B7D] mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[#12261B]">
                        Aún no agregaste productos al pedido
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="mt-3 px-4 py-2 rounded-lg bg-[#EAF8EE] text-xs font-bold text-[#177A3B] cursor-pointer"
                      >
                        Agregar productos ahora
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EFF4F0]">
                      {cartItems.map((item) => (
                        <div
                          key={item.productoId}
                          className="py-2.5 flex items-center justify-between gap-3 text-sm"
                        >
                          <div>
                            <div className="font-semibold text-[#12261B]">
                              {item.nombreProducto}
                            </div>
                            <div className="font-mono-num text-xs text-[#5B7264]">
                              {formatKg(item.cantidadKg)} × {formatSoles(item.precioKg)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono-num font-bold text-[#12261B]">
                              {formatSoles(item.subtotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateCart(
                                  cartItems.filter((i) => i.productoId !== item.productoId)
                                )
                              }
                              aria-label={`Quitar ${item.nombreProducto}`}
                              className="p-1 text-[#899E91] hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Resumen del pedido */}
            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-2xl bg-white border border-[#E2ECE5] p-6 shadow-[0_4px_18px_rgba(14,54,32,0.03)] space-y-4">
                <h2 className="font-display text-lg font-bold text-[#12261B]">
                  Resumen del pedido
                </h2>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#496253]">Subtotal</span>
                    <span className="font-mono-num font-bold text-[#12261B]">
                      {formatSoles(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#496253]">
                      Descuento ({settings.porcentajeDescuento}%)
                    </span>
                    <span className="font-mono-num font-semibold text-[#1E7A3E]">
                      {totals.descuento > 0 ? `-${formatSoles(totals.descuento)}` : formatSoles(0)}
                    </span>
                  </div>
                </div>

                {/* Highlighted Lime-Tinted Total Row */}
                <div className="flex items-center justify-between rounded-xl bg-[#DDF6A7]/70 px-4 py-3">
                  <span className="font-display text-base font-bold text-[#12261B]">
                    Total
                  </span>
                  <span className="font-mono-num text-xl font-extrabold text-[#12261B]">
                    {formatSoles(totals.total)}
                  </span>
                </div>

                {/* Validation Checklist */}
                <div className="pt-2 border-t border-[#EFF4F0] space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        totals.meetsMinimum
                          ? 'bg-[#6CE138] text-white'
                          : 'bg-[#E5ECE7] text-[#748B7D]'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span
                      className={
                        totals.meetsMinimum ? 'text-[#1F3528] font-medium' : 'text-[#6A8073]'
                      }
                    >
                      Pedido mínimo: <span className="font-mono-num">{formatSoles(settings.pedidoMinimoSoles)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        totals.qualifiesDiscount
                          ? 'bg-[#6CE138] text-white'
                          : 'bg-[#E5ECE7] text-[#748B7D]'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span
                      className={
                        totals.qualifiesDiscount ? 'text-[#1F3528] font-medium' : 'text-[#6A8073]'
                      }
                    >
                      Descuento del {settings.porcentajeDescuento}% (subtotal ≥{' '}
                      <span className="font-mono-num">
                        {formatSoles(settings.montoMinimoDescuentoSoles)}
                      </span>
                      )
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        stockValid && cartItems.length > 0
                          ? 'bg-[#6CE138] text-white'
                          : 'bg-[#E5ECE7] text-[#748B7D]'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span
                      className={
                        stockValid && cartItems.length > 0
                          ? 'text-[#1F3528] font-medium'
                          : 'text-[#6A8073]'
                      }
                    >
                      Stock validado correctamente ({cartItems.length} ítems)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Matching Screenshot */}
              <div className="flex items-center justify-between gap-3">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleCancelWizard}
                    className="flex-1 rounded-full bg-white border border-[#D4E2D8] px-5 py-3 text-sm font-semibold text-[#2E4638] hover:bg-[#F2F7F3] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-white border border-[#D4E2D8] px-5 py-3 text-sm font-semibold text-[#2E4638] hover:bg-[#F2F7F3] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#87F241] to-[#36BC47] px-5 py-3 text-sm font-bold text-[#072817] shadow-[0_6px_18px_rgba(54,188,71,0.3)] hover:brightness-105 transition-all cursor-pointer"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={cartItems.length === 0 || !totals.meetsMinimum || !stockValid}
                    onClick={handleConfirm}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#87F241] to-[#36BC47] px-5 py-3 text-sm font-bold text-[#072817] shadow-[0_6px_18px_rgba(54,188,71,0.3)] hover:brightness-105 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    Confirmar Pedido
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
