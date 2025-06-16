import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import githubMarkdownStylesUrl from "@/app/docs/github-markdown.css?url";

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
    <article className="markdown-body">
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
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              properties: {
                className: ["anchor"],
                ariaHidden: true,
                tabIndex: -1,
              },
              content: {
                type: "element",
                tagName: "span",
                properties: {
                  className: ["octicon", "octicon-link"],
                },
                children: [],
              },
            },
          ],
        ]}
      >
        {markdown}
      </Markdown>
    </article>
  );
}
