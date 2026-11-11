import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EvidencePreview } from '../components/EvidencePreview'
import { Icon } from '../components/Icon'
import { InlineError, PageLoader } from '../components/PageState'
import { StatusBadge } from '../components/StatusBadge'
import { Stepper } from '../components/Stepper'
import { TextField } from '../components/TextField'
import { listarCategorias, listarMarcas, obtenerRequisitos } from '../features/catalog/catalog.api'
import {
  crearSolicitud,
  enviarSolicitud,
  obtenerSolicitud,
  subirEvidencia,
} from '../features/solicitudes/solicitudes.api'
import { erroresDeCampo, mensajeDeError } from '../lib/errors'

const PASOS = ['Categoría', 'Producto', 'Evidencia', 'Revisión']
const MAX_ARCHIVO = 8 * 1024 * 1024
const EXTENSIONES = ['.jpg', '.jpeg', '.png', '.webp']

const CAMPOS = [
  { clave: 'nombre', campo: 'NOMBRE', etiqueta: 'Nombre del producto', max: 150, obligatorio: true },
  { clave: 'modelo', campo: 'MODELO', etiqueta: 'Modelo', max: 150 },
  { clave: 'sku', campo: 'SKU', etiqueta: 'SKU', max: 80 },
  { clave: 'numeroSerie', campo: 'NUMERO_SERIE', etiqueta: 'Número de serie', max: 120 },
  { clave: 'imei', campo: 'IMEI', etiqueta: 'IMEI', max: 30 },
  { clave: 'accesorios', campo: 'ACCESORIOS', etiqueta: 'Accesorios', max: 500 },
  { clave: 'descripcion', campo: 'DESCRIPCION', etiqueta: 'Descripción', max: 1000, multilinea: true },
]

function claveIdempotencia() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function validarProducto(formulario, requisitos) {
  const errores = {}
  for (const definicion of CAMPOS) {
    const requisito = requisitos?.campos?.find((item) => item.campo === definicion.campo)
    const obligatorio = requisito?.obligatorio ?? definicion.obligatorio
    const valor = formulario[definicion.clave]?.trim() ?? ''
    const max = requisito?.longitudMaxima || definicion.max
    if (obligatorio && !valor) {
      errores[definicion.clave] = `${definicion.etiqueta} es obligatorio.`
    } else if (valor.length > max) {
      errores[definicion.clave] = `${definicion.etiqueta} admite hasta ${max} caracteres.`
    }
  }
  if ((formulario.observaciones ?? '').trim().length > 1000) {
    errores.observaciones = 'Las observaciones admiten hasta 1000 caracteres.'
  }
  return errores
}

