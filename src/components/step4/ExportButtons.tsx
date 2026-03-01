import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatCurrency, formatHours, formatNumber } from '@/utils/format'
import { calcContainerCost, calcItemCost, calcEffectiveHours } from '@/core/calculator'
import { exportToXlsx } from '@/core/exportXlsx'
import type { EstimateItem } from '@/types/estimate'

export function ExportButtons() {
  const [copied, setCopied] = useState(false)
  const [exportedJson, setExportedJson] = useState(false)
  const [exportedXlsx, setExportedXlsx] = useState(false)

  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)
  const context = useProjectStore((s) => s.context)
  const presentation = useProjectStore((s) => s.presentation)
  const meta = useProjectStore((s) => s.meta)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const getGrandTotal = useProjectStore((s) => s.getGrandTotal)

  const buildPlainText = (): string => {
    const result = getGrandTotal()
    const hourlyRate = pricing.hourlyRate
    const contextMultiplier = context.contextMultiplier

    const getItemCost = (item: EstimateItem): number => {
      if (item.overrides.cost && costOverrides[item.id] != null) return costOverrides[item.id]!
      if (item.isContainer) return calcContainerCost(item, items, hourlyRate, contextMultiplier, costOverrides)
      return calcItemCost(item, hourlyRate, contextMultiplier)
    }

    const lines: string[] = []
    lines.push(`СМЕТА: ${meta.name || 'Проект'}`)
    lines.push(`${context.projectType.label}`)
    lines.push('')
    lines.push('─'.repeat(60))

    const rootItems = items.filter((i) => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder)

    const renderItem = (item: EstimateItem, indent: string) => {
      const cost = getItemCost(item)
      const name = item.clientName || item.name
      const children = items.filter((i) => i.parentId === item.id).sort((a, b) => a.sortOrder - b.sortOrder)

      let line = `${indent}${name}`
      if (!item.isContainer) {
        const parts: string[] = []
        if (presentation.showQuantity) parts.push(`${formatNumber(item.quantity)} ${item.unit || 'шт.'}`)
        if (presentation.showHours && item.pricingModel === 'time_based') {
          parts.push(formatHours(calcEffectiveHours(item) * item.quantity))
        }
        if (parts.length) line += ` (${parts.join(', ')})`
      }
      line += ` — ${formatCurrency(cost)}`
      lines.push(line)

      if (presentation.showGroupStructure) {
        children.forEach((child) => renderItem(child, indent + '  '))
      }
    }

    if (presentation.showGroupStructure) {
      rootItems.forEach((item) => renderItem(item, ''))
    } else {
      items
        .filter((i) => !i.isContainer || i.containerMode === 'fixed_total')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach((item) => renderItem(item, ''))
    }

    lines.push('')
    lines.push('─'.repeat(60))
    lines.push(`Подытог: ${formatCurrency(result.baseTotal)}`)
    if (result.revisions > 0) lines.push(`Правки (${formatNumber(pricing.revisionPercent * 100, 0)}%): ${formatCurrency(result.revisions)}`)
    if (result.volumeDiscountAmount > 0) lines.push(`Объёмные скидки: -${formatCurrency(result.volumeDiscountAmount)}`)
    if (result.discountAmount !== 0) lines.push(`${result.discountAmount > 0 ? 'Наценка' : 'Скидка'}: ${formatCurrency(result.discountAmount)}`)
    if (result.taxAmount > 0 && presentation.showTaxSeparately) lines.push(`Налог (${pricing.tax.rate}%): ${formatCurrency(result.taxAmount)}`)
    lines.push(`ИТОГО: ${formatCurrency(result.grandTotal)}`)

    if (presentation.showConditions && presentation.conditionsText) {
      lines.push('')
      lines.push('Условия:')
      lines.push(presentation.conditionsText)
    }

    if (presentation.showSignature && (presentation.signatureName || presentation.signatureContact)) {
      lines.push('')
      if (presentation.signatureName) lines.push(presentation.signatureName)
      if (presentation.signatureContact) lines.push(presentation.signatureContact)
    }

    return lines.join('\n')
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = buildPlainText()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportJson = () => {
    const state = {
      version: '3.3',
      meta,
      context,
      items,
      pricing,
      presentation,
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meta.name || 'estimate'}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportedJson(true)
    setTimeout(() => setExportedJson(false), 2000)
  }

  const handleExportXlsx = () => {
    try {
      exportToXlsx({ items, pricing, context, presentation, costOverrides, meta })
      setExportedXlsx(true)
      setTimeout(() => setExportedXlsx(false), 2000)
    } catch (err) {
      console.error('XLSX export failed:', err)
      alert('Ошибка экспорта XLSX')
    }
  }

  const handleImportJson = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          const store = useProjectStore.getState()
          store.loadProject({
            context: data.context,
            items: data.items,
            pricing: data.pricing,
            presentation: data.presentation,
            snapshots: [],
            meta: data.meta,
          })
        } catch (err) {
          alert('Ошибка импорта: неверный формат файла')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Экспорт</h3>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopyText}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Скопировано!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Копировать текст
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Сохранить PDF
        </button>

        <button
          type="button"
          onClick={handleExportXlsx}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          {exportedXlsx ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Сохранено!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Скачать XLSX
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleExportJson}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          {exportedJson ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Сохранено!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Сохранить JSON
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleImportJson}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Загрузить JSON
        </button>
      </div>
    </div>
  )
}
