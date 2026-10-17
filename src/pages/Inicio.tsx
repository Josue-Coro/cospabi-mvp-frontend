import { Link } from "react-router-dom"

import { useSesion } from "@/lib/auth"
import { menuDelRol } from "@/lib/menu"

export default function Inicio() {
  const { usuario } = useSesion()
  // Accesos directos a lo que el rol puede usar, agrupados por módulo
  const secciones = menuDelRol(usuario?.rol ?? "").filter((s) => s.titulo)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido, {usuario?.nombre}</h1>
        <p className="text-muted-foreground">
          Rol: {usuario?.rol} · Sistema de gestión de la Cooperativa de Agua Potable COSPABI R.L.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {secciones.map((seccion) => (
          <div key={seccion.titulo} className="rounded-xl border bg-background p-4">
            <h2 className="mb-2 font-semibold">{seccion.titulo}</h2>
            <ul className="space-y-1">
              {seccion.items.map((item) => (
                <li key={item.ruta}>
                  <Link to={item.ruta} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <item.icono className="size-4" /> {item.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
