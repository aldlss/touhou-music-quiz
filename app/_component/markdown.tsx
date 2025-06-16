import Markdown from "react-markdown";
import { ShadowRootSection } from "./shadow-root";
import remarkGfm from "remark-gfm";
import githubMarkdownStylesUrl from "@/app/docs/github-markdown-shadow.css?url";

interface MarkdownProps {
  title: string;
  markdown: string;
}

export function MarkdownPage({ title, markdown }: MarkdownProps) {
  return (
    <main>
      <h1 className="text-h1 text-common-color text-center font-bold">
        {title}
      </h1>
      <MarkdownContent markdown={markdown} />
    </main>
  );
}

export function MarkdownContent({ markdown }: Omit<MarkdownProps, "title">) {
  return (
    <ShadowRootSection className="shadow-root-markdown">
      <link rel="stylesheet" href={githubMarkdownStylesUrl} />
      <style>
        {`.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
}

@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}`}
      </style>
      <article className="markdown-body">
        <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
      </article>
    </ShadowRootSection>
  );
}
