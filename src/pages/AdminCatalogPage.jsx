import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { EmptyState, PageLoader } from '../components/PageState'
import {
  actualizarCategoria,
  actualizarCriterio,
  actualizarMarca,
  actualizarRequisitos,
  crearCategoria,
  crearCriterio,
  crearMarca,
  listarCategoriasAdmin,
  listarCategoriaMarcas,
  listarCriterios,
  listarMarcasAdmin,
  listarTiposEvidenciaAdmin,
  obtenerRequisitosAdmin,
  vincularMarca,
} from '../features/administracion/administracion.api'
import { erroresDeCampo, mensajeDeError } from '../lib/errors'

const CAMPOS = [
  { campo: 'NOMBRE', etiqueta: 'Nombre', max: 150 },
  { campo: 'MODELO', etiqueta: 'Modelo', max: 150 },
  { campo: 'SKU', etiqueta: 'SKU', max: 80 },
  { campo: 'NUMERO_SERIE', etiqueta: 'Número de serie', max: 120 },
  { campo: 'IMEI', etiqueta: 'IMEI', max: 30 },
  { campo: 'ACCESORIOS', etiqueta: 'Accesorios', max: 500 },
  { campo: 'DESCRIPCION', etiqueta: 'Descripción', max: 1000 },
  { campo: 'MARCA', etiqueta: 'Marca', max: 0 },
]

const TIPOS_CRITERIO = ['ESCALA', 'NUMERICO', 'TEXTO', 'BOOLEANO']

const CATEGORIA_INICIAL = { idCategoria: null, nombre: '', descripcion: '', activa: true }
const MARCA_INICIAL = { idMarca: null, nombre: '', activa: true }
const CRITERIO_INICIAL = {
  idCriterio: null,
  nombre: '',
  descripcion: '',
  tipoDato: 'NUMERICO',
  obligatorio: true,
  orden: 1,
  activo: true,
}

