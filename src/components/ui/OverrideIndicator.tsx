interface OverrideIndicatorProps {
  onReset: () => void
  tooltip?: string
  isOverridden?: boolean
}

export function OverrideIndicator({
  onReset,
  tooltip = 'Изменено вручную. Клик — вернуть автоматическое значение.',
  isOverridden = true,
}: OverrideIndicatorProps) {
  if (!isOverridden) return null
  return (
    <button
      type="button"
      onClick={onReset}
      title={tooltip}
      className="text-amber-500 hover:text-amber-700 cursor-pointer text-sm"
    >
      ✏️
    </button>
  )
}
