import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { EmptyState, PageLoader } from '../components/PageState'
import {
  actualizarEspecialista,
  buscarUsuariosEspecialista,
  crearEspecialista,
  listarCategoriasAdmin,
  listarCategoriaMarcas,
  listarEspecialistasAdmin,
} from '../features/administracion/administracion.api'
import { erroresDeCampo, mensajeDeError } from '../lib/errors'

const ESTADOS = ['PENDIENTE', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO']
const NIVELES = ['GENERAL', 'INTERMEDIO', 'AVANZADO', 'EXPERTO']

const FORMULARIO_INICIAL = {
  idEspecialista: null,
  usuario: null,
  estado: 'PENDIENTE',
  aniosExperiencia: '',
  biografia: '',
  especialidades: [],
}

export function AdminSpecialistsPage() {
  const [especialistas, setEspecialistas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [buscar, setBuscar] = useState('')
  const [candidatos, setCandidatos] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState({
    idCategoria: '',
    idMarca: '',
    nivel: 'GENERAL',
  })
  const [marcasCategoria, setMarcasCategoria] = useState([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true
    Promise.all([listarEspecialistasAdmin(), listarCategoriasAdmin()])
      .then(([lista, categoriasData]) => {
        if (!activo) return
        setEspecialistas(lista)
        setCategorias(categoriasData.filter((categoria) => categoria.activa))
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

  useEffect(() => {
    let activo = true
    if (!nuevaEspecialidad.idCategoria) return undefined
    listarCategoriaMarcas(Number(nuevaEspecialidad.idCategoria))
      .then((marcas) => {
        if (activo) setMarcasCategoria(marcas.filter((marca) => marca.activa))
      })
      .catch(() => {
        if (activo) setMarcasCategoria([])
      })
    return () => {
      activo = false
    }
  }, [nuevaEspecialidad.idCategoria])

  async function buscarUsuarios() {
    setBuscando(true)
    setError('')
    try {
      setCandidatos(await buscarUsuariosEspecialista(buscar.trim() || undefined))
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setBuscando(false)
    }
  }

  function editar(especialista) {
    setFormulario({
      idEspecialista: especialista.idEspecialista,
      usuario: {
        idUsuario: especialista.idUsuario,
        nombreCompleto: especialista.nombre,
        correo: especialista.correo,
        yaEsEspecialista: true,
      },
      estado: especialista.estado,
      aniosExperiencia: especialista.aniosExperiencia ?? '',
      biografia: especialista.biografia ?? '',
      especialidades: especialista.especialidades
        .filter((especialidad) => especialidad.activa)
        .map((especialidad) => ({
          idCategoria: especialidad.idCategoria,
          idMarca: especialidad.idMarca,
          nivel: especialidad.nivel,
          categoria: especialidad.categoria,
          marca: especialidad.marca,
        })),
    })
    setMensaje('')
    setError('')
  }

  function limpiar() {
    setFormulario(FORMULARIO_INICIAL)
    setNuevaEspecialidad({ idCategoria: '', idMarca: '', nivel: 'GENERAL' })
    setCandidatos([])
    setBuscar('')
    setError('')
  }

  function agregarEspecialidad() {
    if (!nuevaEspecialidad.idCategoria) {
      setError('Selecciona una categoría para el área de especialidad.')
      return
    }
    const idCategoria = Number(nuevaEspecialidad.idCategoria)
    const idMarca = nuevaEspecialidad.idMarca ? Number(nuevaEspecialidad.idMarca) : null
    const existe = formulario.especialidades.some(
      (especialidad) => especialidad.idCategoria === idCategoria &&
        especialidad.idMarca === idMarca,
    )
    if (existe) {
      setError('Esa área ya está agregada.')
      return
    }
    const marca = marcasCategoria.find((item) => item.idMarca === idMarca)
    setFormulario((actual) => ({
      ...actual,
      especialidades: [
        ...actual.especialidades,
        {
          idCategoria,
          idMarca,
          nivel: nuevaEspecialidad.nivel,
          categoria: nombreCategoria(idCategoria),
          marca: marca?.nombre ?? null,
        },
      ],
    }))
    setNuevaEspecialidad({ idCategoria: '', idMarca: '', nivel: 'GENERAL' })
    setError('')
  }

  function quitarEspecialidad(indice) {
    setFormulario((actual) => ({
      ...actual,
      especialidades: actual.especialidades.filter((_, posicion) => posicion !== indice),
    }))
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (!formulario.usuario) {
      setError('Selecciona un usuario para acreditar como especialista.')
      return
    }
    if (formulario.especialidades.length === 0) {
      setError('Agrega al menos un área de especialidad.')
      return
    }
    setGuardando(true)
    setError('')
    setMensaje('')
    const datos = {
      idUsuario: formulario.usuario.idUsuario,
      estado: formulario.estado,
      aniosExperiencia: formulario.aniosExperiencia === ''
        ? null
        : Number(formulario.aniosExperiencia),
      biografia: formulario.biografia.trim() || null,
      especialidades: formulario.especialidades.map((especialidad) => ({
        idCategoria: especialidad.idCategoria,
        idMarca: especialidad.idMarca,
        nivel: especialidad.nivel,
      })),
    }
    try {
      const guardado = formulario.idEspecialista
        ? await actualizarEspecialista(formulario.idEspecialista, datos)
        : await crearEspecialista(datos)
      setMensaje(
        formulario.idEspecialista
          ? 'Especialista actualizado.'
          : `Especialista acreditado: ${guardado.nombre}.`,
      )
      setEspecialistas(await listarEspecialistasAdmin())
      limpiar()
    } catch (fallo) {
      const campos = erroresDeCampo(fallo)
      setError(campos.idUsuario || campos.especialidades || mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  function nombreCategoria(idCategoria) {
    return categorias.find((categoria) => categoria.idCategoria === idCategoria)?.nombre
      ?? `Categoría ${idCategoria}`
  }

  if (cargando) return <PageLoader label="Cargando especialistas…" />

  return (
    <div className="admin-section">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Especialistas acreditados</h1>
          <p>Gestiona estados, experiencia y áreas de compatibilidad.</p>
        </div>
      </header>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      {mensaje ? <div className="alert alert-success" role="status">{mensaje}</div> : null}

      <div className="admin-split">
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="users" size={22} /></span>
            <div>
              <p className="card-kicker">Directorio</p>
              <h2>{especialistas.length} especialistas</h2>
            </div>
          </div>
          {especialistas.length === 0 ? (
            <EmptyState
              compact
              description="Acredita el primer usuario como especialista."
              icon="users"
              title="Sin especialistas"
            />
          ) : (
            <ul className="specialist-list">
              {especialistas.map((especialista) => (
                <li key={especialista.idEspecialista}>
                  <div>
                    <strong>{especialista.nombre}</strong>
                    <p>{especialista.correo}</p>
                    <p>
                      <span className={`badge badge-${especialista.estado === 'ACTIVO' ? 'success' : 'neutral'}`}>
                        {especialista.estado}
                      </span>{' '}
                      {especialista.aniosExperiencia ?? 0} años · {especialista.cargaActiva} asignaciones
                    </p>
                    <small>
                      {especialista.especialidades
                        .filter((especialidad) => especialidad.activa)
                        .map((especialidad) =>
                          `${especialidad.categoria}${especialidad.marca ? ` / ${especialidad.marca}` : ''} (${especialidad.nivel})`)
                        .join(' · ') || 'Sin áreas activas'}
                    </small>
                  </div>
                  <button className="button button-secondary" onClick={() => editar(especialista)} type="button">
                    <Icon name="edit" size={16} /> Editar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="user" size={22} /></span>
            <div>
              <p className="card-kicker">{formulario.idEspecialista ? 'Edición' : 'Alta'}</p>
              <h2>{formulario.idEspecialista ? 'Actualizar especialista' : 'Acreditar especialista'}</h2>
            </div>
          </div>

          <form className="auth-form" onSubmit={guardar}>
            {!formulario.idEspecialista ? (
              <div className="field">
                <label htmlFor="buscarUsuario">Buscar usuario por nombre o correo</label>
                <div className="input-action">
                  <input
                    id="buscarUsuario"
                    onChange={(evento) => setBuscar(evento.target.value)}
                    placeholder="nombre@correo.com"
                    value={buscar}
                  />
                  <button className="button button-secondary" disabled={buscando} onClick={buscarUsuarios} type="button">
                    <Icon name="search" size={16} /> Buscar
                  </button>
                </div>
                {candidatos.length > 0 ? (
                  <ul className="candidate-list">
                    {candidatos.map((candidato) => (
                      <li key={candidato.idUsuario}>
                        <span>
                          <strong>{candidato.nombreCompleto}</strong>
                          <small>{candidato.correo}</small>
                        </span>
                        <button
                          className="button button-secondary"
                          disabled={candidato.yaEsEspecialista || !candidato.activo}
                          onClick={() => {
                            setFormulario((actual) => ({
                              ...actual,
                              usuario: candidato,
                            }))
                            setCandidatos([])
                          }}
                          type="button"
                        >
                          {candidato.yaEsEspecialista ? 'Ya es especialista' : 'Seleccionar'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {formulario.usuario ? (
              <div className="selected-user">
                <Icon name="user" size={18} />
                <div>
                  <strong>{formulario.usuario.nombreCompleto}</strong>
                  <small>{formulario.usuario.correo}</small>
                </div>
                {!formulario.idEspecialista ? (
                  <button
                    aria-label="Quitar usuario seleccionado"
                    className="icon-button"
                    onClick={() => setFormulario((actual) => ({ ...actual, usuario: null }))}
                    type="button"
                  >
                    <Icon name="close" size={16} />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="form-grid">
              <div className="field">
                <label htmlFor="estadoEspecialista">Estado</label>
                <select
                  id="estadoEspecialista"
                  onChange={(evento) => setFormulario((actual) => ({
                    ...actual, estado: evento.target.value,
                  }))}
                  value={formulario.estado}
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="aniosExperiencia">Años de experiencia</label>
                <input
                  id="aniosExperiencia"
                  min="0"
                  onChange={(evento) => setFormulario((actual) => ({
                    ...actual, aniosExperiencia: evento.target.value,
                  }))}
                  type="number"
                  value={formulario.aniosExperiencia}
                />
              </div>
              <div className="field field-wide">
                <label htmlFor="biografia">Biografía</label>
                <textarea
                  id="biografia"
                  maxLength={600}
                  onChange={(evento) => setFormulario((actual) => ({
                    ...actual, biografia: evento.target.value,
                  }))}
                  rows={3}
                  value={formulario.biografia}
                />
              </div>
            </div>

            <h3>Áreas de compatibilidad</h3>
            {formulario.especialidades.length === 0 ? (
              <p className="panel-note">Agrega al menos una categoría.</p>
            ) : (
              <ul className="specialty-list">
                {formulario.especialidades.map((especialidad, indice) => (
                  <li key={`${especialidad.idCategoria}-${especialidad.idMarca}-${indice}`}>
                    <span>
                      {especialidad.categoria ?? nombreCategoria(especialidad.idCategoria)}
                      {especialidad.idMarca
                        ? ` · ${especialidad.marca ?? `marca ${especialidad.idMarca}`}`
                        : ' · todas las marcas'}
                      {' · '}{especialidad.nivel}
                    </span>
                    <button
                      aria-label="Quitar área"
                      className="icon-button"
                      onClick={() => quitarEspecialidad(indice)}
                      type="button"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="form-grid">
              <div className="field">
                <label htmlFor="nuevaCategoria">Categoría</label>
                <select
                  id="nuevaCategoria"
                  onChange={(evento) => {
                    setMarcasCategoria([])
                    setNuevaEspecialidad((actual) => ({
                      ...actual,
                      idCategoria: evento.target.value,
                      idMarca: '',
                    }))
                  }}
                  value={nuevaEspecialidad.idCategoria}
                >
                  <option value="">Selecciona</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.idCategoria} value={categoria.idCategoria}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="nuevaMarca">Marca (opcional)</label>
                <select
                  disabled={!nuevaEspecialidad.idCategoria}
                  id="nuevaMarca"
                  onChange={(evento) => setNuevaEspecialidad((actual) => ({
                    ...actual, idMarca: evento.target.value,
                  }))}
                  value={nuevaEspecialidad.idMarca}
                >
                  <option value="">Todas las marcas</option>
                  {marcasCategoria.map((marca) => (
                    <option key={marca.idMarca} value={marca.idMarca}>{marca.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="nuevoNivel">Nivel</label>
                <select
                  id="nuevoNivel"
                  onChange={(evento) => setNuevaEspecialidad((actual) => ({
                    ...actual, nivel: evento.target.value,
                  }))}
                  value={nuevaEspecialidad.nivel}
                >
                  {NIVELES.map((nivel) => (
                    <option key={nivel} value={nivel}>{nivel}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="button button-secondary" onClick={agregarEspecialidad} type="button">
              <Icon name="plus" size={16} /> Agregar área
            </button>

            <div className="form-actions">
              {formulario.idEspecialista ? (
                <button className="button button-quiet" onClick={limpiar} type="button">
                  Cancelar edición
                </button>
              ) : null}
              <button className="button button-primary" disabled={guardando} type="submit">
                {guardando ? (
                  <><span className="spinner spinner-small" /> Guardando…</>
                ) : formulario.idEspecialista ? (
                  <><Icon name="save" size={16} /> Guardar cambios</>
                ) : (
                  <><Icon name="plus" size={16} /> Acreditar especialista</>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
