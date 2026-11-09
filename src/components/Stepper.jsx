export function Stepper({ paso, pasos }) {
  return (
    <ol aria-label="Pasos de la nueva evaluación" className="stepper">
      {pasos.map((etiqueta, indice) => {
        const numero = indice + 1
        const estado = numero < paso ? 'complete' : numero === paso ? 'current' : 'pending'
        return (
          <li className={`stepper-item is-${estado}`} key={etiqueta}>
            <span className="stepper-number">{numero}</span>
            <span>{etiqueta}</span>
          </li>
        )
      })}
    </ol>
  )
}
