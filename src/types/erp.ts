export type UserRole = 'ADMIN' | 'VENDEDOR';

export type OriginRegion = 'Costa' | 'Sierra' | 'Selva';

export type ActiveStatus = 'Activo' | 'Inactivo';

export type OrderStatus =
  | 'Pendiente'
  | 'Confirmado'
  | 'En preparación'
  | 'Despachado'
  | 'Entregado'
  | 'Cancelado';

export type ClientType = 'Bodegas' | 'Restaurantes' | 'Hoteles' | 'Minimarkets';

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export type ModuleId =
  | 'dashboard'
  | 'productos'
  | 'inventario'
  | 'clientes'
  | 'pedidos'
  | 'ventas'
  | 'logistica'
  | 'reportes'
  | 'usuarios'
  | 'configuracion';

export interface UserAccount {
  id: string;
  username: string;
  nombreCompleto: string;
  email: string;
  rol: UserRole;
  cargo: string;
  activo: boolean;
  avatarUrl?: string;
}

export interface Category {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: ActiveStatus;
  color: string;
}

export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  categoriaNombre: string;
  precioKg: number;
  stockKg: number;
  unidad: string;
  origen: OriginRegion;
  estado: ActiveStatus;
  imagenUrl: string;
  fechaRegistro: string;
  ultimoMovimiento?: string;
}

export interface InventoryMovement {
  id: number;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  tipo: MovementType;
  cantidadKg: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  referencia: string;
  usuarioNombre: string;
  fecha: string;
}

export interface Client {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  tipo: ClientType;
  distrito: string;
  direccion: string;
  telefono: string;
  correo: string;
  estado: ActiveStatus;
}

export interface OrderItem {
  productoId: number;
  codigoProducto: string;
  nombreProducto: string;
  categoriaNombre: string;
  cantidadKg: number;
  precioKg: number;
  subtotal: number;
  imagenUrl?: string;
}

export interface Order {
  id: number;
  numeroPedido: string;
  clienteId: number;
  clienteRuc: string;
  clienteNombre: string;
  clienteTipo: ClientType;
  vendedorId: string;
  vendedorNombre: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: OrderStatus;
  observacion: string;
  items: OrderItem[];
}

export interface Sale {
  id: number;
  numeroVenta: string;
  pedidoId: number;
  numeroPedido: string;
  clienteId: number;
  clienteNombre: string;
  clienteRuc: string;
  vendedorNombre: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  productosResumen: string;
  itemsCount: number;
  estado: 'Registrada' | 'Anulada';
}

export interface DispatchEvent {
  estado: OrderStatus;
  fecha: string;
  responsable: string;
  nota: string;
}

export interface Dispatch {
  id: number;
  pedidoId: number;
  numeroPedido: string;
  clienteNombre: string;
  clienteDireccion: string;
  estadoLogistico: OrderStatus;
  responsableNombre: string;
  vehiculo: string;
  zonaLima: string;
  fechaProgramada: string;
  fechaSalida?: string;
  fechaEntrega?: string;
  observaciones: string;
  totalPedido: number;
  eventos: DispatchEvent[];
}

export interface CompanySettings {
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  ciudad: string;
  umbralStockCriticoKg: number;
  pedidoMinimoSoles: number;
  porcentajeDescuento: number;
  montoMinimoDescuentoSoles: number;
  moneda: string;
  unidadBase: string;
}

export interface LeadInquiry {
  id: string;
  razonSocial: string;
  ruc: string;
  correo: string;
  telefono: string;
  tipoNegocio: ClientType;
  mensaje: string;
  fecha: string;
}

export interface DailySalesPoint {
  dayLabel: string;
  dateISO: string;
  amount: number;
  ordersCount: number;
}
