import { useState, useCallback } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  className?: string
  placeholder?: string
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  className = '',
  placeholder,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value))
  const [focused, setFocused] = useState(false)

  const handleBlur = useCallback(() => {
    setFocused(false)
    const cleaned = localValue.replace(/\s/g, '').replace(',', '.')
    let num = parseFloat(cleaned)
    if (isNaN(num)) num = 0
    if (min !== undefined) num = Math.max(min, num)
    if (max !== undefined) num = Math.min(max, num)
    setLocalValue(String(num))
    onChange(num)
  }, [localValue, min, max, onChange])

  const displayValue = focused
    ? localValue
    : suffix
      ? `${value}${suffix}`
      : String(value)

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => {
        setFocused(true)
        setLocalValue(String(value))
      }}
      onBlur={handleBlur}
      step={step}
      placeholder={placeholder}
      className={`border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
    />
  )
}
