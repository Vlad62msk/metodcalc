import { useProjectStore } from '@/store/useProjectStore'
import { OptionSelector } from './OptionSelector'
import { CoefficientDisplay } from './CoefficientDisplay'
import {
  PROJECT_TYPE_OPTIONS,
  DOMAIN_OPTIONS,
  METHODOLOGY_OPTIONS,
  CLIENT_OPTIONS,
  DEADLINE_OPTIONS,
} from '@/core/defaults'

export function Step1Context() {
  const context = useProjectStore((s) => s.context)
  const setProjectType = useProjectStore((s) => s.setProjectType)
  const setDomain = useProjectStore((s) => s.setDomain)
  const setMethodology = useProjectStore((s) => s.setMethodology)
  const setClient = useProjectStore((s) => s.setClient)
  const setDeadline = useProjectStore((s) => s.setDeadline)

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900">Что за проект?</h2>
      <p className="text-sm text-gray-500">
        Выберите параметры проекта. Каждый параметр влияет на контекстный коэффициент — он автоматически
        учтётся в стоимости. Если ни один вариант не подходит, выберите «Другое» и задайте свои значения.
      </p>

      <OptionSelector
        label="Тип проекта"
        options={PROJECT_TYPE_OPTIONS}
        selectedValue={context.projectType.value}
        onSelect={(opt) => setProjectType(opt.value, opt.label)}
      />

      <OptionSelector
        label="Знакомство с доменом (темой)"
        options={DOMAIN_OPTIONS}
        selectedValue={context.domain.value}
        onSelect={(opt) => setDomain(opt.value, opt.label, opt.multiplier ?? 1)}
        showMultiplier
        customFields={{ multiplier: true }}
      />

      <OptionSelector
        label="Тип работы (методика)"
        options={METHODOLOGY_OPTIONS}
        selectedValue={context.methodology.value}
        onSelect={(opt) => setMethodology(opt.value, opt.label, opt.multiplier ?? 1)}
        showMultiplier
        customFields={{ multiplier: true }}
      />

      <OptionSelector
        label="Клиент и коммуникация"
        options={CLIENT_OPTIONS}
        selectedValue={context.client.value}
        onSelect={(opt) =>
          setClient(opt.value, opt.label, opt.multiplier ?? 1, opt.defaultRevisionPercent ?? 0.1)
        }
        showMultiplier
        customFields={{ multiplier: true, revisionPercent: true }}
      />

      <OptionSelector
        label="Сроки"
        options={DEADLINE_OPTIONS}
        selectedValue={context.deadline.value}
        onSelect={(opt) => setDeadline(opt.value, opt.label, opt.multiplier ?? 1)}
        showMultiplier
        customFields={{ multiplier: true }}
      />

      <CoefficientDisplay />
    </div>
  )
}
