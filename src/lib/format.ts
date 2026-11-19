import type { CSSProperties } from 'react'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function parseData(dataStr: string): Date {
  const [y, m, d] = dataStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDataCurta(dataStr: string): string {
  const d = parseData(dataStr)
  return `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`
}

export function formatDataHora(dataStr: string, hora: string): string {
  return `${formatDataCurta(dataStr)} às ${hora}`
}

export function formatDataFull(dataStr: string): string {
  const d = parseData(dataStr)
  return `${DIAS_FULL[d.getDay()]}, ${d.getDate()} de ${MESES_FULL[d.getMonth()]}`
}

export function hojeStr(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDias(dataStr: string, dias: number): string {
  const d = parseData(dataStr)
  d.setDate(d.getDate() + dias)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function semanaDeAte(dataStr: string): string {
  const inicio = parseData(dataStr)
  const diaSemana = inicio.getDay()
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana
  inicio.setDate(inicio.getDate() + diff)
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(inicio.getDate())} ${MESES[inicio.getMonth()]} a ${pad(fim.getDate())} ${MESES[fim.getMonth()]}`
}

export function formatMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function textoContraste(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminancia > 0.6 ? '#1a1a1a' : '#ffffff'
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function escurecer(hex: string, fator: number): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `#${clamp(r * (1 - fator)).toString(16).padStart(2, '0')}${clamp(g * (1 - fator)).toString(16).padStart(2, '0')}${clamp(b * (1 - fator)).toString(16).padStart(2, '0')}`
}

export function clarear(hex: string, fator: number): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `#${clamp(r + (255 - r) * fator).toString(16).padStart(2, '0')}${clamp(g + (255 - g) * fator).toString(16).padStart(2, '0')}${clamp(b + (255 - b) * fator).toString(16).padStart(2, '0')}`
}

export function esmalteStyle(hex: string): CSSProperties {
  const claro = clarear(hex, 0.35)
  const escuro = escurecer(hex, 0.3)
  return {
    background: `radial-gradient(circle at 35% 30%, ${claro} 0%, ${hex} 45%, ${escuro} 100%)`,
    boxShadow: `inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px ${escuro}99, 0 2px 4px rgba(0,0,0,0.15)`,
  }
}
