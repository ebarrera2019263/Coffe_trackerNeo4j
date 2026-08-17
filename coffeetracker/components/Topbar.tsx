'use client'

interface TopbarProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

export default function Topbar({ title, subtitle, children }: TopbarProps) {
  return (
    <div className="topbar">
      <div style={{ flex: 1 }}>
        <div className="topbar-title">{title}</div>
        <div className="topbar-sub">{subtitle}</div>
      </div>
      {children}
    </div>
  )
}
