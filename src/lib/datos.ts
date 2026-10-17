import { useEffect, useState } from "react"
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

/** Envía datos a la API (POST/PUT) y muestra un mensaje de éxito o de error. */
export async function enviar<T>(
  ruta: string,
  cuerpo: unknown,
  mensajeExito: string,
  metodo: "POST" | "PUT" | "DELETE" = "POST",
): Promise<T | null> {
  try {
    const respuesta = await api<T>(ruta, {
      method: metodo,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
    toast.success(mensajeExito)
    return respuesta
  } catch (e) {
    // Los errores de las reglas de negocio se dejan más tiempo para poder leerlos
    toast.error(e instanceof Error ? e.message : "No se pudo completar la acción", { duration: 8000 })
    return null
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
