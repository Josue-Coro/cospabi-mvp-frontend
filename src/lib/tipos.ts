// Tipos de las respuestas de la API (mismos nombres de campos que el backend)

export type NombreRol = "Administrador" | "Cajero" | "Plomero"

export type Rol = { id_rol: number; nombre: NombreRol; descripcion: string | null; estado: boolean }

export type UsuarioDetalle = {
  id_usuario_admin: number
  nombre: string
  apellido: string
  usuario: string
  correo: string | null
  estado: boolean
  fecha_creacion: string
  rol_id_rol: number
  rol: Rol
}

export type Caja = {
  id_caja: number
  fecha: string
  hora_apertura: string
  hora_cierre: string | null
  estado: boolean
  monto_apertura: number
  monto_cobrado: number | null
  monto_contado: number | null
  diferencia_arqueo: number | null
  observacion_cierre: string | null
  usuario_admin_id_usuario_admin: number
}

export type RegistroBitacora = { id_bitacora: number; fecha_hora: string; usuario: string; accion: string }

export type Tarifa = {
  id_tarifa: number
  consumo_minimo_m3: number | null
  monto_minimo: number
  precio_m3: number
  rol_socio_id_rol_socio: number
}

export type TipoCargo = { id_tipo: number; nombre: string; descripcion: string | null; monto: number; estado: boolean }
export type Medidor = { id_medidor: number; serie: string; numero: number; fecha_instalacion: string | null }
export type Periodo = { id_periodo: number; periodo: string; costo_inscripcion: number | null }
export type RolSocio = { id_rol_socio: number; rol_socio: string }
export type MetodoPago = { id_metodo_pago: number; metodo: string; referencia: string | null }
export type Ruta = { id_ruta: number; ruta: number; descripcion: string | null }

export type Persona = {
  id_persona: number
  nombre_completo: string
  ci: string
  fecha_nacimiento: string
  fecha_registro: string
  genero: string | null
  telefono: number | null
  estado: boolean
}

export type Socio = {
  id_socio: number
  codigo_fijo: number
  nombre_socio: string
  persona_id_persona: number
  rol_socio_id_rol_socio: number
  ruta_id_ruta: number
  medidor_id_medidor: number | null
  actividad: string
  categoria: string
  correo: string
  ubicacion: number | null
  num_casa: number | null
  num_ocupantes: number | null
  tipo_instalacion: string | null
  dim_instalacion: string | null
  fecha_registro: string
  estado: boolean
  fecha_baja: string | null
  motivo_baja: string | null
}

export type Cuota = {
  id_credito: number
  num_cuota: number
  monto_pago: number
  estado: "PENDIENTE" | "PAGADA"
  periodo: string
  pago_id_pago: number | null
}

export type CuentaSocio = {
  id_cuenta_socio: number
  usuario: string
  estado: boolean
  ultimo_acceso: string | null
  socio_id_socio: number
}

export type Pago = {
  id_pago: number
  fecha_pago: string
  monto_pagado: number
  vuelto: number | null
  cajero: string
  estado_pago: string
  forma_pago: string | null
  aviso_id_aviso: number | null
  metodo_pago_id_metodo_pago: number
  caja_id_caja: number | null
  id_factura: number | null
}

export type Lectura = {
  id_lectura: number
  fecha_lectura: string
  lectura_anterior: number
  lectura_actual: number
  consumo_m3: number
  dias_lectura: number
  observacion: string | null
  medidor_id_medidor: number
  periodo_id_periodo: number
}

export type EstadoAviso = "PENDIENTE" | "PAGADO" | "VENCIDO" | "ANULADO"

export type Aviso = {
  id_aviso: number
  periodo: string
  estado: EstadoAviso
  codigo_fijo: number
  nombre_socio: string
  consumo_m3: number | null
  total_consumo: number
  total_aviso: number
  fecha_emision: string
  fecha_vencimiento: string
  socio_id_socio: number
  lectura_id_lectura: number | null
}

export type AvisoDetalle = {
  id_aviso: number
  periodo: string
  estado: EstadoAviso
  fecha_emision: string
  fecha_vencimiento: string
  motivo_anulacion: string | null
  socio: {
    id_socio: number
    codigo_fijo: number
    nombre_socio: string
    categoria: string
    ruta: number
    ubicacion: number | null
    num_casa: number | null
  }
  lectura: {
    fecha_lectura: string
    lectura_anterior: number
    lectura_actual: number
    consumo_m3: number
  } | null
  tarifa: { consumo_minimo_m3: number | null; monto_minimo: number; precio_m3: number } | null
  total_consumo: number
  cargos: { id_cargo_extra: number; tipo: string; descripcion: string; monto: number; estado: string }[]
  cuotas_inscripcion: { num_cuota: number; monto: number; estado: string }[]
  total_aviso: number
  pago: {
    id_pago: number
    fecha_pago: string
    metodo: string
    monto_pagado: number
    forma_pago: string | null
    id_factura: number | null
  } | null
}

export type CargoExtra = {
  id_cargo_extra: number
  socio_id_socio: number
  codigo_fijo: number
  nombre_socio: string
  tipo: string
  periodo: string
  descripcion: string
  monto: number
  estado: "PENDIENTE" | "APLICADO" | "ANULADO"
  fecha_registro: string
  motivo_anulacion: string | null
}

export type Factura = {
  id_factura: number
  numero_factura: number
  fecha_emision: string
  nit_ci: string
  razon_social: string
  monto_total: number
  cuf: string
  codigo_control: string
  leyenda: string
  estado: string
  pago_id_pago: number
}

export type FacturaDetalle = Factura & {
  modalidad: string
  emisor: { nit: string; razon_social: string }
  metodo_pago: string
  id_aviso: number | null
  codigo_fijo: number | null
  periodo: string | null
  lineas: { concepto: string; monto: number }[]
}

export type FilaPlanilla = {
  id_socio: number
  codigo_fijo: number
  nombre_socio: string
  ubicacion: number | null
  num_casa: number | null
  id_medidor: number
  serie_medidor: string
  lectura_anterior: number | null
  leido: boolean
  id_lectura: number | null
  lectura_actual: number | null
  consumo_m3: number | null
}

export type Planilla = { ruta: number; descripcion: string | null; medidores: FilaPlanilla[] }

export type FilaPagoReporte = {
  id_pago: number
  fecha_pago: string
  id_aviso: number | null
  periodo: string | null
  codigo_fijo: number | null
  nombre_socio: string | null
  metodo: string
  monto: number
  cajero: string
  id_transaccion: string | null
  numero_factura: number | null
}
