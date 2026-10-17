import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { api, guardarToken, obtenerToken } from "@/lib/api"

const MINUTOS_INACTIVIDAD = 15

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

  // Si la API responde 401 (token vencido) se vuelve al login
  useEffect(() => {
    const alExpirar = () => setUsuario(null)
    window.addEventListener("sesion-expirada", alExpirar)
    return () => window.removeEventListener("sesion-expirada", alExpirar)
  }, [])

  // RNF-04: cierra la sesión tras 15 minutos sin actividad
  useEffect(() => {
    if (!usuario) return
    let temporizador = 0
    const reiniciar = () => {
      window.clearTimeout(temporizador)
      temporizador = window.setTimeout(() => {
        guardarToken(null)
        setUsuario(null)
        toast.info("Su sesión se cerró por 15 minutos de inactividad")
      }, MINUTOS_INACTIVIDAD * 60_000)
    }
    const eventos = ["mousemove", "keydown", "click", "touchstart", "scroll"]
    eventos.forEach((evento) => window.addEventListener(evento, reiniciar, { passive: true }))
    reiniciar()
    return () => {
      window.clearTimeout(temporizador)
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciar))
    }
  }, [usuario])

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
