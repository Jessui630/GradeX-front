import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { useAuth } from '../features/auth/auth-context'
import { validarInicioSesion } from '../features/auth/validation'
import { erroresDeCampo, mensajeDeError } from '../lib/errors'

export function LoginPage() {
  const { usuario, cargando, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formulario, setFormulario] = useState({
    correo: location.state?.correo ?? '',
    contrasena: '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const destino = location.state?.from?.pathname ?? '/app'
  const registroExitoso = Boolean(location.state?.registrado)

  if (cargando) {
    return (
      <div className="page-loader" role="status">
        <span className="spinner" />
        <span>Comprobando tu sesión…</span>
      </div>
    )
  }

  if (usuario) return <Navigate replace to={destino} />

  function cambiar(campo) {
    return (evento) => {
      setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))
      setErrores((actual) => ({ ...actual, [campo]: undefined }))
      setErrorGeneral('')
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    const validacion = validarInicioSesion(formulario)
    setErrores(validacion)
    setErrorGeneral('')
    if (Object.keys(validacion).length > 0) return

    setEnviando(true)
    try {
      await iniciarSesion({
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
      })
      navigate(destino, { replace: true })
    } catch (error) {
      const campos = erroresDeCampo(error)
      setErrores(campos)
      if (Object.keys(campos).length === 0) {
        setErrorGeneral(mensajeDeError(error))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Brand light to="/" />
        <div className="auth-aside-copy">
          <p className="eyebrow eyebrow-light">Acceso</p>
          <h1>Todo tu proceso de evaluación, en un solo lugar.</h1>
          <p>Consulta solicitudes, revisa asignaciones o administra según tu rol.</p>
        </div>
        <ul className="aside-points">
          <li>
            <Icon name="check" size={17} /> Acceso por rol confirmado
          </li>
          <li>
            <Icon name="check" size={17} /> Sesión HttpOnly protegida
          </li>
          <li>
            <Icon name="check" size={17} /> Errores de acceso no enumerables
          </li>
        </ul>
        <p className="aside-footnote">GradeX · Evaluación profesional de originalidad</p>
      </aside>

      <main className="auth-main" id="contenido-principal">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="eyebrow">Acceso</span>
            <h2>Inicia sesión</h2>
            <p>Usa el correo y la contraseña de tu cuenta.</p>
          </div>

          {registroExitoso ? (
            <div className="alert alert-success" role="status">
              <Icon name="check" size={18} />
              Cuenta creada correctamente. Ya puedes iniciar sesión.
            </div>
          ) : null}

          {errorGeneral ? (
            <div className="alert alert-error" role="alert">
              <Icon name="alert" size={18} />
              {errorGeneral}
            </div>
          ) : null}

          <form className="auth-form" noValidate onSubmit={enviar}>
            <TextField
              autoComplete="email"
              error={errores.correo}
              id="correo"
              label="Correo electrónico"
              onChange={cambiar('correo')}
              placeholder="nombre@correo.com"
              type="email"
              value={formulario.correo}
            />
            <PasswordField
              autoComplete="current-password"
              error={errores.contrasena}
              id="contrasena"
              label="Contraseña"
              onChange={cambiar('contrasena')}
              placeholder="Tu contraseña"
              value={formulario.contrasena}
            />

            <button className="button button-primary button-block" disabled={enviando} type="submit">
              {enviando ? (
                <>
                  <span className="spinner spinner-small" /> Iniciando sesión…
                </>
              ) : (
                <>
                  Entrar a GradeX <Icon name="arrow-right" size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            ¿Todavía no tienes cuenta?{' '}
            <Link to="/registro">Crear una cuenta de solicitante</Link>
          </p>

          <Link className="back-link" to="/">
            <Icon name="arrow-left" size={16} /> Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
