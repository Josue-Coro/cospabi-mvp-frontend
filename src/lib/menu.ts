import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardListIcon,
  DropletsIcon,
  FileTextIcon,
  GaugeIcon,
  HandCoinsIcon,
  HomeIcon,
  MapIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import type { NombreRol } from "@/lib/tipos"

export type ItemMenu = { ruta: string; etiqueta: string; icono: LucideIcon; roles: NombreRol[] }
export type SeccionMenu = { titulo: string; items: ItemMenu[] }

const A: NombreRol = "Administrador"
const C: NombreRol = "Cajero"
const P: NombreRol = "Plomero"

// Menu del panel: cada opcion indica que roles la ven (el backend tambien lo valida)
export const MENU: SeccionMenu[] = [
  { titulo: "", items: [{ ruta: "/", etiqueta: "Inicio", icono: HomeIcon, roles: [A, C, P] }] },
  {
    titulo: "Administración",
    items: [
      { ruta: "/usuarios", etiqueta: "Usuarios", icono: ShieldCheckIcon, roles: [A] },
      { ruta: "/caja", etiqueta: "Caja", icono: WalletIcon, roles: [A, C] },
      { ruta: "/bitacora", etiqueta: "Bitácora", icono: BookOpenIcon, roles: [A] },
    ],
  },
  {
    titulo: "Configuración",
    items: [
      { ruta: "/tarifas", etiqueta: "Tarifas", icono: DropletsIcon, roles: [A, C] },
      { ruta: "/tipos-cargo", etiqueta: "Tipos de cargo", icono: TagIcon, roles: [A, C] },
      { ruta: "/medidores", etiqueta: "Medidores", icono: GaugeIcon, roles: [A, C] },
      { ruta: "/periodos", etiqueta: "Periodos", icono: CalendarIcon, roles: [A, C] },
    ],
  },
  {
    titulo: "Atención al Cliente",
    items: [
      { ruta: "/personas", etiqueta: "Personas", icono: UserIcon, roles: [A, C] },
      { ruta: "/socios", etiqueta: "Socios", icono: UsersIcon, roles: [A, C] },
      { ruta: "/cobrar", etiqueta: "Cobrar avisos", icono: HandCoinsIcon, roles: [A, C] },
    ],
  },
  {
    titulo: "Operaciones",
    items: [
      { ruta: "/lecturas", etiqueta: "Lecturas por ruta", icono: ClipboardListIcon, roles: [A, C, P] },
      { ruta: "/rutas", etiqueta: "Rutas", icono: MapIcon, roles: [A, C] },
      { ruta: "/avisos", etiqueta: "Avisos de cobranza", icono: FileTextIcon, roles: [A, C] },
      { ruta: "/cargos-extra", etiqueta: "Cargos extra", icono: TagIcon, roles: [A, C] },
    ],
  },
  {
    titulo: "Facturación",
    items: [{ ruta: "/facturas", etiqueta: "Facturas", icono: ReceiptIcon, roles: [A, C] }],
  },
  {
    titulo: "Reportes",
    items: [
      { ruta: "/reportes/caja", etiqueta: "Reporte de caja", icono: BarChart3Icon, roles: [A, C] },
      { ruta: "/reportes/morosidad", etiqueta: "Morosidad", icono: BarChart3Icon, roles: [A, C] },
      { ruta: "/reportes/portal", etiqueta: "Pagos del portal", icono: BarChart3Icon, roles: [A, C] },
      { ruta: "/reportes/inscripcion", etiqueta: "Pagos de inscripción", icono: BarChart3Icon, roles: [A, C] },
    ],
  },
]

export function menuDelRol(rol: string): SeccionMenu[] {
  return MENU.map((seccion) => ({
    ...seccion,
    items: seccion.items.filter((item) => item.roles.includes(rol as NombreRol)),
  })).filter((seccion) => seccion.items.length > 0)
}
