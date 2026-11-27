import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  Download,
  FileText,
  MapPin,
  Plus,
  RotateCcw,
  Truck,
  UserPlus,
  X,
} from 'lucide-react';
import { formatKg, formatSoles } from '../data/seedData';
import type {
  Client,
  ClientType,
  CompanySettings,
  Dispatch,
  InventoryMovement,
  MovementType,
  Order,
  OrderStatus,
  Product,
  Sale,
  UserAccount,
  UserRole,
} from '../types/erp';

/* =========================================================================
 * 1. INVENTARIO
 * ========================================================================= */
export const InventoryView: React.FC<{
  products: Product[];
  movements: InventoryMovement[];
  settings: CompanySettings;
  userRole: UserRole;
  searchQuery: string;
  onRegisterMovement: (payload: {
    productoId: number;
    tipo: MovementType;
    cantidadKg: number;
    motivo: string;
    referencia: string;
  }) => void;
}> = ({ products, movements, settings, searchQuery, onRegisterMovement }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'critical'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 1);
  const [movTipo, setMovTipo] = useState<MovementType>('ENTRADA');
  const [movCantidad, setMovCantidad] = useState('100');
  const [movMotivo, setMovMotivo] = useState('Ingreso lote de cosecha');
  const [movRef, setMovRef] = useState('GR-001-4510');
  const [formErr, setFormErr] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (filterMode === 'critical' && p.stockKg > settings.umbralStockCriticoKg) return false;
      if (q && !p.nombre.toLowerCase().includes(q) && !p.codigo.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [products, filterMode, settings.umbralStockCriticoKg, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    const qty = Number(movCantidad);
    if (Number.isNaN(qty) || qty <= 0) {
      setFormErr('La cantidad en kg debe ser mayor a 0.');
      return;
    }
    const targetProd = products.find((p) => p.id === selectedProductId);
    if (movTipo === 'SALIDA' && targetProd && qty > targetProd.stockKg) {
      setFormErr(`Stock insuficiente. Disponible: ${formatKg(targetProd.stockKg)}.`);
      return;
    }
    onRegisterMovement({
      productoId: selectedProductId,
      tipo: movTipo,
      cantidadKg: qty,
      motivo: movMotivo.trim() || 'Ajuste operativo de almacén',
      referencia: movRef.trim() || 'MOV-INT',
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
            Control de Inventario
          </h1>
          <p className="text-sm text-[#587162] mt-0.5">
            Existencias por kilogramo y trazabilidad de ingresos y salidas
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormErr('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5ED938] to-[#24A446] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105 cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <ArrowDownUp className="w-4 h-4" />
          Registrar Movimiento
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            filterMode === 'all'
              ? 'bg-[#0F4A2B] text-white'
              : 'bg-white border border-[#DCE8E0] text-[#496253]'
          }`}
        >
          Todos los productos ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('critical')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            filterMode === 'critical'
              ? 'bg-[#C82333] text-white'
              : 'bg-white border border-[#DCE8E0] text-[#C82333]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Stock Crítico (≤ {settings.umbralStockCriticoKg} kg)
        </button>
      </div>

      {/* Stock Table */}
      <div className="rounded-2xl bg-white border border-[#E2ECE5] overflow-hidden shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F6FAF7] border-b border-[#E4EDE6] text-xs text-[#546B5D]">
              <tr>
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Producto</th>
                <th className="py-3 px-4 font-semibold">Categoría · Origen</th>
                <th className="py-3 px-4 font-semibold text-right">Stock Actual</th>
                <th className="py-3 px-4 font-semibold text-right">Valorizado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF4F0]">
              {filteredProducts.map((p) => {
                const isCrit = p.stockKg <= settings.umbralStockCriticoKg;
                return (
                  <tr key={p.id} className="hover:bg-[#F9FCFA]">
                    <td className="py-3 px-4 font-mono-num text-xs font-semibold text-[#546B5D]">
                      {p.codigo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#12261B]">{p.nombre}</td>
                    <td className="py-3 px-4 text-xs text-[#546B5D]">
                      {p.categoriaNombre} · {p.origen}
                    </td>
                    <td
                      className={`py-3 px-4 font-mono-num text-xs font-bold text-right ${
                        isCrit ? 'text-[#C82333]' : 'text-[#12261B]'
                      }`}
                    >
                      {formatKg(p.stockKg)}
                      {isCrit && ' · Crítico'}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-xs text-[#496253] text-right">
                      {formatSoles(p.stockKg * p.precioKg)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setMovTipo('ENTRADA');
                          setModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#EAF8EE] text-[#177A3B] text-xs font-semibold hover:bg-[#D5F2DD] cursor-pointer"
                      >
                        + Reponer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Movements History */}
      <div className="rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
        <h2 className="font-display text-base font-bold text-[#12261B] mb-4">
          Historial de Movimientos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#EBF2ED] text-xs text-[#61786A]">
              <tr>
                <th className="pb-2.5 font-semibold">Fecha</th>
                <th className="pb-2.5 font-semibold">Tipo</th>
                <th className="pb-2.5 font-semibold">Producto</th>
                <th className="pb-2.5 font-semibold text-right">Cantidad</th>
                <th className="pb-2.5 font-semibold text-right">Stock Nuevo</th>
                <th className="pb-2.5 font-semibold">Motivo / Ref.</th>
                <th className="pb-2.5 font-semibold">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F6F3]">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-[#F9FCFA]">
                  <td className="py-2.5 font-mono-num text-xs text-[#546B5D] whitespace-nowrap">
                    {m.fecha}
                  </td>
                  <td className="py-2.5 text-xs font-bold whitespace-nowrap">
                    <span
                      className={
                        m.tipo === 'ENTRADA'
                          ? 'text-[#1D8E3F]'
                          : m.tipo === 'SALIDA'
                            ? 'text-[#C82333]'
                            : 'text-[#D97706]'
                      }
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs font-semibold text-[#12261B]">
                    {m.productoNombre}
                  </td>
                  <td className="py-2.5 font-mono-num text-xs font-semibold text-right">
                    {formatKg(m.cantidadKg)}
                  </td>
                  <td className="py-2.5 font-mono-num text-xs text-[#12261B] text-right">
                    {formatKg(m.stockNuevo)}
                  </td>
                  <td className="py-2.5 text-xs text-[#546B5D]">
                    {m.motivo} · <span className="font-mono-num">{m.referencia}</span>
                  </td>
                  <td className="py-2.5 text-xs text-[#496253]">{m.usuarioNombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#062113]/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#DCE8E0] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBF2ED]">
              <h2 className="font-display text-lg font-bold text-[#12261B]">
                Registrar Movimiento
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#587162] hover:bg-[#F2F7F3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Producto
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2.5 text-sm focus:border-[#28A845] focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({formatKg(p.stockKg)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Tipo
                  </label>
                  <select
                    value={movTipo}
                    onChange={(e) => setMovTipo(e.target.value as MovementType)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2.5 text-sm focus:border-[#28A845] focus:outline-none"
                  >
                    <option value="ENTRADA">ENTRADA</option>
                    <option value="SALIDA">SALIDA</option>
                    <option value="AJUSTE">AJUSTE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Cantidad (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={movCantidad}
                    onChange={(e) => setMovCantidad(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2.5 text-sm font-mono-num focus:border-[#28A845] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  value={movMotivo}
                  onChange={(e) => setMovMotivo(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2.5 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Guía / Referencia
                </label>
                <input
                  type="text"
                  value={movRef}
                  onChange={(e) => setMovRef(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2.5 text-sm font-mono-num focus:border-[#28A845] focus:outline-none"
                />
              </div>
              {formErr && <p className="text-xs font-medium text-[#C82333]">{formErr}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E0] text-sm font-semibold text-[#314A3B] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5ED938] to-[#24A446] text-sm font-bold text-white cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
 * 2. CLIENTES
 * ========================================================================= */
export const ClientsView: React.FC<{
  clients: Client[];
  searchQuery: string;
  onSaveClient: (client: Omit<Client, 'id'> & { id?: number }) => void;
}> = ({ clients, searchQuery, onSaveClient }) => {
  const [typeFilter, setTypeFilter] = useState<string>('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [tipo, setTipo] = useState<ClientType>('Restaurantes');
  const [distrito, setDistrito] = useState('Miraflores');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [err, setErr] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clients.filter((c) => {
      if (typeFilter !== 'Todos' && c.tipo !== typeFilter) return false;
      if (
        q &&
        !c.razonSocial.toLowerCase().includes(q) &&
        !c.ruc.includes(q) &&
        !c.distrito.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [clients, typeFilter, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!/^\d{8,11}$/.test(ruc.trim()) || razonSocial.trim().length < 3) {
      setErr('Ingresa un RUC válido (8-11 dígitos) y Razón Social.');
      return;
    }
    onSaveClient({
      ruc: ruc.trim(),
      razonSocial: razonSocial.trim(),
      nombreComercial: razonSocial.trim(),
      tipo,
      distrito: distrito.trim() || 'Lima',
      direccion: direccion.trim() || `${distrito}, Lima`,
      telefono: telefono.trim() || '+51 999 000 111',
      correo: correo.trim() || 'compras@cliente.pe',
      estado: 'Activo',
    });
    setModalOpen(false);
    setRuc('');
    setRazonSocial('');
    setDireccion('');
    setTelefono('');
    setCorreo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
            Cartera de Clientes B2B
          </h1>
          <p className="text-sm text-[#587162] mt-0.5">
            Restaurantes, hoteles, bodegas y minimarkets en Lima Metropolitana
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5ED938] to-[#24A446] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105 cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['Todos', 'Restaurantes', 'Hoteles', 'Bodegas', 'Minimarkets'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              typeFilter === t
                ? 'bg-[#0F4A2B] text-white'
                : 'bg-white border border-[#DCE8E0] text-[#496253] hover:bg-[#F2F7F3]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)] space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-[#1E7A3E]">
                  {c.tipo} · {c.distrito}
                </div>
                <h2 className="font-display text-base font-bold text-[#12261B] mt-0.5">
                  {c.razonSocial}
                </h2>
              </div>
              <span className="font-mono-num text-xs text-[#546B5D] shrink-0">
                {c.ruc}
              </span>
            </div>
            <p className="text-xs text-[#546B5D]">{c.direccion}</p>
            <div className="pt-2 border-t border-[#EFF4F0] flex items-center justify-between text-xs text-[#496253]">
              <span className="font-mono-num">{c.telefono}</span>
              <span className="truncate max-w-[160px]">{c.correo}</span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#062113]/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE8E0] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBF2ED]">
              <h2 className="font-display text-lg font-bold text-[#12261B]">
                Registrar Cliente B2B
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#587162] hover:bg-[#F2F7F3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    RUC / DNI *
                  </label>
                  <input
                    type="text"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    placeholder="20601234567"
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm font-mono-num focus:border-[#28A845] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Segmento
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as ClientType)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  >
                    <option value="Restaurantes">Restaurantes</option>
                    <option value="Hoteles">Hoteles</option>
                    <option value="Bodegas">Bodegas</option>
                    <option value="Minimarkets">Minimarkets</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Razón Social *
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Distrito Lima
                  </label>
                  <input
                    type="text"
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm font-mono-num focus:border-[#28A845] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Dirección de entrega
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>
              {err && <p className="text-xs font-medium text-[#C82333]">{err}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E0] text-sm font-semibold text-[#314A3B] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5ED938] to-[#24A446] text-sm font-bold text-white cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
 * 3. VENTAS
 * ========================================================================= */
export const SalesView: React.FC<{
  sales: Sale[];
  userRole: UserRole;
  searchQuery: string;
  onToggleVoidSale: (saleId: number) => void;
}> = ({ sales, userRole, searchQuery, onToggleVoidSale }) => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sales.filter((s) => {
      if (!q) return true;
      return (
        s.numeroVenta.toLowerCase().includes(q) ||
        s.clienteNombre.toLowerCase().includes(q) ||
        s.numeroPedido.toLowerCase().includes(q)
      );
    });
  }, [sales, searchQuery]);

  const totalNeto = useMemo(
    () =>
      filtered
        .filter((s) => s.estado === 'Registrada')
        .reduce((acc, s) => acc + s.total, 0),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
            Registro de Ventas
          </h1>
          <p className="text-sm text-[#587162] mt-0.5">
            Comprobantes emitidos automáticamente desde pedidos confirmados
          </p>
        </div>

        <div className="rounded-xl bg-white border border-[#DCE8E0] px-4 py-2.5 text-right">
          <div className="text-[11px] text-[#5B7264]">Total facturado vigente</div>
          <div className="font-mono-num text-base font-bold text-[#157A39]">
            {formatSoles(totalNeto)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#E2ECE5] overflow-hidden shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F6FAF7] border-b border-[#E4EDE6] text-xs text-[#546B5D]">
              <tr>
                <th className="py-3 px-4 font-semibold">Comprobante</th>
                <th className="py-3 px-4 font-semibold">Pedido</th>
                <th className="py-3 px-4 font-semibold">Cliente</th>
                <th className="py-3 px-4 font-semibold">Fecha</th>
                <th className="py-3 px-4 font-semibold text-right">Total</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF4F0]">
              {filtered.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#F9FCFA]">
                  <td className="py-3.5 px-4 font-mono-num text-xs font-bold text-[#12261B] whitespace-nowrap">
                    {sale.numeroVenta}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs text-[#546B5D] whitespace-nowrap">
                    {sale.numeroPedido}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#12261B]">{sale.clienteNombre}</div>
                    <div className="text-xs text-[#61786A] truncate max-w-[260px]">
                      {sale.productosResumen}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs text-[#546B5D] whitespace-nowrap">
                    {sale.fecha}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs font-bold text-[#12261B] text-right whitespace-nowrap">
                    {formatSoles(sale.total)}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                    <span
                      className={
                        sale.estado === 'Registrada'
                          ? 'text-[#1D8E3F]'
                          : 'text-[#C82333]'
                      }
                    >
                      {sale.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EAF8EE] text-[#177A3B] text-xs font-semibold hover:bg-[#D5F2DD] cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver detalle
                    </button>
                    {userRole === 'ADMIN' && sale.estado === 'Registrada' && (
                      <button
                        type="button"
                        onClick={() => onToggleVoidSale(sale.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#F1C5C9] text-[#C82333] text-xs font-semibold hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#062113]/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#DCE8E0] shadow-2xl overflow-hidden">
            <div className="bg-[#0B3B22] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#9EE870]">Comprobante de Venta</div>
                <div className="font-mono-num text-lg font-bold">
                  {selectedSale.numeroVenta}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-[#5B7264]">Cliente</div>
                <div className="font-bold text-[#12261B]">{selectedSale.clienteNombre}</div>
                <div className="font-mono-num text-xs text-[#5B7264]">
                  RUC {selectedSale.clienteRuc}
                </div>
              </div>
              <div className="rounded-xl bg-[#F6FAF7] border border-[#E2ECE5] p-3.5 text-xs text-[#314A3B]">
                {selectedSale.productosResumen}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-[#EFF4F0] text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5B7264]">Subtotal</span>
                  <span className="font-mono-num">{formatSoles(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7264]">Descuento</span>
                  <span className="font-mono-num text-[#1E7A3E]">
                    -{formatSoles(selectedSale.descuento)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-[#EFF4F0]">
                  <span>Total</span>
                  <span className="font-mono-num text-[#12261B]">
                    {formatSoles(selectedSale.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
 * 4. LOGÍSTICA
 * ========================================================================= */
export const LogisticsView: React.FC<{
  dispatches: Dispatch[];
  onAdvanceDispatchStatus: (dispatchId: number, nextStatus: OrderStatus) => void;
}> = ({ dispatches, onAdvanceDispatchStatus }) => {
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(
    dispatches[0] || null
  );

  const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
    Pendiente: 'Confirmado',
    Confirmado: 'En preparación',
    'En preparación': 'Despachado',
    Despachado: 'Entregado',
  };

  const activeSelected =
    dispatches.find((d) => d.id === selectedDispatch?.id) || dispatches[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
          Logística y Despachos Lima
        </h1>
        <p className="text-sm text-[#587162] mt-0.5">
          Seguimiento de rutas refrigeradas, responsables y entregas en Lima Metropolitana
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-3">
          {dispatches.map((d) => {
            const nextSt = nextStatusMap[d.estadoLogistico];
            const isSelected = activeSelected?.id === d.id;

            return (
              <div
                key={d.id}
                onClick={() => setSelectedDispatch(d)}
                className={`rounded-2xl bg-white border p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#28A845] shadow-[0_6px_20px_rgba(36,164,70,0.08)]'
                    : 'border-[#E2ECE5] hover:border-[#B6D8C0]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono-num font-bold text-[#12261B]">
                        {d.numeroPedido}
                      </span>
                      <span className="text-[#B8CBBF]">·</span>
                      <span className="font-semibold text-[#1E7A3E]">
                        {d.estadoLogistico}
                      </span>
                    </div>
                    <h2 className="font-display text-base font-bold text-[#12261B] mt-1">
                      {d.clienteNombre}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-[#546B5D] mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#239B47] shrink-0" />
                      <span>{d.clienteDireccion}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono-num text-sm font-bold text-[#12261B]">
                      {formatSoles(d.totalPedido)}
                    </div>
                    <div className="font-mono-num text-xs text-[#61786A] mt-0.5">
                      {d.fechaProgramada}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EFF4F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#496253]">
                    <Truck className="w-3.5 h-3.5 text-[#239B47]" />
                    <span>
                      {d.vehiculo} · {d.responsableNombre}
                    </span>
                  </div>

                  {nextSt && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdvanceDispatchStatus(d.id, nextSt);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#EAF8EE] text-[#177A3B] font-bold hover:bg-[#D5F2DD] cursor-pointer"
                    >
                      Marcar {nextSt}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Panel */}
        {activeSelected && (
          <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E2ECE5] p-6 shadow-[0_2px_10px_rgba(14,54,32,0.03)] space-y-5">
            <div>
              <div className="text-xs font-semibold text-[#1E7A3E]">
                Trazabilidad de ruta · {activeSelected.zonaLima}
              </div>
              <h2 className="font-display text-lg font-bold text-[#12261B] mt-0.5">
                {activeSelected.numeroPedido}
              </h2>
              <p className="text-xs text-[#546B5D] mt-1">
                {activeSelected.observaciones}
              </p>
            </div>

            <div className="space-y-4 border-t border-[#EFF4F0] pt-4">
              {activeSelected.eventos.map((ev, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF8EE] text-[#1D8E3F]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#12261B]">{ev.estado}</span>
                      <span className="font-mono-num text-[#61786A]">{ev.fecha}</span>
                    </div>
                    <p className="text-xs text-[#546B5D] mt-0.5">{ev.nota}</p>
                    <div className="text-[11px] text-[#748B7D] mt-0.5">
                      Responsable: {ev.responsable}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
 * 5. REPORTES
 * ========================================================================= */
export const ReportsView: React.FC<{
  products: Product[];
  orders: Order[];
  sales: Sale[];
}> = ({ products, orders, sales }) => {
  const byOrigin = useMemo(() => {
    const map: Record<string, { count: number; stockKg: number; val: number }> = {
      Costa: { count: 0, stockKg: 0, val: 0 },
      Sierra: { count: 0, stockKg: 0, val: 0 },
      Selva: { count: 0, stockKg: 0, val: 0 },
    };
    products.forEach((p) => {
      if (!map[p.origen]) return;
      map[p.origen].count += 1;
      map[p.origen].stockKg += p.stockKg;
      map[p.origen].val += p.stockKg * p.precioKg;
    });
    return Object.entries(map);
  }, [products]);

  const handleExportCsv = () => {
    const headers = ['Comprobante', 'Pedido', 'Cliente', 'Fecha', 'Subtotal', 'Descuento', 'Total', 'Estado'];
    const rows = sales.map((s) => [
      s.numeroVenta,
      s.numeroPedido,
      `"${s.clienteNombre}"`,
      s.fecha,
      s.subtotal.toFixed(2),
      s.descuento.toFixed(2),
      s.total.toFixed(2),
      s.estado,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'andes-fresh-reporte-ventas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
            Reportes Gerenciales
          </h1>
          <p className="text-sm text-[#587162] mt-0.5">
            Valorización de inventario por región de origen y exportación de ventas
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5ED938] to-[#24A446] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105 cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Exportar Ventas CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {byOrigin.map(([region, stats]) => (
          <div
            key={region}
            className="rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)] space-y-2"
          >
            <div className="text-xs font-semibold text-[#1E7A3E]">Región {region}</div>
            <div className="font-mono-num text-2xl font-bold text-[#12261B]">
              {formatSoles(stats.val)}
            </div>
            <div className="text-xs text-[#546B5D] font-mono-num">
              {stats.count} productos · {formatKg(stats.stockKg)} en almacén
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-[#E2ECE5] p-6 shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
        <h2 className="font-display text-base font-bold text-[#12261B] mb-4">
          Resumen Comercial de Pedidos ({orders.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#EBF2ED] text-xs text-[#61786A]">
              <tr>
                <th className="pb-2.5 font-semibold">Pedido</th>
                <th className="pb-2.5 font-semibold">Cliente</th>
                <th className="pb-2.5 font-semibold">Vendedor</th>
                <th className="pb-2.5 font-semibold text-right">Kg Totales</th>
                <th className="pb-2.5 font-semibold text-right">Total Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F6F3]">
              {orders.map((o) => {
                const kgSum = o.items.reduce((acc, it) => acc + it.cantidadKg, 0);
                return (
                  <tr key={o.id}>
                    <td className="py-3 font-mono-num text-xs font-bold text-[#12261B]">
                      {o.numeroPedido}
                    </td>
                    <td className="py-3 text-xs font-medium text-[#263B2E]">
                      {o.clienteNombre}
                    </td>
                    <td className="py-3 text-xs text-[#546B5D]">{o.vendedorNombre}</td>
                    <td className="py-3 font-mono-num text-xs text-right">
                      {formatKg(kgSum)}
                    </td>
                    <td className="py-3 font-mono-num text-xs font-bold text-[#12261B] text-right">
                      {formatSoles(o.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
 * 6. USUARIOS
 * ========================================================================= */
export const UsersView: React.FC<{
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (payload: {
    nombreCompleto: string;
    email: string;
    rol: UserRole;
    cargo: string;
  }) => void;
  onToggleActive: (userId: string) => void;
}> = ({ users, currentUser, onAddUser, onToggleActive }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Ejecutivo Comercial B2B');
  const [rol, setRol] = useState<UserRole>('VENDEDOR');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    onAddUser({
      nombreCompleto: nombre.trim(),
      email: email.trim(),
      rol,
      cargo: cargo.trim() || 'Colaborador',
    });
    setModalOpen(false);
    setNombre('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
            Equipo y Usuarios
          </h1>
          <p className="text-sm text-[#587162] mt-0.5">
            Administradores y vendedores habilitados en Andes Fresh ERP
          </p>
        </div>

        {currentUser.rol === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5ED938] to-[#24A446] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105 cursor-pointer self-start sm:self-auto whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-[#E2ECE5] overflow-hidden shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F6FAF7] border-b border-[#E4EDE6] text-xs text-[#546B5D]">
              <tr>
                <th className="py-3 px-4 font-semibold">Colaborador</th>
                <th className="py-3 px-4 font-semibold">Correo</th>
                <th className="py-3 px-4 font-semibold">Cargo</th>
                <th className="py-3 px-4 font-semibold">Rol</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF4F0]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F9FCFA]">
                  <td className="py-3.5 px-4 font-semibold text-[#12261B]">
                    {u.nombreCompleto}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#546B5D]">{u.email}</td>
                  <td className="py-3.5 px-4 text-xs text-[#496253]">{u.cargo}</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-[#1E7A3E]">
                    {u.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold">
                    <span className={u.activo ? 'text-[#1D8E3F]' : 'text-[#C82333]'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {currentUser.rol === 'ADMIN' && u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => onToggleActive(u.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#DCE8E0] text-xs font-semibold text-[#314A3B] hover:bg-[#F2F7F3] cursor-pointer"
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#062113]/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#DCE8E0] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBF2ED]">
              <h2 className="font-display text-lg font-bold text-[#12261B]">
                Agregar Colaborador
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#587162] hover:bg-[#F2F7F3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Correo *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Rol
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E0] text-sm font-semibold text-[#314A3B] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5ED938] to-[#24A446] text-sm font-bold text-white cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
 * 7. CONFIGURACIÓN
 * ========================================================================= */
export const SettingsView: React.FC<{
  settings: CompanySettings;
  userRole: UserRole;
  onSaveSettings: (next: CompanySettings) => void;
  onResetDemo: () => void;
}> = ({ settings, userRole, onSaveSettings, onResetDemo }) => {
  const [draft, setDraft] = useState<CompanySettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(draft);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-[#587162] mt-0.5">
          Parámetros corporativos y reglas comerciales aplicadas automáticamente en pedidos e inventario
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white border border-[#E2ECE5] p-6 shadow-[0_2px_10px_rgba(14,54,32,0.03)] space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#314A3B] mb-1">
              Razón Social
            </label>
            <input
              type="text"
              disabled={userRole !== 'ADMIN'}
              value={draft.razonSocial}
              onChange={(e) => setDraft({ ...draft, razonSocial: e.target.value })}
              className="w-full rounded-xl border border-[#D4E2D8] px-3.5 py-2.5 text-sm disabled:bg-[#F5F8F6] focus:border-[#28A845] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#314A3B] mb-1">
              Ciudad / Operación
            </label>
            <input
              type="text"
              disabled={userRole !== 'ADMIN'}
              value={draft.ciudad}
              onChange={(e) => setDraft({ ...draft, ciudad: e.target.value })}
              className="w-full rounded-xl border border-[#D4E2D8] px-3.5 py-2.5 text-sm disabled:bg-[#F5F8F6] focus:border-[#28A845] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#314A3B] mb-1">
              Pedido Mínimo (S/)
            </label>
            <input
              type="number"
              min="0"
              disabled={userRole !== 'ADMIN'}
              value={draft.pedidoMinimoSoles}
              onChange={(e) =>
                setDraft({ ...draft, pedidoMinimoSoles: Number(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-[#D4E2D8] px-3.5 py-2.5 text-sm font-mono-num disabled:bg-[#F5F8F6] focus:border-[#28A845] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#314A3B] mb-1">
              Umbral Stock Crítico (kg)
            </label>
            <input
              type="number"
              min="0"
              disabled={userRole !== 'ADMIN'}
              value={draft.umbralStockCriticoKg}
              onChange={(e) =>
                setDraft({ ...draft, umbralStockCriticoKg: Number(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-[#D4E2D8] px-3.5 py-2.5 text-sm font-mono-num disabled:bg-[#F5F8F6] focus:border-[#28A845] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#314A3B] mb-1">
              Descuento Mayorista (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              disabled={userRole !== 'ADMIN'}
              value={draft.porcentajeDescuento}
              onChange={(e) =>
                setDraft({ ...draft, porcentajeDescuento: Number(e.target.value) || 0 })
              }
              className="w-full rounded-xl border border-[#D4E2D8] px-3.5 py-2.5 text-sm font-mono-num disabled:bg-[#F5F8F6] focus:border-[#28A845] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#314A3B] mb-1">
              Monto Mínimo Descuento (S/)
            </label>
            <input
              type="number"
              min="0"
              disabled={userRole !== 'ADMIN'}
              value={draft.montoMinimoDescuentoSoles}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  montoMinimoDescuentoSoles: Number(e.target.value) || 0,
                })
              }
              className="w-full rounded-xl border border-[#D4E2D8] px-3.5 py-2.5 text-sm font-mono-num disabled:bg-[#F5F8F6] focus:border-[#28A845] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#EFF4F0] flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D4E2D8] px-4 py-2.5 text-xs font-semibold text-[#314A3B] hover:bg-[#F2F7F3] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar datos demo iniciales
          </button>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs font-semibold text-[#1D8E3F]">
                Parámetros guardados
              </span>
            )}
            {userRole === 'ADMIN' && (
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-[#5ED938] to-[#24A446] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105 cursor-pointer"
              >
                Guardar Cambios
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
