import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Leaf,
  MapPin,
  Phone,
  Play,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { HERO_WAREHOUSE_IMAGE, formatKg, formatSoles } from '../data/seedData';
import type { ClientType, CompanySettings, LeadInquiry, Product } from '../types/erp';

interface LandingPageProps {
  products: Product[];
  settings: CompanySettings;
  onOpenAuth: (intent?: 'login' | 'register' | 'order', preselectedProduct?: Product) => void;
  onSubmitLead: (lead: Omit<LeadInquiry, 'id' | 'fecha'>) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  products,
  settings,
  onOpenAuth,
  onSubmitLead,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [heroImgError, setHeroImgError] = useState(false);

  // Contact form state
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState<ClientType>('Restaurantes');
  const [mensaje, setMensaje] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => p.estado === 'Activo'),
    [products]
  );

  const featuredProducts = useMemo(() => {
    const filtered =
      selectedCategory === 'Todas'
        ? activeProducts
        : activeProducts.filter((p) => p.categoriaNombre === selectedCategory);
    return filtered.slice(0, 8);
  }, [activeProducts, selectedCategory]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!razonSocial.trim() || razonSocial.trim().length < 3) {
      setFormError('Ingresa la razón social o nombre de tu negocio.');
      return;
    }
    if (!/^\d{8,11}$/.test(ruc.trim())) {
      setFormError('Ingresa un RUC o DNI válido (8 a 11 dígitos).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }
    if (telefono.trim().length < 7) {
      setFormError('Ingresa un teléfono de contacto válido.');
      return;
    }

    onSubmitLead({
      razonSocial: razonSocial.trim(),
      ruc: ruc.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      tipoNegocio,
      mensaje: mensaje.trim() || 'Solicitud de lista de precios mayorista.',
    });

    setFormSubmitted(true);
    setRazonSocial('');
    setRuc('');
    setCorreo('');
    setTelefono('');
    setMensaje('');
  };

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-[#17281E]">
      {/* Dark Emerald Hero Wrapper */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#062416] via-[#0B3C23] to-[#176837] text-white">
        {/* Ambient radial emerald glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-0 h-[560px] w-[720px] rounded-full bg-[#3CD068]/20 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-[320px] w-[500px] rounded-full bg-[#7BE938]/10 blur-[100px]"
        />

        {/* Top Bar Contract: 3 zones separated by gap-8 */}
        <header className="relative z-20 mx-auto flex max-w-[1320px] items-center justify-between gap-8 px-6 py-5 lg:px-10">
          <a href="#inicio" className="whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7BE938] rounded-lg">
            <BrandLogo size="md" theme="dark" />
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-white/85"
          >
            <a
              href="#inicio"
              className="relative py-1 text-white whitespace-nowrap shrink-0 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#7BE938]"
            >
              Inicio
            </a>
            <a
              href="#productos"
              className="py-1 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Productos
            </a>
            <a
              href="#nosotros"
              className="py-1 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Nosotros
            </a>
            <a
              href="#servicios"
              className="py-1 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Servicios
            </a>
            <a
              href="#contacto"
              className="py-1 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Contacto
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#082B19] bg-gradient-to-r from-[#87F241] to-[#43C74A] hover:brightness-105 shadow-[0_6px_20px_rgba(123,233,56,0.28)] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Iniciar Sesión
            </button>
          </div>
        </header>

        {/* Hero Split Section */}
        <section
          id="inicio"
          className="relative z-10 mx-auto max-w-[1320px] px-6 pt-6 pb-10 lg:px-10 lg:pt-10 lg:pb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-8">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <h1
                className="font-display font-extrabold tracking-tight leading-[1.08] text-white"
                style={{ fontSize: 'clamp(2.25rem, 4.1vw, 3.65rem)', textWrap: 'balance' }}
              >
                Distribución de Frutas, Verduras y{' '}
                <span className="text-[#82EE3F]">Tubérculos</span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#D8EFE0]/90">
                Productos frescos y de calidad para restaurantes, bodegas y negocios de Lima.
                Abastecimiento mayorista directo del campo con control de inventario por kilogramo.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenAuth('order')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm sm:text-base font-bold text-[#072817] bg-gradient-to-r from-[#88F242] to-[#41C449] hover:brightness-105 shadow-[0_10px_28px_rgba(104,225,58,0.34)] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Realizar Pedido
                </button>
                <a
                  href="#nosotros"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm sm:text-base font-semibold text-white bg-white/10 border border-white/25 hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
                >
                  Conócenos
                  <Play className="w-3.5 h-3.5 fill-current" />
                </a>
              </div>
            </div>

            {/* Right Visual Showcase */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#0A3620]/60 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                {!heroImgError ? (
                  <img
                    src={HERO_WAREHOUSE_IMAGE}
                    alt="Centro de distribución Andes Fresh S.A.C. con cordillera de los Andes y flota de reparto"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full aspect-[16/10] object-cover object-center"
                  />
                ) : (
                  <div className="w-full aspect-[16/10] flex flex-col items-center justify-center bg-gradient-to-br from-[#0F492A] to-[#1D7A43] p-8 text-center">
                    <Truck className="w-12 h-12 text-[#82EE3F] mb-3" />
                    <p className="font-display font-bold text-lg text-white">
                      Centro de Distribución Andes Fresh S.A.C.
                    </p>
                    <p className="text-sm text-white/75 mt-1">Lima Metropolitana · Flota Refrigerada</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Glassmorphic Value Strip */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/12 backdrop-blur-md px-5 py-4 transition-colors hover:bg-white/16">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7BE938]/20 text-[#88F242]">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-white">Productos Frescos</h2>
                <p className="text-xs text-white/75 mt-0.5">Cosecha diaria Costa, Sierra y Selva</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/12 backdrop-blur-md px-5 py-4 transition-colors hover:bg-white/16">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7BE938]/20 text-[#88F242]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-white">Calidad Garantizada</h2>
                <p className="text-xs text-white/75 mt-0.5">Selección por calibre y frescura</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/12 backdrop-blur-md px-5 py-4 transition-colors hover:bg-white/16">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7BE938]/20 text-[#88F242]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-white">Entrega Segura</h2>
                <p className="text-xs text-white/75 mt-0.5">Rutas programadas en Lima</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/12 backdrop-blur-md px-5 py-4 transition-colors hover:bg-white/16">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7BE938]/20 text-[#88F242]">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-white">Atención Personalizada</h2>
                <p className="text-xs text-white/75 mt-0.5">Ejecutivo comercial dedicado</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Section 01: Catálogo Mayorista de Temporada */}
      <section id="productos" className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-semibold text-[#1B7A3E]">01. Catálogo Mayorista</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#12261B] mt-1">
              Abastecimiento diario por kilogramo
            </h2>
            <p className="text-sm text-[#4B6355] mt-1.5 max-w-2xl">
              Precios transparentes para tu cocina o punto de venta. Selecciona cualquier producto para iniciar tu pedido.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filtrar catálogo por categoría"
            className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-[#DDE8E0]"
          >
            {['Todas', 'Frutas', 'Verduras', 'Tubérculos', 'Hortalizas'].map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#0F4A2B] text-white'
                    : 'text-[#4B6355] hover:text-[#12261B] hover:bg-[#F2F7F3]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col justify-between rounded-2xl bg-white border border-[#E1EBE3] p-4 shadow-[0_2px_10px_rgba(14,54,32,0.04)] hover:shadow-[0_12px_28px_rgba(14,54,32,0.08)] transition-all"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white flex items-center justify-center p-2">
                  <img
                    src={product.imagenUrl}
                    alt={product.nombre}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#2A7B46]">
                    <span>{product.categoriaNombre}</span>
                    <span aria-hidden="true" className="text-[#B8CBBF]">·</span>
                    <span className="text-[#5E7467]">{product.origen}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#12261B] mt-1">
                    {product.nombre}
                  </h3>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EFF4F0] flex items-end justify-between gap-3">
                <div>
                  <div className="font-mono-num text-sm font-bold text-[#12261B]">
                    {formatSoles(product.precioKg)} <span className="font-sans text-xs font-normal text-[#637B6D]">/ {product.unidad}</span>
                  </div>
                  <div className="font-mono-num text-xs text-[#637B6D] mt-0.5">
                    Stock: {formatKg(product.stockKg)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAuth('order', product)}
                  aria-label={`Agregar ${product.nombre} al pedido`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#64DC39] to-[#28A845] text-white shadow-sm hover:brightness-105 transition-all cursor-pointer shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 02: Nosotros & Servicios (Bento Asymmetric Proof Layout) */}
      <section id="nosotros" className="border-y border-[#DFE9E2] bg-white">
        <div id="servicios" className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="mb-10">
            <p className="text-sm font-semibold text-[#1B7A3E]">02. Operaciones y Cobertura B2B</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#12261B] mt-1">
              Logística diseñada para cocinas y comercios de Lima
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Marquee Operational Proof Card (col-span-2) */}
            <div className="lg:col-span-2 rounded-2xl border border-[#DCE8E0] bg-gradient-to-br from-[#0A341E] to-[#135531] p-7 sm:p-8 text-white flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Control exacto de stock, precios y despacho matinal
                </h3>
                <p className="text-sm sm:text-base text-[#D8EFE0]/85 mt-3 max-w-2xl leading-relaxed">
                  Conectamos directamente la cosecha de agricultores de Costa, Sierra y Selva con nuestro centro de acopio en Santa Anita. Cada pedido pasa por control de peso, verificación de frescura y ruta optimizada antes del amanecer.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-5 pt-6 border-t border-white/15">
                <div>
                  <div className="font-mono-num text-2xl font-bold text-[#82EE3F]">
                    {formatSoles(settings.pedidoMinimoSoles)}
                  </div>
                  <div className="text-xs text-white/75 mt-1">Pedido mínimo B2B</div>
                </div>
                <div>
                  <div className="font-mono-num text-2xl font-bold text-[#82EE3F]">
                    {settings.porcentajeDescuento}%
                  </div>
                  <div className="text-xs text-white/75 mt-1">
                    Descuento desde {formatSoles(settings.montoMinimoDescuentoSoles)}
                  </div>
                </div>
                <div>
                  <div className="font-mono-num text-2xl font-bold text-[#82EE3F]">06:30</div>
                  <div className="text-xs text-white/75 mt-1">Inicio ruta Lima</div>
                </div>
                <div>
                  <div className="font-mono-num text-2xl font-bold text-[#82EE3F]">100%</div>
                  <div className="text-xs text-white/75 mt-1">Trazabilidad por kg</div>
                </div>
              </div>
            </div>

            {/* Right Column: Client Segments */}
            <div className="rounded-2xl border border-[#DCE8E0] bg-[#F7FBF8] p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#12261B]">
                  Sectores que atendemos
                </h3>
                <p className="text-xs text-[#546B5D] mt-1">
                  Despacho recurrente con facturación electrónica y guía de remisión.
                </p>

                <ul className="mt-5 space-y-3.5 text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#239B47] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#12261B]">Restaurantes y Cevicherías:</span>{' '}
                      <span className="text-[#546B5D]">entrega antes de apertura de cocina.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#239B47] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#12261B]">Hoteles y Catering:</span>{' '}
                      <span className="text-[#546B5D]">calibres uniformes y reposición diaria.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#239B47] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#12261B]">Bodegas y Minimarkets:</span>{' '}
                      <span className="text-[#546B5D]">abastecimiento en jabas de alta rotación.</span>
                    </div>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F4A2B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#166039] transition-colors cursor-pointer"
              >
                Acceder al Portal ERP
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Lead Capture / Contact */}
      <section id="contacto" className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-sm font-semibold text-[#1B7A3E]">03. Contacto Comercial</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#12261B]">
              Solicita tu lista de precios mayorista
            </h2>
            <p className="text-sm text-[#4B6355] leading-relaxed">
              Déjanos los datos de tu restaurante, hotel, bodega o minimarket y un asesor comercial se comunicará contigo el mismo día para activar tu cuenta B2B.
            </p>

            <div className="pt-4 space-y-3 text-sm text-[#2E4638]">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#239B47] shrink-0" />
                <span>Av. La Cultura 1840, Centro Logístico Santa Anita, Lima</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#239B47] shrink-0" />
                <span className="font-mono-num">+51 (01) 482-9100 · +51 987 412 310</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-white border border-[#DCE8E0] p-6 sm:p-8 shadow-[0_4px_20px_rgba(14,54,32,0.04)]">
              {formSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F8EA] text-[#1D8E3F]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#12261B]">
                    Solicitud registrada correctamente
                  </h3>
                  <p className="text-sm text-[#4B6355] max-w-md mx-auto">
                    Nuestro equipo comercial recibió tu consulta y se pondrá en contacto en menos de 2 horas hábiles.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="mt-2 inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg border border-[#DCE8E0] text-[#12261B] hover:bg-[#F2F7F3] cursor-pointer"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                        Razón Social o Negocio *
                      </label>
                      <input
                        type="text"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        placeholder="Ej. Restaurante El Olivo S.A.C."
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                        RUC / DNI *
                      </label>
                      <input
                        type="text"
                        value={ruc}
                        onChange={(e) => setRuc(e.target.value)}
                        placeholder="20601234567"
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm font-mono-num text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                        Tipo de Negocio
                      </label>
                      <select
                        value={tipoNegocio}
                        onChange={(e) => setTipoNegocio(e.target.value as ClientType)}
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      >
                        <option value="Restaurantes">Restaurantes</option>
                        <option value="Hoteles">Hoteles</option>
                        <option value="Bodegas">Bodegas</option>
                        <option value="Minimarkets">Minimarkets</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="compras@empresa.pe"
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="987 412 310"
                        className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm font-mono-num text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#314A3B] mb-1.5">
                      Productos de interés y distrito de entrega
                    </label>
                    <textarea
                      rows={3}
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      placeholder="Indícanos volumen semanal estimado y distrito de Lima..."
                      className="w-full rounded-xl border border-[#D4E2D8] bg-[#FAFDFB] px-3.5 py-2.5 text-sm text-[#12261B] focus:border-[#28A845] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs font-medium text-[#C82333]">{formError}</p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5ED938] to-[#27A646] px-6 py-3 text-sm font-bold text-[#072817] hover:brightness-105 transition-all cursor-pointer"
                    >
                      Solicitar Cotización
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#DCE8E0] bg-[#072617] text-white/80">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <BrandLogo size="sm" theme="dark" />
            <p className="text-xs text-white/60 mt-2">
              {settings.razonSocial} · RUC {settings.ruc} · {settings.ciudad}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-white/75">
            <a href="#inicio" className="hover:text-white">Inicio</a>
            <a href="#productos" className="hover:text-white">Productos</a>
            <a href="#nosotros" className="hover:text-white">Nosotros</a>
            <a href="#contacto" className="hover:text-white">Contacto</a>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="font-semibold text-[#84EE40] hover:underline cursor-pointer"
            >
              Portal ERP
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
