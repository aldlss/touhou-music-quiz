import Markdown from "react-markdown";
import { ShadowRootSection } from "./shadow-root";
import remarkGfm from "remark-gfm";

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
    <ShadowRootSection>
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css"
        rel="stylesheet"
      />
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
