import { useEffect, useId, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import guide from "../../../docs/state-machines.md?raw";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "neutral",
  fontFamily: "Arial, sans-serif",
  flowchart: { htmlLabels: false },
});

function StateDiagram({ source }: { source: string }) {
  const id = `state-diagram-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let active = true;
    mermaid.render(id, source).then(result => {
      if (active) { setSvg(result.svg); setError(false); }
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, source]);

  return <div className="not-prose my-5 rounded-lg border bg-white text-slate-900" data-state-diagram>
    <div className="flex items-center justify-between gap-3 border-b px-3 py-2 text-xs">
      <span>Scroll to explore the diagram</span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" aria-label="Zoom out diagram" disabled={zoom <= 50} onClick={() => setZoom(v => v - 25)}>−</Button>
        <Button size="sm" variant="outline" aria-label="Reset diagram zoom" onClick={() => setZoom(100)}>{zoom}%</Button>
        <Button size="sm" variant="outline" aria-label="Zoom in diagram" disabled={zoom >= 200} onClick={() => setZoom(v => v + 25)}>+</Button>
      </div>
    </div>
    {error ? <p role="alert" className="p-4">This diagram could not load. Its description is available below.</p> : !svg ? <p role="status" className="p-4">Loading diagram…</p> :
      <div className="overflow-auto p-4" tabIndex={0} aria-label="State diagram, scroll to explore">
        <div className="[&>svg]:!max-w-none [&>svg]:!w-full [&>svg]:h-auto" style={{ width: `${zoom}%`, minWidth: `${7 * zoom}px` }}
          // Only Mermaid's strict-mode rendering of the checked-in guide is used here.
          dangerouslySetInnerHTML={{ __html: svg }} />
      </div>}
    <details className="border-t px-3 py-2 text-xs"><summary className="cursor-pointer">Diagram text</summary><pre className="mt-2 whitespace-pre-wrap font-mono">{source}</pre></details>
  </div>;
}

function sectionId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const sections = [...guide.matchAll(/^## (.+)$/gm)].map(match => match[1]);

export default function StateMachinesPanel() {
  return <section aria-label="State machines" className="rounded-lg border bg-card p-4 md:p-6">
    <div className="mb-6 rounded-md bg-muted p-4 text-sm">
      <p className="font-medium">How the admin records work</p>
      <p className="mt-1 text-muted-foreground">Reference guide to the current behavior. These diagrams do not change records. A future allocation, confirmed booking and physical installation are separate steps.</p>
      <nav aria-label="State machine sections" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {sections.map(title => <a key={title} className="underline underline-offset-4" href={`#${sectionId(title)}`}>{title}</a>)}
      </nav>
    </div>
    <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-a:text-primary">
      <Markdown remarkPlugins={[remarkGfm]} components={{
        h1: ({ children }) => <h2 className="mt-0 text-2xl">{children}</h2>,
        h2: ({ children }) => <h3 id={sectionId(String(children))} className="scroll-mt-28 text-xl">{children}</h3>,
        pre: ({ children }) => <div>{children}</div>,
        code: ({ className, children }) => className === "language-mermaid"
          ? <StateDiagram source={String(children).trim()} /> : <code className={className}>{children}</code>,
        table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
        a: ({ href, children }) => <a href={href?.startsWith("../") ? `https://github.com/aryzach/aryzach.github.io/blob/main/${href.slice(3)}` : href} target="_blank" rel="noopener noreferrer">{children}</a>,
      }}>{guide}</Markdown>
    </article>
  </section>;
}
