import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { useAuth } from '../features/auth/auth-context'
import {
  LONGITUD_MINIMA_CONTRASENA,
  validarRegistro,
} from '../features/auth/validation'
import { erroresDeCampo, mensajeDeError } from '../lib/errors'

const formularioInicial = {
  nombreCompleto: '',
  correo: '',
  contrasena: '',
  confirmacion: '',
}

export function RegisterPage() {
  const { usuario, cargando, registrar } = useAuth()
  const navigate = useNavigate()
  const [formulario, setFormulario] = useState(formularioInicial)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando) {
    return (
      <div className="page-loader" role="status">
        <span className="spinner" />
        <span>Comprobando tu sesión…</span>
      </div>
    )
  }

  if (usuario) return <Navigate replace to="/app" />

  function cambiar(campo) {
    return (evento) => {
      setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))
      setErrores((actual) => ({ ...actual, [campo]: undefined }))
      setErrorGeneral('')
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    const validacion = validarRegistro(formulario)
    setErrores(validacion)
    setErrorGeneral('')
    if (Object.keys(validacion).length > 0) return

    setEnviando(true)
    try {
      await registrar({
        nombreCompleto: formulario.nombreCompleto.trim(),
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
      })
      navigate('/login', {
        replace: true,
        state: { registrado: true, correo: formulario.correo.trim() },
      })
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
    <div className="auth-shell auth-shell-register">
      <aside className="auth-aside">
        <Brand light to="/" />
        <div className="auth-aside-copy">
          <p className="eyebrow eyebrow-light">Registro de solicitante</p>
          <h1>Crea tu cuenta y empieza a evaluar.</h1>
          <p>Registra productos y solicita una evaluación.</p>
        </div>
        <p className="aside-footnote">GradeX · Evaluación de originalidad</p>
      </aside>

      <main className="auth-main" id="contenido-principal">
        <div className="auth-card auth-card-wide">
          <div className="auth-card-header">
            <span className="eyebrow">Cuenta</span>
            <h2>Crear cuenta</h2>
            <p>Completa tus datos.</p>
          </div>

          {errorGeneral ? (
            <div className="alert alert-error" role="alert">
              <Icon name="alert" size={18} />
              {errorGeneral}
            </div>
          ) : null}

          <form className="auth-form" noValidate onSubmit={enviar}>
            <TextField
              autoComplete="name"
              error={errores.nombreCompleto}
              id="nombreCompleto"
              label="Nombre completo"
              onChange={cambiar('nombreCompleto')}
              placeholder="Nombre y apellidos"
              value={formulario.nombreCompleto}
            />
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
            <div className="form-grid">
              <PasswordField
                autoComplete="new-password"
                describedBy="contrasena-hint"
                error={errores.contrasena}
                id="contrasena"
                label="Contraseña"
                onChange={cambiar('contrasena')}
                placeholder="Contraseña"
                value={formulario.contrasena}
              />
              <PasswordField
                autoComplete="new-password"
                describedBy="contrasena-hint"
                error={errores.confirmacion}
                id="confirmacion"
                label="Confirmar contraseña"
                onChange={cambiar('confirmacion')}
                placeholder="Confirmar contraseña"
                value={formulario.confirmacion}
              />
              <p className="field-hint password-hint" id="contrasena-hint">
                Mínimo {LONGITUD_MINIMA_CONTRASENA} caracteres. Los espacios cuentan.
              </p>
            </div>

            <button className="button button-primary button-block" disabled={enviando} type="submit">
              {enviando ? (
                <>
                  <span className="spinner spinner-small" /> Creando cuenta…
                </>
              ) : (
                <>
                  Crear cuenta <Icon name="arrow-right" size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>

          <Link className="back-link" to="/">
            <Icon name="arrow-left" size={16} /> Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