export function AdminCatalogPage() {
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [tipos, setTipos] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [categoriaMarcas, setCategoriaMarcas] = useState([])
  const [criterios, setCriterios] = useState([])
  const [campos, setCampos] = useState([])
  const [evidencias, setEvidencias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [categoriaForm, setCategoriaForm] = useState(CATEGORIA_INICIAL)
  const [marcaForm, setMarcaForm] = useState(MARCA_INICIAL)
  const [criterioForm, setCriterioForm] = useState(CRITERIO_INICIAL)
  const [requisitosError, setRequisitosError] = useState('')

  useEffect(() => {
    let activo = true
    Promise.all([
      listarCategoriasAdmin(),
      listarMarcasAdmin(),
      listarTiposEvidenciaAdmin(),
    ])
      .then(([listaCategorias, listaMarcas, listaTipos]) => {
        if (!activo) return
        setCategorias(listaCategorias)
        setMarcas(listaMarcas)
        setTipos(listaTipos)
        const primera = listaCategorias.find((categoria) => categoria.activa)
        if (primera) setCargandoDetalle(true)
        setSeleccionada((actual) => actual ?? primera?.idCategoria ?? null)
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
    if (!seleccionada) return undefined
    Promise.all([
      listarCategoriaMarcas(seleccionada),
      listarCriterios(seleccionada),
      obtenerRequisitosAdmin(seleccionada),
    ])
      .then(([vinculos, listaCriterios, requisitos]) => {
        if (!activo) return
        setCategoriaMarcas(vinculos)
        setCriterios(listaCriterios)
        setCampos(CAMPOS.map((definicion, indice) => {
          const actual = requisitos.campos.find((campo) => campo.campo === definicion.campo)
          return {
            campo: definicion.campo,
            etiqueta: definicion.etiqueta,
            incluido: Boolean(actual) || definicion.campo === 'NOMBRE',
            obligatorio: definicion.campo === 'NOMBRE' ? true : Boolean(actual?.obligatorio),
            longitudMaxima: actual?.longitudMaxima ?? definicion.max,
            orden: actual?.orden ?? indice + 1,
          }
        }))
        setEvidencias(tipos.map((tipo, indice) => {
          const actual = requisitos.evidencias.find(
            (item) => item.idTipoEvidencia === tipo.idTipoEvidencia,
          )
          return {
            idTipoEvidencia: tipo.idTipoEvidencia,
            nombre: tipo.nombre,
            codigo: tipo.codigo,
            incluido: Boolean(actual),
            obligatorio: Boolean(actual?.obligatorio),
            cantidadMinima: actual?.cantidadMinima ?? 0,
            cantidadMaxima: actual?.cantidadMaxima ?? 1,
            orden: actual?.orden ?? indice + 1,
          }
        }))
      })
      .catch((fallo) => {
        if (activo) setRequisitosError(mensajeDeError(fallo))
      })
      .finally(() => {
        if (activo) setCargandoDetalle(false)
      })
    return () => {
      activo = false
    }
  }, [seleccionada, tipos])

  async function recargarCategorias() {
    const lista = await listarCategoriasAdmin()
    setCategorias(lista)
    setSeleccionada((actual) =>
      lista.some((categoria) => categoria.idCategoria === actual)
        ? actual
        : lista.find((categoria) => categoria.activa)?.idCategoria ?? null)
  }

  async function guardarCategoria(evento) {
    evento.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')
    const datos = {
      nombre: categoriaForm.nombre,
      descripcion: categoriaForm.descripcion,
      activa: categoriaForm.activa,
    }
    try {
      const guardada = categoriaForm.idCategoria
        ? await actualizarCategoria(categoriaForm.idCategoria, datos)
        : await crearCategoria(datos)
      setMensaje(`Categoría ${guardada.nombre} guardada.`)
      setCategoriaForm(CATEGORIA_INICIAL)
      await recargarCategorias()
    } catch (fallo) {
      const camposError = erroresDeCampo(fallo)
      setError(camposError.nombre || mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function guardarMarca(evento) {
    evento.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')
    const datos = { nombre: marcaForm.nombre, activa: marcaForm.activa }
    try {
      const guardada = marcaForm.idMarca
        ? await actualizarMarca(marcaForm.idMarca, datos)
        : await crearMarca(datos)
      setMensaje(`Marca ${guardada.nombre} guardada.`)
      setMarcaForm(MARCA_INICIAL)
      setMarcas(await listarMarcasAdmin())
    } catch (fallo) {
      const camposError = erroresDeCampo(fallo)
      setError(camposError.nombre || mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function alternarMarca(idMarca, activa) {
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      await vincularMarca(seleccionada, idMarca, activa)
      setCategoriaMarcas(await listarCategoriaMarcas(seleccionada))
      setMensaje('Relación categoría-marca actualizada.')
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function guardarCriterio(evento) {
    evento.preventDefault()
    if (!seleccionada) return
    setGuardando(true)
    setError('')
    setMensaje('')
    const datos = {
      nombre: criterioForm.nombre,
      descripcion: criterioForm.descripcion,
      tipoDato: criterioForm.tipoDato,
      obligatorio: criterioForm.obligatorio,
      orden: Number(criterioForm.orden),
      activo: criterioForm.activo,
    }
    try {
      if (criterioForm.idCriterio) {
        await actualizarCriterio(criterioForm.idCriterio, datos)
      } else {
        await crearCriterio(seleccionada, datos)
      }
      setMensaje('Criterio guardado.')
      setCriterioForm(CRITERIO_INICIAL)
      setCriterios(await listarCriterios(seleccionada))
    } catch (fallo) {
      const camposError = erroresDeCampo(fallo)
      setError(camposError.nombre || mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  function editarCriterio(criterio) {
    setCriterioForm({
      idCriterio: criterio.idCriterio,
      nombre: criterio.nombre,
      descripcion: criterio.descripcion ?? '',
      tipoDato: criterio.tipoDato,
      obligatorio: criterio.obligatorio,
      orden: criterio.orden,
      activo: criterio.activo,
    })
    setError('')
    setMensaje('')
  }

  function cambiarCampo(campo, clave, valor) {
    setCampos((actual) => actual.map((item) =>
      item.campo === campo ? { ...item, [clave]: valor } : item))
  }

  function cambiarEvidencia(idTipoEvidencia, clave, valor) {
    setEvidencias((actual) => actual.map((item) =>
      item.idTipoEvidencia === idTipoEvidencia ? { ...item, [clave]: valor } : item))
  }

  async function guardarRequisitos() {
    if (!seleccionada) return
    setGuardando(true)
    setRequisitosError('')
    setMensaje('')
    const datos = {
      campos: campos
        .filter((campo) => campo.incluido)
        .map((campo) => ({
          campo: campo.campo,
          obligatorio: campo.campo === 'NOMBRE' ? true : campo.obligatorio,
          longitudMaxima: campo.campo === 'MARCA' ? null : Number(campo.longitudMaxima),
          orden: Number(campo.orden),
        })),
      evidencias: evidencias
        .filter((evidencia) => evidencia.incluido)
        .map((evidencia) => ({
          idTipoEvidencia: evidencia.idTipoEvidencia,
          obligatorio: evidencia.obligatorio,
          cantidadMinima: Number(evidencia.cantidadMinima),
          cantidadMaxima: Number(evidencia.cantidadMaxima),
          orden: Number(evidencia.orden),
        })),
    }
    try {
      const guardados = await actualizarRequisitos(seleccionada, datos)
      setCampos(CAMPOS.map((definicion, indice) => {
        const actual = guardados.campos.find((campo) => campo.campo === definicion.campo)
        return {
          campo: definicion.campo,
          etiqueta: definicion.etiqueta,
          incluido: Boolean(actual) || definicion.campo === 'NOMBRE',
          obligatorio: definicion.campo === 'NOMBRE' ? true : Boolean(actual?.obligatorio),
          longitudMaxima: actual?.longitudMaxima ?? definicion.max,
          orden: actual?.orden ?? indice + 1,
        }
      }))
      setEvidencias(tipos.map((tipo, indice) => {
        const actual = guardados.evidencias.find(
          (item) => item.idTipoEvidencia === tipo.idTipoEvidencia,
        )
        return {
          idTipoEvidencia: tipo.idTipoEvidencia,
          nombre: tipo.nombre,
          codigo: tipo.codigo,
          incluido: Boolean(actual),
          obligatorio: Boolean(actual?.obligatorio),
          cantidadMinima: actual?.cantidadMinima ?? 0,
          cantidadMaxima: actual?.cantidadMaxima ?? 1,
          orden: actual?.orden ?? indice + 1,
        }
      }))
      setMensaje('Requisitos de la categoría guardados.')
    } catch (fallo) {
      const camposError = erroresDeCampo(fallo)
      setRequisitosError(camposError.campos || camposError.evidencias ||
        mensajeDeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <PageLoader label="Cargando catálogo…" />

  const categoriaActual = categorias.find(
    (categoria) => categoria.idCategoria === seleccionada,
  )

  return (
    <div className="admin-section">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Catálogo</h1>
          <p>Categorías, marcas, criterios y requisitos que usa la evaluación.</p>
        </div>
      </header>

      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      {mensaje ? <div className="alert alert-success" role="status">{mensaje}</div> : null}

      <div className="admin-split">
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="box" size={22} /></span>
            <div>
              <p className="card-kicker">Catálogo</p>
              <h2>Categorías</h2>
            </div>
          </div>
          <ul className="admin-list">
            {categorias.map((categoria) => (
              <li key={categoria.idCategoria}>
                <button
                  className={`admin-list-item${seleccionada === categoria.idCategoria ? ' is-selected' : ''}`}
                  onClick={() => {
                    setCargandoDetalle(true)
                    setRequisitosError('')
                    setSeleccionada(categoria.idCategoria)
                  }}
                  type="button"
                >
                  <span>
                    <strong>{categoria.nombre}</strong>
                    <small>{categoria.descripcion ?? 'Sin descripción'}</small>
                  </span>
                  <span className="badge badge-neutral">
                    {categoria.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </button>
                <button
                  aria-label={`Editar ${categoria.nombre}`}
                  className="icon-button"
                  onClick={() => setCategoriaForm({
                    idCategoria: categoria.idCategoria,
                    nombre: categoria.nombre,
                    descripcion: categoria.descripcion ?? '',
                    activa: categoria.activa,
                  })}
                  type="button"
                >
                  <Icon name="edit" size={16} />
                </button>
              </li>
            ))}
          </ul>

          <form className="compact-form" onSubmit={guardarCategoria}>
            <h3>{categoriaForm.idCategoria ? 'Editar categoría' : 'Nueva categoría'}</h3>
            <div className="field">
              <label htmlFor="categoriaNombre">Nombre</label>
              <input
                id="categoriaNombre"
                maxLength={100}
                onChange={(evento) => setCategoriaForm((actual) => ({
                  ...actual, nombre: evento.target.value,
                }))}
                value={categoriaForm.nombre}
              />
            </div>
            <div className="field">
              <label htmlFor="categoriaDescripcion">Descripción</label>
              <textarea
                id="categoriaDescripcion"
                maxLength={300}
                onChange={(evento) => setCategoriaForm((actual) => ({
                  ...actual, descripcion: evento.target.value,
                }))}
                rows={2}
                value={categoriaForm.descripcion}
              />
            </div>
            <label className="check-row">
              <input
                checked={categoriaForm.activa}
                onChange={(evento) => setCategoriaForm((actual) => ({
                  ...actual, activa: evento.target.checked,
                }))}
                type="checkbox"
              />
              Activa para nuevas solicitudes
            </label>
            <div className="form-actions">
              {categoriaForm.idCategoria ? (
                <button className="button button-quiet" onClick={() => setCategoriaForm(CATEGORIA_INICIAL)} type="button">
                  Cancelar
                </button>
              ) : null}
              <button className="button button-primary" disabled={guardando} type="submit">
                <Icon name="save" size={16} /> Guardar categoría
              </button>
            </div>
          </form>
        </section>

        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon"><Icon name="settings" size={22} /></span>
            <div>
              <p className="card-kicker">Marcas</p>
              <h2>Marcas y vínculos</h2>
            </div>
          </div>
          <ul className="admin-list">
            {marcas.map((marca) => (
              <li key={marca.idMarca}>
                <span className="admin-list-static">
                  <strong>{marca.nombre}</strong>
                  <small>{marca.activa ? 'Activa' : 'Inactiva'}</small>
                </span>
                <button
                  aria-label={`Editar ${marca.nombre}`}
                  className="icon-button"
                  onClick={() => setMarcaForm({
                    idMarca: marca.idMarca,
                    nombre: marca.nombre,
                    activa: marca.activa,
                  })}
                  type="button"
                >
                  <Icon name="edit" size={16} />
                </button>
              </li>
            ))}
          </ul>

          <form className="compact-form" onSubmit={guardarMarca}>
            <h3>{marcaForm.idMarca ? 'Editar marca' : 'Nueva marca'}</h3>
            <div className="field">
              <label htmlFor="marcaNombre">Nombre</label>
              <input
                id="marcaNombre"
                maxLength={100}
                onChange={(evento) => setMarcaForm((actual) => ({
                  ...actual, nombre: evento.target.value,
                }))}
                value={marcaForm.nombre}
              />
            </div>
            <label className="check-row">
              <input
                checked={marcaForm.activa}
                onChange={(evento) => setMarcaForm((actual) => ({
                  ...actual, activa: evento.target.checked,
                }))}
                type="checkbox"
              />
              Marca activa
            </label>
            <div className="form-actions">
              {marcaForm.idMarca ? (
                <button className="button button-quiet" onClick={() => setMarcaForm(MARCA_INICIAL)} type="button">
                  Cancelar
                </button>
              ) : null}
              <button className="button button-primary" disabled={guardando} type="submit">
                <Icon name="save" size={16} /> Guardar marca
              </button>
            </div>
          </form>

          {seleccionada ? (
            <div className="compact-form">
              <h3>Marcas de {categoriaActual?.nombre}</h3>
              {marcas.map((marca) => {
                const vinculo = categoriaMarcas.find(
                  (item) => item.idMarca === marca.idMarca,
                )
                return (
                  <label className="check-row" key={marca.idMarca}>
                    <input
                      checked={Boolean(vinculo?.activa)}
                      disabled={guardando || !marca.activa}
                      onChange={(evento) => alternarMarca(marca.idMarca, evento.target.checked)}
                      type="checkbox"
                    />
                    {marca.nombre}
                    {!marca.activa ? ' (inactiva)' : ''}
                  </label>
                )
              })}
            </div>
          ) : null}
        </section>
      </div>

      {seleccionada ? (
        <div className="admin-split">
          <section className="panel-card">
            <div className="panel-card-heading">
              <span className="feature-icon"><Icon name="clipboard" size={22} /></span>
              <div>
                <p className="card-kicker">Criterios</p>
                <h2>Evaluación de {categoriaActual?.nombre}</h2>
              </div>
            </div>
            {cargandoDetalle ? (
              <PageLoader compact label="Cargando criterios…" />
            ) : criterios.length === 0 ? (
              <EmptyState
                compact
                description="Crea criterios para que el especialista evalúe esta categoría."
                icon="clipboard"
                title="Sin criterios"
              />
            ) : (
              <ul className="admin-list">
                {criterios.map((criterio) => (
                  <li key={criterio.idCriterio}>
                    <span className="admin-list-static">
                      <strong>{criterio.nombre}</strong>
                      <small>
                        {criterio.tipoDato} · orden {criterio.orden} ·{' '}
                        {criterio.obligatorio ? 'obligatorio' : 'opcional'} ·{' '}
                        {criterio.activo ? 'activo' : 'inactivo'} · {criterio.resultados} resultados
                      </small>
                    </span>
                    <button
                      aria-label={`Editar ${criterio.nombre}`}
                      className="icon-button"
                      onClick={() => editarCriterio(criterio)}
                      type="button"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form className="compact-form" onSubmit={guardarCriterio}>
              <h3>{criterioForm.idCriterio ? 'Editar criterio' : 'Nuevo criterio'}</h3>
              <div className="field">
                <label htmlFor="criterioNombre">Nombre</label>
                <input
                  id="criterioNombre"
                  maxLength={150}
                  onChange={(evento) => setCriterioForm((actual) => ({
                    ...actual, nombre: evento.target.value,
                  }))}
                  value={criterioForm.nombre}
                />
              </div>
              <div className="field">
                <label htmlFor="criterioDescripcion">Descripción</label>
                <textarea
                  id="criterioDescripcion"
                  maxLength={500}
                  onChange={(evento) => setCriterioForm((actual) => ({
                    ...actual, descripcion: evento.target.value,
                  }))}
                  rows={2}
                  value={criterioForm.descripcion}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="criterioTipo">Tipo</label>
                  <select
                    id="criterioTipo"
                    onChange={(evento) => setCriterioForm((actual) => ({
                      ...actual, tipoDato: evento.target.value,
                    }))}
                    value={criterioForm.tipoDato}
                  >
                    {TIPOS_CRITERIO.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="criterioOrden">Orden</label>
                  <input
                    id="criterioOrden"
                    min="1"
                    onChange={(evento) => setCriterioForm((actual) => ({
                      ...actual, orden: evento.target.value,
                    }))}
                    type="number"
                    value={criterioForm.orden}
                  />
                </div>
              </div>
              <label className="check-row">
                <input
                  checked={criterioForm.obligatorio}
                  onChange={(evento) => setCriterioForm((actual) => ({
                    ...actual, obligatorio: evento.target.checked,
                  }))}
                  type="checkbox"
                />
                Obligatorio
              </label>
              <label className="check-row">
                <input
                  checked={criterioForm.activo}
                  onChange={(evento) => setCriterioForm((actual) => ({
                    ...actual, activo: evento.target.checked,
                  }))}
                  type="checkbox"
                />
                Activo
              </label>
              <div className="form-actions">
                {criterioForm.idCriterio ? (
                  <button className="button button-quiet" onClick={() => setCriterioForm(CRITERIO_INICIAL)} type="button">
                    Cancelar
                  </button>
                ) : null}
                <button className="button button-primary" disabled={guardando} type="submit">
                  <Icon name="save" size={16} /> Guardar criterio
                </button>
              </div>
            </form>
          </section>

          <section className="panel-card">
            <div className="panel-card-heading">
              <span className="feature-icon"><Icon name="certificate" size={22} /></span>
              <div>
                <p className="card-kicker">Requisitos</p>
                <h2>Campos y evidencia</h2>
              </div>
            </div>
            {cargandoDetalle ? (
              <PageLoader compact label="Cargando requisitos…" />
            ) : (
              <>
                {requisitosError ? (
                  <div className="alert alert-error" role="alert">{requisitosError}</div>
                ) : null}
                <h3>Campos del producto</h3>
                <div className="requirements-grid">
                  {campos.map((campo) => (
                    <div className="requirement-row" key={campo.campo}>
                      <label className="check-row">
                        <input
                          checked={campo.incluido}
                          disabled={campo.campo === 'NOMBRE'}
                          onChange={(evento) => cambiarCampo(
                            campo.campo, 'incluido', evento.target.checked)}
                          type="checkbox"
                        />
                        {campo.etiqueta}
                      </label>
                      {campo.incluido && campo.campo !== 'MARCA' ? (
                        <>
                          <label className="check-row">
                            <input
                              checked={campo.obligatorio}
                              disabled={campo.campo === 'NOMBRE'}
                              onChange={(evento) => cambiarCampo(
                                campo.campo, 'obligatorio', evento.target.checked)}
                              type="checkbox"
                            />
                            Obligatorio
                          </label>
                          <input
                            aria-label={`Longitud máxima de ${campo.etiqueta}`}
                            min="1"
                            onChange={(evento) => cambiarCampo(
                              campo.campo, 'longitudMaxima', evento.target.value)}
                            type="number"
                            value={campo.longitudMaxima}
                          />
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
                <h3>Evidencia</h3>
                <div className="requirements-grid">
                  {evidencias.map((evidencia) => (
                    <div className="requirement-row" key={evidencia.idTipoEvidencia}>
                      <label className="check-row">
                        <input
                          checked={evidencia.incluido}
                          onChange={(evento) => cambiarEvidencia(
                            evidencia.idTipoEvidencia, 'incluido', evento.target.checked)}
                          type="checkbox"
                        />
                        {evidencia.nombre}
                      </label>
                      {evidencia.incluido ? (
                        <>
                          <label className="check-row">
                            <input
                              checked={evidencia.obligatorio}
                              onChange={(evento) => cambiarEvidencia(
                                evidencia.idTipoEvidencia, 'obligatorio', evento.target.checked)}
                              type="checkbox"
                            />
                            Obligatoria
                          </label>
                          <input
                            aria-label={`Mínimo de ${evidencia.nombre}`}
                            min="0"
                            onChange={(evento) => cambiarEvidencia(
                              evidencia.idTipoEvidencia, 'cantidadMinima', evento.target.value)}
                            type="number"
                            value={evidencia.cantidadMinima}
                          />
                          <input
                            aria-label={`Máximo de ${evidencia.nombre}`}
                            min="1"
                            onChange={(evento) => cambiarEvidencia(
                              evidencia.idTipoEvidencia, 'cantidadMaxima', evento.target.value)}
                            type="number"
                            value={evidencia.cantidadMaxima}
                          />
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button className="button button-primary" disabled={guardando} onClick={guardarRequisitos} type="button">
                    <Icon name="save" size={16} /> Guardar requisitos
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
