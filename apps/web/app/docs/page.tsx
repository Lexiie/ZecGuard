import fs from "node:fs/promises";
import path from "node:path";
import { SectionCard } from "@/components/section-card";

const docFiles = [
  ["Threat model", "threat-model.md"],
  ["Memo format", "memo-format.md"],
  ["Demo flow", "demo-flow.md"],
  ["Architecture", "architecture.md"],
  ["Roadmap", "roadmap.md"]
] as const;

export default async function DocsPage() {
  const docs = await Promise.all(
    docFiles.map(async ([title, filename]) => ({
      title,
      filename,
      markdown: await fs.readFile(resolveDocPath(filename), "utf8")
    }))
  );

  return (
    <div className="space-y-6">
      <SectionCard title="Local documentation" description="Repo docs rendered directly in the app for demo and review.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {docs.map((doc) => (
            <a key={doc.filename} href={`#${doc.filename}`} className="border-2 border-ink bg-paper p-3 font-mono text-xs font-bold uppercase tracking-[0.12em] shadow-[3px_3px_0_rgba(17,18,15,0.12)] hover:bg-zcash">
              {doc.title}
            </a>
          ))}
        </div>
      </SectionCard>

      {docs.map((doc) => (
        <article key={doc.filename} id={doc.filename} className="border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]">
          <div className="border-b-2 border-ink bg-rail px-5 py-4 text-paper">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zcash">{doc.filename}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{doc.title}</h2>
          </div>
          <MarkdownLite markdown={doc.markdown} />
        </article>
      ))}
    </div>
  );
}

function resolveDocPath(filename: string): string {
  const cwd = process.cwd();
  if (cwd.endsWith(path.join("apps", "web"))) {
    return path.join(cwd, "..", "..", "docs", filename);
  }
  return path.join(cwd, "docs", filename);
}

function MarkdownLite({ markdown }: { markdown: string }) {
  const blocks = toBlocks(markdown);
  return (
    <div className="space-y-4 p-5">
      {blocks.map((block, index) => {
        if (block.kind === "code") {
          return (
            <pre key={index} className="memo-paper hash-text overflow-x-auto border-2 border-ink p-4 font-mono text-sm leading-7 text-ink">
              {block.value}
            </pre>
          );
        }
        if (block.value.startsWith("# ")) {
          return <h1 key={index} className="text-3xl font-black tracking-[-0.04em] text-ink">{block.value.slice(2)}</h1>;
        }
        if (block.value.startsWith("## ")) {
          return <h2 key={index} className="border-t-2 border-ink pt-4 text-2xl font-bold tracking-[-0.03em] text-ink">{block.value.slice(3)}</h2>;
        }
        if (block.value.startsWith("### ")) {
          return <h3 key={index} className="font-mono text-sm font-bold uppercase tracking-[0.16em] text-warning">{block.value.slice(4)}</h3>;
        }
        if (block.value.startsWith("- ")) {
          return (
            <ul key={index} className="space-y-2 border-l-2 border-ink pl-4 text-sm leading-6 text-ink/78">
              {block.value.split("\n").map((item) => (
                <li key={item}>{inlineCode(item.slice(2))}</li>
              ))}
            </ul>
          );
        }
        if (/^\d+\. /.test(block.value)) {
          return (
            <ol key={index} className="list-decimal space-y-2 border-l-2 border-ink pl-8 text-sm leading-6 text-ink/78">
              {block.value.split("\n").map((item) => (
                <li key={item}>{inlineCode(item.replace(/^\d+\. /, ""))}</li>
              ))}
            </ol>
          );
        }
        return <p key={index} className="max-w-3xl text-sm leading-7 text-ink/78">{inlineCode(block.value)}</p>;
      })}
    </div>
  );
}

function toBlocks(markdown: string): Array<{ kind: "text" | "code"; value: string }> {
  const blocks: Array<{ kind: "text" | "code"; value: string }> = [];
  const lines = markdown.split("\n");
  let current: string[] = [];
  let code: string[] | null = null;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (code) {
        blocks.push({ kind: "code", value: code.join("\n") });
        code = null;
      } else {
        flushText(blocks, current);
        current = [];
        code = [];
      }
      continue;
    }

    if (code) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushText(blocks, current);
      current = [];
      continue;
    }

    const previous = current[current.length - 1];
    const sameList = previous && ((previous.startsWith("- ") && line.startsWith("- ")) || (/^\d+\. /.test(previous) && /^\d+\. /.test(line)));
    if (sameList) {
      current.push(line);
      continue;
    }
    if (current.length > 0 && (line.startsWith("#") || line.startsWith("- ") || /^\d+\. /.test(line))) {
      flushText(blocks, current);
      current = [];
    }
    current.push(line);
  }

  flushText(blocks, current);
  return blocks;
}

function flushText(blocks: Array<{ kind: "text" | "code"; value: string }>, current: string[]) {
  if (current.length > 0) {
    blocks.push({ kind: "text", value: current.join("\n") });
  }
}

function inlineCode(value: string) {
  const parts = value.split(/(`[^`]+`)/g);
  return parts.map((part) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={part} className="border border-ink/20 bg-paper px-1 py-0.5 font-mono text-[0.9em] text-ink">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}
