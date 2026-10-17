import { Navigate, Outlet } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useSesion } from "@/lib/auth"

/** Estructura de las páginas protegidas: exige sesión iniciada. */
export default function Layout() {
  const { usuario, cargando, cerrarSesion } = useSesion()

  if (cargando) return <p className="p-6 text-muted-foreground">Cargando...</p>
  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <span className="font-semibold">COSPABI R.L.</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {usuario.nombre} {usuario.apellido} · {usuario.rol}
          </span>
          <Button variant="outline" size="sm" onClick={cerrarSesion}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
