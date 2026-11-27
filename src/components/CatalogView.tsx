import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  LayoutGrid,
  List,
  Plus,
  ShoppingCart,
  X,
} from 'lucide-react';
import {
  PRODUCT_IMAGES,
  formatKg,
  formatSoles,
} from '../data/seedData';
import type {
  ActiveStatus,
  Category,
  CompanySettings,
  OriginRegion,
  Product,
  UserRole,
} from '../types/erp';

interface CatalogViewProps {
  products: Product[];
  categories: Category[];
  settings: CompanySettings;
  userRole: UserRole;
  searchQuery: string;
  orderCartCount: number;
  onAddToOrder: (product: Product) => void;
  onGoToOrder: () => void;
  onSaveProduct: (product: Omit<Product, 'id' | 'fechaRegistro'> & { id?: number }) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  categories,
  settings,
  userRole,
  searchQuery,
  orderCartCount,
  onAddToOrder,
  onGoToOrder,
  onSaveProduct,
}) => {
  const [catFilter, setCatFilter] = useState<string>('Todas');
  const [originFilter, setOriginFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Activo');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);

  // Modal state for creating/editing product
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState<number>(1);
  const [formPrecio, setFormPrecio] = useState('4.50');
  const [formStock, setFormStock] = useState('350');
  const [formOrigen, setFormOrigen] = useState<OriginRegion>('Costa');
  const [formEstado, setFormEstado] = useState<ActiveStatus>('Activo');
  const [formImage, setFormImage] = useState(PRODUCT_IMAGES.palta);
  const [formError, setFormError] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'Todas' && p.categoriaNombre !== catFilter) return false;
      if (originFilter !== 'Todos' && p.origen !== originFilter) return false;
      if (statusFilter !== 'Todos' && p.estado !== statusFilter) return false;
      if (
        q &&
        !p.nombre.toLowerCase().includes(q) &&
        !p.codigo.toLowerCase().includes(q) &&
        !p.categoriaNombre.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [products, catFilter, originFilter, statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingId(undefined);
    setFormCodigo(`PRD-0${products.length + 1}`);
    setFormNombre('');
    setFormDescripcion('');
    setFormCategoriaId(categories[0]?.id || 1);
    setFormPrecio('5.00');
    setFormStock('300');
    setFormOrigen('Costa');
    setFormEstado('Activo');
    setFormImage(PRODUCT_IMAGES.palta);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingId(prod.id);
    setFormCodigo(prod.codigo);
    setFormNombre(prod.nombre);
    setFormDescripcion(prod.descripcion);
    setFormCategoriaId(prod.categoriaId);
    setFormPrecio(String(prod.precioKg));
    setFormStock(String(prod.stockKg));
    setFormOrigen(prod.origen);
    setFormEstado(prod.estado);
    setFormImage(prod.imagenUrl);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const precio = Number(formPrecio);
    const stock = Number(formStock);
    if (!formCodigo.trim() || !formNombre.trim()) {
      setFormError('Código y nombre son obligatorios.');
      return;
    }
    if (Number.isNaN(precio) || precio <= 0) {
      setFormError('El precio por kg debe ser mayor a 0.');
      return;
    }
    if (Number.isNaN(stock) || stock < 0) {
      setFormError('El stock no puede ser negativo.');
      return;
    }

    const cat = categories.find((c) => c.id === formCategoriaId) || categories[0];

    onSaveProduct({
      id: editingId,
      codigo: formCodigo.trim().toUpperCase(),
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || 'Producto fresco seleccionado para distribución B2B.',
      categoriaId: cat.id,
      categoriaNombre: cat.nombre,
      precioKg: Number(precio.toFixed(2)),
      stockKg: Number(stock.toFixed(2)),
      unidad: 'kg',
      origen: formOrigen,
      estado: formEstado,
      imagenUrl: formImage,
      ultimoMovimiento: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(false);
  };

  const handleQuickAdd = (prod: Product) => {
    onAddToOrder(prod);
    setRecentlyAddedId(prod.id);
    window.setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === prod.id ? null : curr));
    }, 1100);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
            Catálogo de Productos
          </h1>
          <p className="text-sm text-[#587162] mt-0.5">
            Gestión de productos de distribución
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {orderCartCount > 0 && (
            <button
              type="button"
              onClick={onGoToOrder}
              className="inline-flex items-center gap-2 rounded-xl border border-[#BFE2CA] bg-white px-4 py-2.5 text-xs font-bold text-[#14592F] hover:bg-[#F2F9F4] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingCart className="w-4 h-4 text-[#249E44]" />
              Ir al Pedido ({orderCartCount})
            </button>
          )}
          {userRole === 'ADMIN' && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5ED938] to-[#24A446] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(36,164,70,0.28)] hover:brightness-105 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#DCE8E0] px-3.5 py-2 text-xs">
            <span className="text-[#5B7264]">Categoría:</span>
            <select
              aria-label="Filtrar por categoría"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="font-semibold text-[#12261B] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Todas">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#DCE8E0] px-3.5 py-2 text-xs">
            <span className="text-[#5B7264]">Origen:</span>
            <select
              aria-label="Filtrar por origen"
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="font-semibold text-[#12261B] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Costa">Costa</option>
              <option value="Sierra">Sierra</option>
              <option value="Selva">Selva</option>
            </select>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#DCE8E0] px-3.5 py-2 text-xs">
            <span className="text-[#5B7264]">Estado:</span>
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="font-semibold text-[#12261B] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
              <option value="Todos">Todos</option>
            </select>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#DCE8E0]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Vista cuadrícula"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#0F4A2B] text-white'
                : 'text-[#5B7264] hover:text-[#12261B]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Vista tabla"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[#0F4A2B] text-white'
                : 'text-[#5B7264] hover:text-[#12261B]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Grid or Table */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#E2ECE5] p-12 text-center">
          <p className="font-display text-base font-bold text-[#12261B]">
            No se encontraron productos
          </p>
          <p className="text-sm text-[#587162] mt-1">
            Ajusta los filtros de categoría, origen o búsqueda.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const isCritical = product.stockKg <= settings.umbralStockCriticoKg;
            const justAdded = recentlyAddedId === product.id;

            return (
              <article
                key={product.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#E2ECE5] p-4 shadow-[0_2px_10px_rgba(14,54,32,0.03)] hover:shadow-[0_10px_24px_rgba(14,54,32,0.08)] transition-all"
              >
                {userRole === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(product)}
                    aria-label={`Editar ${product.nombre}`}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 border border-[#DCE8E0] text-[#455F50] opacity-0 group-hover:opacity-100 hover:text-[#0F4A2B] transition-opacity cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-white flex items-center justify-center p-2">
                    <img
                      src={product.imagenUrl}
                      alt={product.nombre}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1D7E3F]">
                      <span>{product.categoriaNombre}</span>
                      <span aria-hidden="true" className="text-[#C2D4C8]">·</span>
                      <span className="font-normal text-[#61786A]">{product.origen}</span>
                    </div>
                    <h2 className="font-display text-base font-bold text-[#12261B] mt-0.5 truncate">
                      {product.nombre}
                    </h2>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-[#EFF4F0] flex items-end justify-between gap-2">
                  <div>
                    <div className="font-mono-num text-sm font-bold text-[#12261B]">
                      {formatSoles(product.precioKg)}{' '}
                      <span className="font-sans text-xs font-normal text-[#5E7467]">
                        / {product.unidad}
                      </span>
                    </div>
                    <div
                      className={`font-mono-num text-xs mt-0.5 ${
                        isCritical ? 'font-semibold text-[#C82333]' : 'text-[#5E7467]'
                      }`}
                    >
                      Stock: {formatKg(product.stockKg)}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={product.stockKg <= 0 || product.estado !== 'Activo'}
                    onClick={() => handleQuickAdd(product)}
                    aria-label={`Agregar ${product.nombre} al pedido`}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                      justAdded
                        ? 'bg-[#0F4A2B]'
                        : 'bg-gradient-to-br from-[#64DC39] to-[#28A845] hover:brightness-105'
                    }`}
                  >
                    {justAdded ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#E2ECE5] overflow-hidden shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6FAF7] border-b border-[#E4EDE6] text-xs text-[#546B5D]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Código</th>
                  <th className="py-3 px-4 font-semibold">Producto</th>
                  <th className="py-3 px-4 font-semibold">Categoría</th>
                  <th className="py-3 px-4 font-semibold">Origen</th>
                  <th className="py-3 px-4 font-semibold text-right">Precio / kg</th>
                  <th className="py-3 px-4 font-semibold text-right">Stock</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF4F0]">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#F9FCFA]">
                    <td className="py-3 px-4 font-mono-num text-xs font-semibold text-[#546B5D]">
                      {prod.codigo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imagenUrl}
                          alt={prod.nombre}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-contain border border-[#E8F0EA] bg-white shrink-0"
                        />
                        <span className="font-semibold text-[#12261B]">{prod.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#1E7A3E]">
                      {prod.categoriaNombre}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#546B5D]">{prod.origen}</td>
                    <td className="py-3 px-4 font-mono-num text-xs font-bold text-[#12261B] text-right">
                      {formatSoles(prod.precioKg)}
                    </td>
                    <td
                      className={`py-3 px-4 font-mono-num text-xs font-semibold text-right ${
                        prod.stockKg <= settings.umbralStockCriticoKg
                          ? 'text-[#C82333]'
                          : 'text-[#12261B]'
                      }`}
                    >
                      {formatKg(prod.stockKg)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(prod)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#EAF8EE] text-[#146B33] text-xs font-semibold hover:bg-[#D7F2DF] cursor-pointer"
                        >
                          + Pedido
                        </button>
                        {userRole === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#DCE8E0] text-[#3C5647] text-xs font-semibold hover:bg-[#F2F7F3] cursor-pointer"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Product Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#062113]/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE8E0] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBF2ED]">
              <h2 className="font-display text-lg font-bold text-[#12261B]">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#587162] hover:bg-[#F2F7F3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm font-mono-num focus:border-[#28A845] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formCategoriaId}
                    onChange={(e) => setFormCategoriaId(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Mango Kent"
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Precio S/ / kg *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.1"
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm font-mono-num focus:border-[#28A845] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Stock Inicial (kg) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm font-mono-num focus:border-[#28A845] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Origen
                  </label>
                  <select
                    value={formOrigen}
                    onChange={(e) => setFormOrigen(e.target.value as OriginRegion)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  >
                    <option value="Costa">Costa</option>
                    <option value="Sierra">Sierra</option>
                    <option value="Selva">Selva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Imagen de referencia
                  </label>
                  <select
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  >
                    <option value={PRODUCT_IMAGES.palta}>Palta</option>
                    <option value={PRODUCT_IMAGES.platano}>Plátano</option>
                    <option value={PRODUCT_IMAGES.fresa}>Fresa</option>
                    <option value={PRODUCT_IMAGES.tomate}>Tomate</option>
                    <option value={PRODUCT_IMAGES.zanahoria}>Zanahoria</option>
                    <option value={PRODUCT_IMAGES.brocoli}>Brócoli</option>
                    <option value={PRODUCT_IMAGES.papa}>Papa</option>
                    <option value={PRODUCT_IMAGES.lechuga}>Lechuga</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                    Estado
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as ActiveStatus)}
                    className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#314A3B] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-[#D4E2D8] px-3 py-2 text-sm focus:border-[#28A845] focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-xs font-medium text-[#C82333]">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#DCE8E0] text-sm font-semibold text-[#314A3B] hover:bg-[#F2F7F3] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5ED938] to-[#24A446] text-sm font-bold text-white hover:brightness-105 cursor-pointer"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
