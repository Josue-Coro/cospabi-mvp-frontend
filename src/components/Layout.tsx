import { useState } from "react"
import { NavLink, Navigate, Outlet } from "react-router-dom"
import { DropletsIcon, LogOutIcon, MenuIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { useSesion } from "@/lib/auth"
import { menuDelRol } from "@/lib/menu"

/** Estructura de las páginas protegidas: exige sesión y muestra el menú según el rol. */
export default function Layout() {
  const { usuario, cargando, cerrarSesion } = useSesion()
  const [menuAbierto, setMenuAbierto] = useState(false)

  if (cargando) return <p className="p-6 text-muted-foreground">Cargando...</p>
  if (!usuario) return <Navigate to="/login" replace />

  const secciones = menuDelRol(usuario.rol)

  return (
    <div className="min-h-svh bg-muted print:bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-primary px-4 py-2.5 text-primary-foreground print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary hover:text-secondary-foreground lg:hidden"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Abrir menú"
          >
            {menuAbierto ? <XIcon /> : <MenuIcon />}
          </Button>
          <DropletsIcon className="size-5" />
          <span className="font-semibold">COSPABI R.L.</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">
            {usuario.nombre} {usuario.apellido} · {usuario.rol}
          </span>
          <Button variant="secondary" size="sm" onClick={cerrarSesion}>
            <LogOutIcon /> Salir
          </Button>
        </div>
      </header>

      <div className="flex">
        <nav
          className={cn(
            "fixed inset-y-0 top-[53px] z-20 w-60 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground lg:sticky lg:block lg:h-[calc(100svh-53px)]",
            menuAbierto ? "block" : "hidden",
            "print:hidden",
          )}
        >
          {secciones.map((seccion) => (
            <div key={seccion.titulo} className="mb-3">
              {seccion.titulo && (
                <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-primary uppercase">
                  {seccion.titulo}
                </p>
              )}
              {seccion.items.map((item) => (
                <NavLink
                  key={item.ruta}
                  to={item.ruta}
                  end={item.ruta === "/"}
                  onClick={() => setMenuAbierto(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                      isActive
                        ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )
                  }
                >
                  <item.icono className="size-4" /> {item.etiqueta}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 p-4 sm:p-6 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
