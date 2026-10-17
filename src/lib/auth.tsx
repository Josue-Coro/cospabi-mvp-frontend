import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { api, guardarToken, obtenerToken } from "@/lib/api"

export type Usuario = {
  id_usuario_admin: number
  nombre: string
  apellido: string
  usuario: string
  rol: string
}

type Sesion = {
  usuario: Usuario | null
  cargando: boolean
  iniciarSesion: (usuario: string, contrasena: string) => Promise<void>
  cerrarSesion: () => void
}

const ContextoSesion = createContext<Sesion | null>(null)

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  // Al abrir la página, si hay un token guardado se recupera el usuario
  useEffect(() => {
    if (!obtenerToken()) {
      setCargando(false)
      return
    }
    api<Usuario>("/auth/yo")
      .then(setUsuario)
      .catch(() => guardarToken(null))
      .finally(() => setCargando(false))
  }, [])

  async function iniciarSesion(nombreUsuario: string, contrasena: string) {
    const respuesta = await api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario: nombreUsuario, contrasena }),
    })
    guardarToken(respuesta.access_token)
    setUsuario(await api<Usuario>("/auth/yo"))
  }

  function cerrarSesion() {
    guardarToken(null)
    setUsuario(null)
  }

  return (
    <ContextoSesion.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </ContextoSesion.Provider>
  )
}

export function useSesion() {
  const sesion = useContext(ContextoSesion)
  if (!sesion) throw new Error("useSesion debe usarse dentro de ProveedorSesion")
  return sesion
}
