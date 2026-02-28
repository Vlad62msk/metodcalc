import { useProjectStore } from '@/store/useProjectStore'
import { REVISION_OPTIONS } from '@/core/defaults'
import { OverrideIndicator } from '@/components/ui/OverrideIndicator'

export function RevisionSettings() {
  const revisionPercent = useProjectStore((s) => s.pricing.revisionPercent)
  const revisionPercentIsManual = useProjectStore((s) => s.pricing.revisionPercentIsManual)
  const setRevisionPercent = useProjectStore((s) => s.setRevisionPercent)
  const clientDefault = useProjectStore((s) => s.context.client.defaultRevisionPercent)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Правки и доработки</span>
        {revisionPercentIsManual && (
          <OverrideIndicator onReset={() => setRevisionPercent(clientDefault, false)} />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {REVISION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRevisionPercent(opt.value, false)}
            className={`px-3 py-1.5 text-xs rounded-lg ${
              revisionPercent === opt.value && !revisionPercentIsManual
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="100"
            value={Math.round(revisionPercent * 100)}
            onChange={(e) => setRevisionPercent((parseInt(e.target.value) || 0) / 100, true)}
            className="w-16 text-xs border border-gray-300 rounded px-2 py-1.5"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>
    </div>
  )
}
