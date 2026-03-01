import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProjects } from '@/storage/projectsDb'
import type { StoredProject } from '@/storage/db'
import { formatCurrency, formatRelativeDate } from '@/utils/format'
import { CATEGORY_LABELS } from '@/types/estimate'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, CartesianGrid,
} from 'recharts'

const CATEGORY_COLORS: Record<string, string> = {
  content: '#8b5cf6',
  assessment: '#f59e0b',
  service: '#10b981',
  other: '#6b7280',
}

export function AnalyticsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<'updatedAt' | 'totalAmount' | 'totalHours'>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    listProjects().then((all) => {
      setProjects(all)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Загрузка...</p>
      </div>
    )
  }

  if (projects.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Для аналитики нужно минимум 2 проекта</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Вернуться к проектам
        </button>
      </div>
    )
  }

  // Summary cards
  const totalProjects = projects.length
  const totalAmount = projects.reduce((s, p) => s + p.totalAmount, 0)
  const totalHours = projects.reduce((s, p) => s + p.totalHours, 0)
  const avgMultiplier = projects.reduce((s, p) => s + p.contextMultiplier, 0) / totalProjects
  const avgRate = totalHours > 0 ? totalAmount / totalHours : 0

  // Category chart data
  const categoryTotals: Record<string, number> = { content: 0, assessment: 0, service: 0, other: 0 }
  projects.forEach((p) => {
    if (p.categoryBreakdown) {
      categoryTotals.content += p.categoryBreakdown.content
      categoryTotals.assessment += p.categoryBreakdown.assessment
      categoryTotals.service += p.categoryBreakdown.service
      categoryTotals.other += p.categoryBreakdown.other
    }
  })
  const categoryChartData = Object.entries(categoryTotals)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({
      name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
      amount,
      key,
    }))

  // Timeline data
  const timelineData = projects.map((p) => ({
    date: new Date(p.updatedAt).getTime(),
    amount: p.totalAmount,
    name: p.name,
  }))

  // Sorted table
  const sorted = [...projects].sort((a, b) => {
    let cmp = 0
    if (sortField === 'updatedAt') cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    else if (sortField === 'totalAmount') cmp = a.totalAmount - b.totalAmount
    else cmp = a.totalHours - b.totalHours
    return sortDir === 'asc' ? cmp : -cmp
  })

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortIndicator = (field: typeof sortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white glass-solid border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700 mr-1"
            >
              &larr;
            </button>
            <h1 className="text-lg font-bold text-gray-900">Аналитика</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500">Проектов</div>
            <div className="text-xl font-bold">{totalProjects}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500">Общая сумма</div>
            <div className="text-xl font-bold">{formatCurrency(totalAmount)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500">Общие часы</div>
            <div className="text-xl font-bold">{Math.round(totalHours)} ч</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500">Ср. ставка</div>
            <div className="text-xl font-bold">{formatCurrency(avgRate)}/ч</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500">Ср. коэффициент</div>
            <div className="text-xl font-bold">×{avgMultiplier.toFixed(2)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category breakdown */}
          {categoryChartData.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">По категориям (все проекты)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryChartData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((entry) => (
                      <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] || '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Проекты по дате и сумме</h3>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="date"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11 }}
                />
                <YAxis dataKey="amount" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === 'amount' ? formatCurrency(v) : new Date(v).toLocaleDateString('ru-RU')
                  }
                  labelFormatter={() => ''}
                />
                <Scatter data={timelineData} fill="#8b5cf6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <h3 className="text-sm font-medium text-gray-700 p-4 border-b border-gray-100">
            Все проекты
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Проект</th>
                  <th
                    className="text-right px-4 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Сумма{sortIndicator('totalAmount')}
                  </th>
                  <th
                    className="text-right px-4 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('totalHours')}
                  >
                    Часы{sortIndicator('totalHours')}
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Коэфф.</th>
                  <th
                    className="text-right px-4 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Дата{sortIndicator('updatedAt')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/project/${p.id}`)}
                  >
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-4 py-2 text-right">{Math.round(p.totalHours)} ч</td>
                    <td className="px-4 py-2 text-right">×{p.contextMultiplier.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {formatRelativeDate(p.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
