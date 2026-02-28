interface WarningBannerProps {
  level: 'yellow' | 'red'
  message: string
}

export function WarningBanner({ level, message }: WarningBannerProps) {
  const styles =
    level === 'red'
      ? 'bg-red-50 border-red-300 text-red-800'
      : 'bg-yellow-50 border-yellow-300 text-yellow-800'

  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  )
}
