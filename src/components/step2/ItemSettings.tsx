import { useState, useMemo } from 'react'
import type { EstimateItem } from '@/types/estimate'
import { ROLE_LABELS, QUALITY_LEVELS, CATEGORY_LABELS, CONFIDENCE_LEVELS } from '@/types/estimate'
import { useProjectStore } from '@/store/useProjectStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useLibraryStore } from '@/store/useLibraryStore'

interface ItemSettingsProps {
  item: EstimateItem
  onClose: () => void
}

export function ItemSettings({ item, onClose }: ItemSettingsProps) {
  const updateItem = useProjectStore((s) => s.updateItem)
  const defaultRoleMultipliers = useSettingsStore((s) => s.defaultRoleMultipliers)
  const elements = useLibraryStore((s) => s.elements)
  const [showLibrarySearch, setShowLibrarySearch] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')

  const boundElement = useMemo(
    () => elements.find((e) => e.id === item.libraryElementId) ?? null,
    [elements, item.libraryElementId],
  )

  const filteredElements = useMemo(
    () =>
      librarySearch.length >= 1
        ? elements.filter((e) => !e.isHidden && e.name.toLowerCase().includes(librarySearch.toLowerCase()))
        : elements.filter((e) => !e.isHidden),
    [elements, librarySearch],
  )

  const handleRoleChange = (role: string) => {
    const mult =
      role === 'author'
        ? defaultRoleMultipliers.author
        : role === 'editor'
          ? defaultRoleMultipliers.editor
          : role === 'reviewer'
            ? defaultRoleMultipliers.reviewer
            : item.roleMultiplier
    updateItem(item.id, {
      role: role as EstimateItem['role'],
      roleMultiplier: mult,
      overrides: { ...item.overrides, roleMultiplier: false },
    })
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">Настройки: {item.name}</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* Категория */}
      <div>
        <label className="text-xs text-gray-500">Категория</label>
        <select
          value={item.category}
          onChange={(e) => {
            const cat = e.target.value as EstimateItem['category']
            const revisionable = cat === 'content' || cat === 'assessment'
            updateItem(item.id, { category: cat, revisionable })
          }}
          className="w-full border border-gray-300 rounded px-2 py-1 mt-1"
        >
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Роль */}
      <div>
        <label className="text-xs text-gray-500">Роль методиста</label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {Object.entries(ROLE_LABELS).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => handleRoleChange(val)}
              className={`px-2 py-1 rounded text-xs ${
                item.role === val
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <label className="text-xs text-gray-500">Множитель роли:</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={item.roleMultiplier}
            onChange={(e) =>
              updateItem(item.id, {
                roleMultiplier: parseFloat(e.target.value) || 0,
                overrides: { ...item.overrides, roleMultiplier: true },
              })
            }
            className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>
      </div>

      {/* Качество */}
      <div>
        <label className="text-xs text-gray-500">Уровень качества</label>
        <div className="flex gap-2 mt-1">
          {QUALITY_LEVELS.map((ql) => (
            <button
              key={ql.value}
              type="button"
              onClick={() =>
                updateItem(item.id, {
                  qualityLevel: ql.value,
                  overrides: { ...item.overrides, qualityLevel: false },
                })
              }
              className={`px-2 py-1 rounded text-xs ${
                item.qualityLevel === ql.value
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {ql.label} (×{ql.value})
            </button>
          ))}
        </div>
      </div>

      {/* Диапазон трудоёмкости (PERT) */}
      {!item.isContainer && item.pricingModel === 'time_based' && (
        <div>
          <label className="text-xs text-gray-500">Диапазон трудоёмкости (ч/ед.)</label>
          <div className="flex gap-2 mt-1 items-center">
            <input
              type="number"
              min="0"
              step="0.5"
              value={item.effortRange?.min ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseFloat(e.target.value)
                updateItem(item.id, {
                  effortRange: {
                    min: val,
                    expected: item.effortRange?.expected ?? null,
                    max: item.effortRange?.max ?? null,
                  },
                })
              }}
              placeholder="Мин"
              className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
            />
            <span className="text-xs text-gray-400">—</span>
            <span className="text-xs text-gray-600 font-medium" title="Ожидаемое значение = часы на единицу из основного поля">
              {item.hoursPerUnit}
            </span>
            <span className="text-xs text-gray-400">—</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={item.effortRange?.max ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseFloat(e.target.value)
                updateItem(item.id, {
                  effortRange: {
                    min: item.effortRange?.min ?? null,
                    expected: item.effortRange?.expected ?? null,
                    max: val,
                  },
                })
              }}
              placeholder="Макс"
              className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
          {item.effortRange?.min != null && item.effortRange?.max != null && (
            <div className="mt-1">
              {item.overrides.hoursPerUnit ? (
                <span className="text-xs text-yellow-600">
                  Часы заданы вручную — PERT не применяется
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  PERT: {((item.effortRange.min + 4 * item.hoursPerUnit + item.effortRange.max) / 6).toFixed(1)} ч/ед.
                </span>
              )}
              <button
                type="button"
                onClick={() => updateItem(item.id, { effortRange: null })}
                className="ml-2 text-xs text-red-400 hover:text-red-600"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      )}

      {/* Модель ценообразования */}
      <div>
        <label className="text-xs text-gray-500">Ценообразование</label>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => updateItem(item.id, { pricingModel: 'time_based' })}
            className={`px-2 py-1 rounded text-xs ${
              item.pricingModel === 'time_based'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            По времени
          </button>
          <button
            type="button"
            onClick={() => updateItem(item.id, { pricingModel: 'fixed_price' })}
            className={`px-2 py-1 rounded text-xs ${
              item.pricingModel === 'fixed_price'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Фиксированная цена
          </button>
        </div>
        {item.pricingModel === 'fixed_price' && (
          <input
            type="number"
            value={item.fixedPrice ?? 0}
            onChange={(e) =>
              updateItem(item.id, { fixedPrice: parseFloat(e.target.value) || 0 })
            }
            placeholder="Цена, ₽"
            className="w-32 border border-gray-300 rounded px-2 py-1 mt-1 text-xs"
          />
        )}
      </div>

      {/* Участие в правках */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={item.revisionable}
          onChange={(e) => updateItem(item.id, { revisionable: e.target.checked })}
          className="text-primary-600"
        />
        <span className="text-xs text-gray-600">Участвует в расчёте правок</span>
      </label>

      {/* Контейнер */}
      {item.isContainer && (
        <div>
          <label className="text-xs text-gray-500">Режим контейнера</label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => updateItem(item.id, { containerMode: 'sum_children' })}
              className={`px-2 py-1 rounded text-xs ${
                item.containerMode === 'sum_children'
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-white border border-gray-300 text-gray-600'
              }`}
            >
              Сумма дочерних
            </button>
            <button
              type="button"
              onClick={() => updateItem(item.id, { containerMode: 'fixed_total' })}
              className={`px-2 py-1 rounded text-xs ${
                item.containerMode === 'fixed_total'
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-white border border-gray-300 text-gray-600'
              }`}
            >
              Фиксированная сумма
            </button>
          </div>
          {item.containerMode === 'fixed_total' && (
            <input
              type="number"
              value={item.containerFixedTotal ?? 0}
              onChange={(e) =>
                updateItem(item.id, { containerFixedTotal: parseFloat(e.target.value) || 0 })
              }
              placeholder="Сумма, ₽"
              className="w-32 border border-gray-300 rounded px-2 py-1 mt-1 text-xs"
            />
          )}
        </div>
      )}

      {/* Уверенность в оценке */}
      {!item.isContainer && (
        <div>
          <label className="text-xs text-gray-500">Уверенность в оценке</label>
          <div className="flex gap-1 mt-1 items-center">
            {CONFIDENCE_LEVELS.map((cl) => (
              <button
                key={cl.value}
                type="button"
                onClick={() =>
                  updateItem(item.id, {
                    confidence: item.confidence === cl.value ? null : cl.value,
                  })
                }
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                  item.confidence === cl.value
                    ? `${cl.color} text-white border-transparent ring-2 ring-offset-1 ring-gray-400`
                    : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                }`}
                title={cl.label}
              >
                {cl.value}
              </button>
            ))}
            {item.confidence != null && (
              <span className="text-xs text-gray-400 ml-2">
                {CONFIDENCE_LEVELS.find((c) => c.value === item.confidence)?.label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Привязка к элементу библиотеки */}
      {!item.isContainer && (
        <div>
          <label className="text-xs text-gray-500">Элемент библиотеки</label>
          <div className="mt-1">
            {boundElement ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {boundElement.name}
                </span>
                <button
                  type="button"
                  onClick={() => updateItem(item.id, { libraryElementId: null, source: 'manual' })}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Отвязать
                </button>
              </div>
            ) : (
              <div>
                {!showLibrarySearch ? (
                  <button
                    type="button"
                    onClick={() => setShowLibrarySearch(true)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    + Привязать к элементу библиотеки
                  </button>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        placeholder="Поиск элемента..."
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => { setShowLibrarySearch(false); setLibrarySearch('') }}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
                      {filteredElements.slice(0, 10).map((el) => (
                        <button
                          key={el.id}
                          type="button"
                          onClick={() => {
                            updateItem(item.id, {
                              libraryElementId: el.id,
                              source: item.source === 'manual' ? 'library_element' : item.source,
                            })
                            setShowLibrarySearch(false)
                            setLibrarySearch('')
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 flex justify-between"
                        >
                          <span>{el.name}</span>
                          <span className="text-gray-400">{el.hoursPerUnit} ч/{el.unit}</span>
                        </button>
                      ))}
                      {filteredElements.length === 0 && (
                        <div className="text-xs text-gray-400 py-2 text-center">Не найдено</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Заметки */}
      <div>
        <label className="text-xs text-gray-500">Заметки</label>
        <textarea
          value={item.notes}
          onChange={(e) => updateItem(item.id, { notes: e.target.value })}
          rows={2}
          className="w-full border border-gray-300 rounded px-2 py-1 mt-1 text-xs resize-none"
          placeholder="Комментарий для себя..."
        />
      </div>
    </div>
  )
}