export function NewEvaluationPage() {
  const [searchParams] = useSearchParams()
  const borradorId = Number(searchParams.get('borrador'))
  const claveRef = useRef(claveIdempotencia())
  const [categorias, setCategorias] = useState([])
  const [categoriaId, setCategoriaId] = useState(null)
  const [marcas, setMarcas] = useState([])
  const [requisitos, setRequisitos] = useState(null)
  const [formulario, setFormulario] = useState({
    nombre: '',
    modelo: '',
    sku: '',
    numeroSerie: '',
    imei: '',
    accesorios: '',
    descripcion: '',
    observaciones: '',
    idMarca: '',
  })
  const [paso, setPaso] = useState(1)
  const [draft, setDraft] = useState(null)
  const [evidencias, setEvidencias] = useState([])
  const [descripciones, setDescripciones] = useState({})
  const [subiendo, setSubiendo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [resultado, setResultado] = useState(null)

  const cargarCategoria = useCallback(async (id) => {
    const [marcasCategoria, requisitosCategoria] = await Promise.all([
      listarMarcas(id),
      obtenerRequisitos(id),
    ])
    setMarcas(marcasCategoria)
    setRequisitos(requisitosCategoria)
  }, [])

  useEffect(() => {
    let activo = true

    async function cargar() {
      setCargando(true)
      setErrorGeneral('')
      try {
        const lista = await listarCategorias()
        if (!activo) return
        setCategorias(lista)

        if (borradorId > 0) {
          const detalle = await obtenerSolicitud(borradorId)
          if (!activo) return
          if (!detalle.esBorrador) {
            setErrorGeneral('Esta solicitud ya fue enviada. Puedes consultarla en Mis solicitudes.')
            return
          }
          setDraft(detalle)
          setCategoriaId(detalle.idCategoria)
          setEvidencias(detalle.evidencias ?? [])
          setFormulario({
            nombre: detalle.nombreProducto ?? '',
            modelo: detalle.modelo ?? '',
            sku: detalle.sku ?? '',
            numeroSerie: detalle.numeroSerie ?? '',
            imei: detalle.imei ?? '',
            accesorios: detalle.accesorios ?? '',
            descripcion: detalle.descripcion ?? '',
            observaciones: detalle.observaciones ?? '',
            idMarca: detalle.idMarca ? String(detalle.idMarca) : '',
          })
          await cargarCategoria(detalle.idCategoria)
          if (activo) setPaso(3)
        }
      } catch (error) {
        if (activo) setErrorGeneral(mensajeDeError(error))
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [borradorId, cargarCategoria])

  const camposRequeridos = useMemo(() => {
    const requeridos = new Set(['NOMBRE'])
    requisitos?.campos?.filter((campo) => campo.obligatorio).forEach((campo) => requeridos.add(campo.campo))
    return requeridos
  }, [requisitos])

  const evidenciaRequeridaCompleta = useMemo(() => {
    if (!requisitos?.evidencias?.length) return false
    return requisitos.evidencias
      .filter((tipo) => tipo.obligatorio && tipo.cantidadMinima > 0)
      .every((tipo) =>
        evidencias.filter((evidencia) => evidencia.idTipoEvidencia === tipo.idTipoEvidencia).length >=
        tipo.cantidadMinima)
  }, [evidencias, requisitos])

  function cambiar(campo) {
    return (evento) => {
      setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))
      setErrores((actual) => ({ ...actual, [campo]: undefined }))
      setErrorGeneral('')
    }
  }

  async function seleccionarCategoria(idCategoria) {
    setCategoriaId(idCategoria)
    setRequisitos(null)
    setMarcas([])
    setErrores({})
    setErrorGeneral('')
    try {
      await cargarCategoria(idCategoria)
      setPaso(2)
    } catch (error) {
      setErrorGeneral(mensajeDeError(error))
    }
  }

  async function continuarProducto() {
    const validacion = validarProducto(formulario, requisitos)
    setErrores(validacion)
    setErrorGeneral('')
    if (Object.keys(validacion).length > 0) return

    if (draft) {
      setPaso(3)
      return
    }

    setGuardando(true)
    try {
      const creada = await crearSolicitud(
        {
          idCategoria: categoriaId,
          idMarca: formulario.idMarca ? Number(formulario.idMarca) : null,
          nombre: formulario.nombre.trim(),
          modelo: formulario.modelo.trim() || null,
          sku: formulario.sku.trim() || null,
          numeroSerie: formulario.numeroSerie.trim() || null,
          imei: formulario.imei.trim() || null,
          accesorios: formulario.accesorios.trim() || null,
          descripcion: formulario.descripcion.trim() || null,
          observaciones: formulario.observaciones.trim() || null,
        },
        claveRef.current,
      )
      setDraft(creada)
      setPaso(3)
    } catch (error) {
      const campos = erroresDeCampo(error)
      setErrores(campos)
      if (Object.keys(campos).length === 0) setErrorGeneral(mensajeDeError(error))
    } finally {
      setGuardando(false)
    }
  }

  async function subirArchivo(tipo, archivo) {
    if (!draft || !archivo) return
    const extension = archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase()
    if (!EXTENSIONES.includes(extension)) {
      setErrorGeneral('Solo se permiten imágenes JPG, PNG o WEBP.')
      return
    }
    if (archivo.size <= 0 || archivo.size > MAX_ARCHIVO) {
      setErrorGeneral('La imagen debe pesar entre 1 byte y 8 MB.')
      return
    }

    setSubiendo(tipo.idTipoEvidencia)
    setErrorGeneral('')
    try {
      const evidencia = await subirEvidencia(
        draft.idSolicitud,
        tipo.idTipoEvidencia,
        archivo,
        descripciones[tipo.idTipoEvidencia],
      )
      setEvidencias((actual) => [...actual, evidencia])
    } catch (error) {
      setErrorGeneral(mensajeDeError(error))
    } finally {
      setSubiendo(null)
    }
  }

  async function confirmarEnvio() {
    if (!draft) return
    setGuardando(true)
    setErrorGeneral('')
    setErrores({})
    try {
      const enviada = await enviarSolicitud(draft.idSolicitud)
      setResultado(enviada)
      setPaso(5)
    } catch (error) {
      const campos = erroresDeCampo(error)
      setErrores(campos)
      if (Object.keys(campos).length === 0) setErrorGeneral(mensajeDeError(error))
    } finally {
      setGuardando(false)
    }
  }

  function renderEvidencia(tipo) {
    const lista = evidencias.filter((evidencia) => evidencia.idTipoEvidencia === tipo.idTipoEvidencia)
    const maximo = Math.max(1, tipo.cantidadMaxima)
    const minimo = tipo.cantidadMinima
    const alcanzado = lista.length >= maximo
    return (
      <article className="evidence-requirement" key={tipo.idTipoEvidencia}>
        <div className="evidence-requirement-head">
          <div>
            <h3>{tipo.nombre}</h3>
            <p>
              {tipo.obligatorio ? `Obligatoria · mínimo ${minimo}` : 'Opcional'}
              {' · '}máximo {maximo}
            </p>
          </div>
          <span className={`badge ${lista.length >= minimo ? 'badge-success' : 'badge-warn'}`}>
            {lista.length}/{maximo}
          </span>
        </div>
        {lista.length > 0 ? (
          <div className="evidence-grid">
            {lista.map((evidencia) => (
              <EvidencePreview
                evidencia={evidencia}
                idSolicitud={draft.idSolicitud}
                key={evidencia.idEvidencia}
              />
            ))}
          </div>
        ) : null}
        {!alcanzado ? (
          <div className="upload-control">
            <input
              accept="image/jpeg,image/png,image/webp"
              disabled={subiendo === tipo.idTipoEvidencia}
              id={`evidencia-${tipo.idTipoEvidencia}`}
              onChange={(evento) => {
                const archivo = evento.target.files?.[0]
                evento.target.value = ''
                subirArchivo(tipo, archivo)
              }}
              type="file"
            />
            <button
              className="button button-secondary"
              disabled={subiendo === tipo.idTipoEvidencia}
              onClick={() => document.getElementById(`evidencia-${tipo.idTipoEvidencia}`)?.click()}
              type="button"
            >
              {subiendo === tipo.idTipoEvidencia ? (
                <><span className="spinner spinner-small" /> Subiendo…</>
              ) : (
                <><Icon name="certificate" size={17} /> Añadir imagen</>
              )}
            </button>
            <input
              aria-label={`Descripción de ${tipo.nombre}`}
              className="evidence-description"
              onChange={(evento) => setDescripciones((actual) => ({
                ...actual,
                [tipo.idTipoEvidencia]: evento.target.value,
              }))}
              placeholder="Descripción opcional"
              value={descripciones[tipo.idTipoEvidencia] ?? ''}
            />
          </div>
        ) : (
          <p className="field-hint">Se alcanzó el máximo para este tipo.</p>
        )}
      </article>
    )
  }

  const evidenciasRequeridas = requisitos?.evidencias?.filter((tipo) => tipo.obligatorio) ?? []
  const evidenciasOpcionales = requisitos?.evidencias?.filter((tipo) => !tipo.obligatorio) ?? []
  const categoriaSeleccionada = categorias.find(
    (categoria) => categoria.idCategoria === categoriaId,
  )
  const marcaSeleccionada = marcas.find(
    (marca) => String(marca.idMarca) === formulario.idMarca,
  )
  const datosRevision = [
    { etiqueta: 'Producto', valor: formulario.nombre },
    { etiqueta: 'Categoría', valor: categoriaSeleccionada?.nombre },
    { etiqueta: 'Marca', valor: marcaSeleccionada?.nombre },
    { etiqueta: 'Modelo', valor: formulario.modelo },
    { etiqueta: 'SKU', valor: formulario.sku },
    { etiqueta: 'Número de serie', valor: formulario.numeroSerie },
    { etiqueta: 'IMEI', valor: formulario.imei },
    { etiqueta: 'Accesorios', valor: formulario.accesorios },
    { etiqueta: 'Descripción', valor: formulario.descripcion, ancho: true },
    { etiqueta: 'Observaciones', valor: formulario.observaciones, ancho: true },
  ].filter((dato) => dato.valor)

  if (cargando) return <PageLoader label="Preparando tu nueva evaluación…" />

  if (resultado) {
    return (
      <div className="workspace-page">
        <section className="success-panel">
          <span className="success-icon">
            <Icon name="check" size={30} />
          </span>
          <p className="eyebrow">Solicitud enviada</p>
          <h1>Tu evaluación ya está en cola.</h1>
          <p>
            Folio <strong>{resultado.folio}</strong>. Estado
            <StatusBadge codigo={resultado.estadoCodigo} />. Recibirás novedades en Mis
            solicitudes.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to={`/app/solicitudes/${resultado.idSolicitud}`}>
              Ver el detalle
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link className="button button-secondary" to="/app/solicitudes">
              Mis solicitudes
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Solicitud</p>
          <h1>Nueva evaluación</h1>
          <p>Completa los datos en cuatro pasos.</p>
        </div>
        <Link className="button button-quiet" to="/app/solicitudes">
          <Icon name="arrow-left" size={16} /> Mis solicitudes
        </Link>
      </header>

      <Stepper paso={paso} pasos={PASOS} />

      {errorGeneral ? <InlineError>{errorGeneral}</InlineError> : null}

      {paso === 1 ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon">
              <Icon name="box" size={23} />
            </span>
            <div>
              <p className="card-kicker">Paso 1</p>
              <h2>Elige una categoría</h2>
            </div>
          </div>
          <p className="panel-note">
            Los campos y la evidencia dependen de la categoría.
          </p>
          {categorias.length === 0 ? (
            <div className="empty-state compact">
              <h2>No hay categorías disponibles</h2>
              <p>Intenta de nuevo más tarde.</p>
            </div>
          ) : (
            <div className="category-grid">
              {categorias.map((categoria) => (
                <button
                  className={`category-option${categoriaId === categoria.idCategoria ? ' is-selected' : ''}`}
                  key={categoria.idCategoria}
                  onClick={() => seleccionarCategoria(categoria.idCategoria)}
                  type="button"
                >
                  <span className="category-option-icon">
                    <Icon name="box" size={21} />
                  </span>
                  <span>
                    <strong>{categoria.nombre}</strong>
                    <small>{categoria.descripcion ?? 'Categoría de producto'}</small>
                  </span>
                  <Icon name="arrow-right" size={17} />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {paso === 2 ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon">
              <Icon name="clipboard" size={23} />
            </span>
            <div>
              <p className="card-kicker">Paso 2</p>
              <h2>Datos del producto</h2>
            </div>
            <span className="badge badge-neutral">{categoriaSeleccionada?.nombre}</span>
          </div>

          {draft ? (
            <p className="alert alert-success">
              <Icon name="check" size={18} />
              Este producto ya está guardado. Para editarlo, inicia una nueva evaluación.
            </p>
          ) : null}

          <div className="product-form-grid">
            {CAMPOS.map((definicion) => {
              const obligatorio = camposRequeridos.has(definicion.campo)
              const max = requisitos?.campos?.find((item) => item.campo === definicion.campo)?.longitudMaxima
                ?? definicion.max
              if (definicion.multilinea) {
                return (
                  <div className="field field-wide" key={definicion.clave}>
                    <label htmlFor={definicion.clave}>
                      {definicion.etiqueta}{obligatorio ? ' *' : ''}
                    </label>
                    <textarea
                      aria-invalid={Boolean(errores[definicion.clave])}
                      aria-required={obligatorio}
                      disabled={Boolean(draft)}
                      id={definicion.clave}
                      maxLength={max}
                      onChange={cambiar(definicion.clave)}
                      placeholder="Describe el producto brevemente"
                      rows={4}
                      value={formulario[definicion.clave]}
                    />
                    {errores[definicion.clave] ? (
                      <p className="field-error" role="alert">{errores[definicion.clave]}</p>
                    ) : null}
                  </div>
                )
              }
              return (
                <TextField
                  disabled={Boolean(draft)}
                  error={errores[definicion.clave]}
                  id={definicion.clave}
                  key={definicion.clave}
                  label={`${definicion.etiqueta}${obligatorio ? ' *' : ''}`}
                  onChange={cambiar(definicion.clave)}
                  required={obligatorio}
                  value={formulario[definicion.clave]}
                />
              )
            })}

            <div className="field">
              <label htmlFor="idMarca">Marca {camposRequeridos.has('MARCA') ? '*' : ''}</label>
              <select
                aria-required={camposRequeridos.has('MARCA')}
                disabled={Boolean(draft) || marcas.length === 0}
                id="idMarca"
                onChange={cambiar('idMarca')}
                value={formulario.idMarca}
              >
                <option value="">Sin marca</option>
                {marcas.map((marca) => (
                  <option key={marca.idMarca} value={marca.idMarca}>{marca.nombre}</option>
                ))}
              </select>
              {marcas.length === 0 ? (
                <p className="field-hint">No hay marcas disponibles para esta categoría.</p>
              ) : null}
            </div>

            <div className="field field-wide">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                aria-required={false}
                disabled={Boolean(draft)}
                id="observaciones"
                maxLength={1000}
                onChange={cambiar('observaciones')}
                placeholder="Opcional"
                rows={3}
                value={formulario.observaciones}
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="button button-secondary" onClick={() => setPaso(1)} type="button">
              <Icon name="arrow-left" size={17} /> Categoría
            </button>
            <button className="button button-primary" disabled={guardando} onClick={continuarProducto} type="button">
              {guardando ? <><span className="spinner spinner-small" /> Guardando…</> : <>Continuar a evidencia <Icon name="arrow-right" size={18} /></>}
            </button>
          </div>
        </section>
      ) : null}

      {paso === 3 ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon">
              <Icon name="certificate" size={23} />
            </span>
            <div>
              <p className="card-kicker">Paso 3</p>
              <h2>Adjunta la evidencia</h2>
            </div>
            {evidenciaRequeridaCompleta ? (
              <span className="badge badge-success"><Icon name="check" size={14} /> Completa</span>
            ) : (
              <span className="badge badge-warn"><Icon name="alert" size={14} /> Faltan imágenes</span>
            )}
          </div>
          <p className="panel-note">
            Tus imágenes son privadas y solo tú puedes verlas.
          </p>

          {requisitos?.evidencias?.length ? (
            <div className="evidence-requirements">
              {evidenciasRequeridas.map(renderEvidencia)}
              {evidenciasOpcionales.length > 0 ? (
                <details className="optional-evidence">
                  <summary>
                    Evidencia opcional
                    <span>{evidenciasOpcionales.length} tipos</span>
                  </summary>
                  <div className="evidence-requirements">
                    {evidenciasOpcionales.map(renderEvidencia)}
                  </div>
                </details>
              ) : null}
            </div>
          ) : (
            <div className="alert alert-error" role="alert">
              <Icon name="alert" size={18} />
              Esta categoría no tiene requisitos de evidencia. No se puede enviar.
            </div>
          )}

          <div className="form-actions">
            <button className="button button-secondary" disabled={Boolean(draft)} onClick={() => setPaso(2)} type="button">
              <Icon name="arrow-left" size={17} /> Producto
            </button>
            <button
              className="button button-primary"
              disabled={!evidenciaRequeridaCompleta || Boolean(subiendo)}
              onClick={() => setPaso(4)}
              type="button"
            >
              Revisar solicitud <Icon name="arrow-right" size={18} />
            </button>
          </div>
        </section>
      ) : null}

      {paso === 4 ? (
        <section className="panel-card">
          <div className="panel-card-heading">
            <span className="feature-icon">
              <Icon name="check" size={23} />
            </span>
            <div>
              <p className="card-kicker">Paso 4</p>
              <h2>Revisa antes de enviar</h2>
            </div>
          </div>
          <dl className="review-grid">
            {datosRevision.map((dato) => (
              <div className={dato.ancho ? 'review-wide' : undefined} key={dato.etiqueta}>
                <dt>{dato.etiqueta}</dt>
                <dd>{dato.valor}</dd>
              </div>
            ))}
          </dl>
          <div className="review-evidence">
            <h3>Evidencia adjunta</h3>
            <div className="evidence-grid">
              {evidencias.map((evidencia) => (
                <EvidencePreview
                  evidencia={evidencia}
                  idSolicitud={draft.idSolicitud}
                  key={evidencia.idEvidencia}
                />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="button button-secondary" onClick={() => setPaso(3)} type="button">
              <Icon name="arrow-left" size={17} /> Evidencia
            </button>
            <button className="button button-primary" disabled={guardando} onClick={confirmarEnvio} type="button">
              {guardando ? <><span className="spinner spinner-small" /> Enviando…</> : <>Enviar solicitud <Icon name="arrow-right" size={18} /></>}
            </button>
          </div>
        </section>
      ) : null}

      {paso > 1 && paso < 5 ? (
        <p className="draft-note">
          {draft ? <>Borrador <strong>{draft.folio}</strong> guardado.</> : null}
        </p>
      ) : null}
    </div>
  )
}
