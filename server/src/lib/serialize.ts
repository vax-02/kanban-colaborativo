export type UsuarioMini = {
  id: string
  nombre: string
  apellidos: string
  email: string
  avatarColor: string
  avatarUrl: string | null
  esOnline?: boolean
}

export function basicUser(u: UsuarioMini) {
  return {
    id: u.id,
    nombre: u.nombre,
    apellidos: u.apellidos,
    email: u.email,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl,
    iniciales: `${u.nombre[0]}${u.apellidos[0]}`.toUpperCase(),
  }
}