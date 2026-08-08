import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

// Mermaid only accepts concrete color strings — not CSS var().
// Aligned to FOCSS light paper docs shell (ocean + bronze on ecru).
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#D6E4F0',
    primaryTextColor: '#0F172A',
    primaryBorderColor: '#406F99',
    lineColor: '#64748B',
    secondaryColor: '#F3EDE3',
    tertiaryColor: '#E8F0F7',
    background: '#F5F0E8',
    mainBkg: '#FFFFFF',
    nodeBorder: '#C5B8A4',
    clusterBkg: '#F8F4EC',
    titleColor: '#0F172A',
    edgeLabelBackground: '#FFFFFF',
    fontFamily: 'Inter, system-ui, "Segoe UI", sans-serif',
  },
  flowchart: { curve: 'basis', htmlLabels: true },
  sequence: { actorMargin: 50 },
})

let counter = 0

interface MermaidDiagramProps {
  chart: string
  title?: string
  className?: string
}

export function MermaidDiagram({ chart, title, className }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const idRef = useRef(`mermaid-${++counter}`)

  useEffect(() => {
    const render = async () => {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, chart)
        setSvg(rendered)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Diagram render error')
      }
    }
    void render()
  }, [chart])

  return (
    <div className={className}>
      {title && (
        <p className="text-sm font-medium text-docs-text-muted mb-3 text-center">{title}</p>
      )}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm font-mono">
          {error}
        </div>
      ) : (
        <div
          ref={ref}
          className="bg-docs-surface-raised/50 rounded-xl border border-docs-border p-4 overflow-x-auto flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  )
}
