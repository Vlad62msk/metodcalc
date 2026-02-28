import { useState, useRef, useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useLibraryStore } from '@/store/useLibraryStore'
import type { LibraryElement } from '@/types/library'

interface AddItemFormProps {
  parentId?: string | null
  compact?: boolean
}

export function AddItemForm({ parentId = null, compact = false }: AddItemFormProps) {
  const addItem = useProjectStore((s) => s.addItem)
  const allElements = useLibraryStore((s) => s.elements)
  const elements = useMemo(() => allElements.filter((e) => !e.isHidden), [allElements])
  const [name, setName] = useState('')
  const [suggestions, setSuggestions] = useState<LibraryElement[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleNameChange = (value: string) => {
    setName(value)
    if (value.length >= 1) {
      const filtered = elements.filter((e) =>
        e.name.toLowerCase().includes(value.toLowerCase()),
      )
      setSuggestions(filtered.slice(0, 8))
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const addFromSuggestion = (el: LibraryElement) => {
    addItem({
      parentId,
      name: el.name,
      hoursPerUnit: el.hoursPerUnit,
      unit: el.unit,
      category: el.category,
      role: el.role,
      revisionable: el.revisionable,
      libraryElementId: el.id,
      source: 'library_element',
      clientName: el.name,
    })
    setName('')
    setShowSuggestions(false)
  }

  const addManual = () => {
    if (!name.trim()) return
    addItem({
      parentId,
      name: name.trim(),
      clientName: name.trim(),
    })
    setName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && showSuggestions) {
        addFromSuggestion(suggestions[0]!)
      } else {
        addManual()
      }
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  if (compact) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="+ Добавить элемент..."
          className="w-full text-xs text-gray-500 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-300 rounded px-1 py-1"
        />
        {showSuggestions && (
          <SuggestionsDropdown suggestions={suggestions} onSelect={addFromSuggestion} />
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Название элемента..."
          className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={addManual}
          className="text-sm bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          + Добавить
        </button>
      </div>
      {showSuggestions && (
        <SuggestionsDropdown suggestions={suggestions} onSelect={addFromSuggestion} />
      )}
    </div>
  )
}

function SuggestionsDropdown({
  suggestions,
  onSelect,
}: {
  suggestions: LibraryElement[]
  onSelect: (el: LibraryElement) => void
}) {
  return (
    <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
      {suggestions.map((el) => (
        <button
          key={el.id}
          type="button"
          onMouseDown={() => onSelect(el)}
          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-sm"
        >
          <span>{el.name}</span>
          <span className="text-xs text-gray-400">
            {el.hoursPerUnit} ч / {el.unit}
          </span>
        </button>
      ))}
    </div>
  )
}
