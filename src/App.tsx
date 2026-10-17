import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import Layout from "@/components/Layout"
import { Toaster } from "@/components/ui/sonner"
import { ProveedorSesion, useSesion } from "@/lib/auth"
import type { NombreRol } from "@/lib/tipos"
import Inicio from "@/pages/Inicio"
import Login from "@/pages/Login"
import Bitacora from "@/pages/administracion/Bitacora"
import Caja from "@/pages/administracion/Caja"
import Usuarios from "@/pages/administracion/Usuarios"
import Cobrar from "@/pages/atencion/Cobrar"
import Personas from "@/pages/atencion/Personas"
import SocioDetalle from "@/pages/atencion/SocioDetalle"
import Socios from "@/pages/atencion/Socios"
import Medidores from "@/pages/configuracion/Medidores"
import Periodos from "@/pages/configuracion/Periodos"
import Tarifas from "@/pages/configuracion/Tarifas"
import TiposCargo from "@/pages/configuracion/TiposCargo"
import FacturaDetalle from "@/pages/facturacion/FacturaDetalle"
import Facturas from "@/pages/facturacion/Facturas"
import AvisoDetalle from "@/pages/operaciones/AvisoDetalle"
import Avisos from "@/pages/operaciones/Avisos"
import CargosExtra from "@/pages/operaciones/CargosExtra"
import Lecturas from "@/pages/operaciones/Lecturas"
import Rutas from "@/pages/operaciones/Rutas"
import { ReporteCaja, ReporteInscripcion, ReporteMorosidad, ReportePortal } from "@/pages/reportes/Reportes"

const ADMIN: NombreRol[] = ["Administrador"]
const CAJA: NombreRol[] = ["Administrador", "Cajero"]
const TODOS: NombreRol[] = ["Administrador", "Cajero", "Plomero"]

/** Muestra la pantalla solo a los roles indicados (la API también lo valida). */
function ConRol({ roles, children }: { roles: NombreRol[]; children: ReactNode }) {
  const { usuario } = useSesion()
  if (usuario && !roles.includes(usuario.rol as NombreRol)) {
    return <p className="py-10 text-center text-muted-foreground">Su rol no tiene acceso a esta pantalla.</p>
  }
  return <>{children}</>
}

const PANTALLAS: { ruta: string; roles: NombreRol[]; elemento: ReactNode }[] = [
  { ruta: "/usuarios", roles: ADMIN, elemento: <Usuarios /> },
  { ruta: "/caja", roles: CAJA, elemento: <Caja /> },
  { ruta: "/bitacora", roles: ADMIN, elemento: <Bitacora /> },
  { ruta: "/tarifas", roles: CAJA, elemento: <Tarifas /> },
  { ruta: "/tipos-cargo", roles: CAJA, elemento: <TiposCargo /> },
  { ruta: "/medidores", roles: CAJA, elemento: <Medidores /> },
  { ruta: "/periodos", roles: CAJA, elemento: <Periodos /> },
  { ruta: "/personas", roles: CAJA, elemento: <Personas /> },
  { ruta: "/socios", roles: CAJA, elemento: <Socios /> },
  { ruta: "/socios/:id", roles: CAJA, elemento: <SocioDetalle /> },
  { ruta: "/cobrar", roles: CAJA, elemento: <Cobrar /> },
  { ruta: "/lecturas", roles: TODOS, elemento: <Lecturas /> },
  { ruta: "/rutas", roles: CAJA, elemento: <Rutas /> },
  { ruta: "/avisos", roles: CAJA, elemento: <Avisos /> },
  { ruta: "/avisos/:id", roles: CAJA, elemento: <AvisoDetalle /> },
  { ruta: "/cargos-extra", roles: CAJA, elemento: <CargosExtra /> },
  { ruta: "/facturas", roles: CAJA, elemento: <Facturas /> },
  { ruta: "/facturas/:id", roles: CAJA, elemento: <FacturaDetalle /> },
  { ruta: "/reportes/caja", roles: CAJA, elemento: <ReporteCaja /> },
  { ruta: "/reportes/morosidad", roles: CAJA, elemento: <ReporteMorosidad /> },
  { ruta: "/reportes/portal", roles: CAJA, elemento: <ReportePortal /> },
  { ruta: "/reportes/inscripcion", roles: CAJA, elemento: <ReporteInscripcion /> },
]

export default function App() {
  return (
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            {PANTALLAS.map((p) => (
              <Route key={p.ruta} path={p.ruta} element={<ConRol roles={p.roles}>{p.elemento}</ConRol>} />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </ProveedorSesion>
  )
}
