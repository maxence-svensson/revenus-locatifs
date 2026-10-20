import type { Decimal } from '#shared/tax/decimal'

type Valeur = Decimal | number | string

function nombre(v: Valeur): number {
  return typeof v === 'number' ? v : Number(v.toString())
}

const formatEuros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const formatEurosCentimes = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatNombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export function euros(v: Valeur): string {
  const n = nombre(v)
  return formatEuros.format(Object.is(n, -0) ? 0 : n)
}

export function eurosCentimes(v: Valeur): string {
  return formatEurosCentimes.format(nombre(v))
}

/** « + 1 200 € » ou « − 300 € », pour un écart ou une économie. */
export function eurosSigne(v: Valeur): string {
  const n = nombre(v)
  if (n === 0) return euros(0)
  return (n > 0 ? '+ ' : '− ') + euros(Math.abs(n))
}

export function pourcent(v: Valeur, decimales = 0): string {
  return `${formatNombre.format(Number(nombre(v).toFixed(decimales)))} %`
}

export function nombreFr(v: Valeur): string {
  return formatNombre.format(nombre(v))
}
