import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { PageLoader } from '../components/PageState'
import { TextField } from '../components/TextField'
import { useAuth } from '../features/auth/auth-context'
import { etiquetaRol } from '../features/auth/roles'
import {
  actualizarPerfil,
  cambiarContrasena,
  obtenerPerfil,
} from '../features/perfil/perfil.api'
import { iniciales } from '../lib/iniciales'
import { erroresDeCampo, mensajeDeError } from '../lib/errors'

export function ProfilePage() {
  const { usuario, refrescarSesion } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [recibirNotificaciones, setRecibirNotificaciones] = useState(true)
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [contrasenaNueva, setContrasenaNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')

  useEffect(() => {
    let activo = true
    obtenerPerfil()
      .then((data) => {
        if (!activo) return
        setPerfil(data)
        setNombreCompleto(data.nombreCompleto)
        setRecibirNotificaciones(data.recibirNotificaciones)
      })
      .catch((fallo) => {
        if (activo) setError(mensajeDeError(fallo))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  async function guardarPerfil(evento) {
    evento.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')
    setErrores({})
    try {
      const actualizado = await actualizarPerfil({
        nombreCompleto: nombreCompleto.trim(),
        recibirNotificaciones,
      })
      setPerfil(actualizado)
      await refrescarSesion()
      setMensaje('Datos del perfil actualizados.')
    } catch (fallo) {
      const campos = erroresDeCampo(fallo)
      setErrores(campos)
      if (Object.keys(campos).length === 0) setError(mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function guardarContrasena(evento) {
    evento.preventDefault()
    if (contrasenaNueva !== confirmacion) {
      setErrores({ contrasenaNueva: 'La confirmación no coincide.' })
      return
    }
    setGuardando(true)
    setError('')
    setMensaje('')
    setErrores({})
    try {
      await cambiarContrasena({
        contrasenaActual,
        contrasenaNueva,
      })
      setContrasenaActual('')
      setContrasenaNueva('')
      setConfirmacion('')
      setMensaje('Contraseña actualizada correctamente.')
    } catch (fallo) {
      const campos = erroresDeCampo(fallo)
      setErrores(campos)
      if (Object.keys(campos).length === 0) setError(mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <PageLoader label="Cargando tu perfil…" />

  return (
    <div className="workspace-page profile-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Perfil</h1>
          <p>Actualiza tu nombre, tus avisos y tu contraseña.</p>
        </div>
      </header>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      {mensaje ? <div className="alert alert-success" role="status">{mensaje}</div> : null}

      <section className="panel-card">
        <div className="panel-card-heading profile-identity">
          <span aria-hidden="true" className="avatar avatar-large">
            {iniciales(perfil?.nombreCompleto ?? usuario?.nombreCompleto)}
          </span>
          <div>
            <h2>{perfil?.nombreCompleto ?? usuario?.nombreCompleto}</h2>
            <p className="muted-note">{perfil?.correo ?? usuario?.correo}</p>
          </div>
          <span className="badge badge-info">
            {(perfil?.roles ?? usuario?.roles ?? []).map(etiquetaRol).join(' · ')}
          </span>
        </div>
      </section>

      <div className="detail-layout">
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="user" size={22} /></span>
            <div>
              <p className="card-kicker">Datos</p>
              <h2>Información de la cuenta</h2>
            </div>
          </div>
          <form className="auth-form" onSubmit={guardarPerfil}>
            <TextField
              autoComplete="name"
              error={errores.nombreCompleto}
              id="nombreCompletoPerfil"
              label="Nombre completo"
              onChange={(evento) => {
                setNombreCompleto(evento.target.value)
                setErrores((actual) => ({ ...actual, nombreCompleto: undefined }))
              }}
              value={nombreCompleto}
            />
            <div className="field">
              <label htmlFor="correoPerfil">Correo electrónico</label>
              <input disabled id="correoPerfil" type="email" value={perfil?.correo ?? ''} />
              <p className="field-hint">El correo de acceso no se puede cambiar desde el perfil.</p>
            </div>
            <label className="check-row">
              <input
                checked={recibirNotificaciones}
                onChange={(evento) => setRecibirNotificaciones(evento.target.checked)}
                type="checkbox"
              />
              Recibir notificaciones en la aplicación
            </label>
            <div className="form-actions">
              <button className="button button-primary" disabled={guardando} type="submit">
                <Icon name="save" size={16} /> Guardar cambios
              </button>
            </div>
          </form>
        </section>

        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="lock" size={22} /></span>
            <div>
              <p className="card-kicker">Seguridad</p>
              <h2>Cambiar contraseña</h2>
            </div>
          </div>
          <form className="auth-form" onSubmit={guardarContrasena}>
            <TextField
              autoComplete="current-password"
              error={errores.contrasenaActual}
              id="contrasenaActual"
              label="Contraseña actual"
              onChange={(evento) => setContrasenaActual(evento.target.value)}
              type="password"
              value={contrasenaActual}
            />
            <TextField
              autoComplete="new-password"
              error={errores.contrasenaNueva}
              id="contrasenaNuevaPerfil"
              label="Nueva contraseña"
              onChange={(evento) => setContrasenaNueva(evento.target.value)}
              type="password"
              value={contrasenaNueva}
            />
            <TextField
              autoComplete="new-password"
              error={errores.confirmacion}
              id="confirmacionContrasena"
              label="Confirmar nueva contraseña"
              onChange={(evento) => setConfirmacion(evento.target.value)}
              type="password"
              value={confirmacion}
            />
            <p className="field-hint">Mínimo 15 caracteres. Los espacios cuentan.</p>
            <div className="form-actions">
              <button className="button button-secondary" disabled={guardando} type="submit">
                <Icon name="lock" size={16} /> Actualizar contraseña
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="panel-card profile-note">
        <Icon name="shield" size={20} />
        <div>
          <h2>Roles protegidos</h2>
          <p>
            Los roles y el correo solo pueden modificarse mediante los flujos
            administrativos autorizados. El perfil no permite escalamiento de privilegios.
          </p>
        </div>
      </section>
    </div>
  )
}
