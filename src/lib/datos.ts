import { useEffect, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

import { api } from "@/lib/api"

/** Carga un endpoint GET y lo vuelve a cargar cuando cambia la ruta o se llama a recargar(). */
export function useDatos<T>(ruta: string | null) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!ruta) return
    let activo = true
    setCargando(true)
    setError("")
    api<T>(ruta)
      .then((respuesta) => activo && setDatos(respuesta))
      .catch((e: Error) => activo && setError(e.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [ruta, version])

  return { datos, error, cargando, recargar: () => setVersion((v) => v + 1) }
}

// Envíos que esperan respuesta de la API. Sirve para no mandar dos veces la misma
// operación (doble clic, o varios clics mientras Render despierta) y para que los
// botones se desactiven mientras tanto (useEnviando).
const enCurso = new Set<string>()
const oyentes = new Set<() => void>()

function avisarCambio() {
  oyentes.forEach((oyente) => oyente())
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** true mientras haya algún envío a la API sin terminar. */
export function useEnviando(): boolean {
  return useSyncExternalStore(suscribir, () => enCurso.size > 0)
}

/** Envía datos a la API (POST/PUT) y muestra un mensaje de éxito o de error.
 *  Si la misma operación ya está en camino, el clic repetido se ignora (devuelve null). */
export async function enviar<T>(
  ruta: string,
  cuerpo: unknown,
  mensajeExito: string,
  metodo: "POST" | "PUT" | "DELETE" = "POST",
): Promise<T | null> {
  const body = cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  const clave = `${metodo} ${ruta} ${body ?? ""}`
  if (enCurso.has(clave)) return null
  enCurso.add(clave)
  avisarCambio()
  try {
    const respuesta = await api<T>(ruta, { method: metodo, body })
    toast.success(mensajeExito)
    return respuesta
  } catch (e) {
    // Los errores de las reglas de negocio se dejan más tiempo para poder leerlos
    toast.error(e instanceof Error ? e.message : "No se pudo completar la acción", { duration: 8000 })
    return null
  } finally {
    enCurso.delete(clave)
    avisarCambio()
  }
}

/** Arma la query string omitiendo los valores vacíos. */
export function consulta(parametros: Record<string, string | number | boolean | null | undefined>) {
  const texto = new URLSearchParams(
    Object.entries(parametros)
      .filter(([, valor]) => valor !== "" && valor !== null && valor !== undefined)
      .map(([clave, valor]) => [clave, String(valor)]),
  ).toString()
  return texto ? `?${texto}` : ""
}
