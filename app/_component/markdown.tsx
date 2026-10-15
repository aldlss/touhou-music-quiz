import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Link from "next/link";
import { Home2LineSvg } from "../svg";

interface MarkdownProps {
  title: string;
  markdown: string;
}

export function MarkdownPage({ title, markdown }: MarkdownProps) {
  return (
    <div>
      <header className="w-full flex items-end justify-center gap-2">
        <div className="flex flex-1 justify-end">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-p text-gray-6 transition-colors dark:text-gray-4 hover:text-sky-5 focus-visible:underline dark:hover:text-sky-4"
          >
            <Home2LineSvg aria-hidden="true" className="h-4 w-4 shrink-0" />
            返回测验
          </Link>
        </div>
        <h1 className="flex-1 text-center text-h1 text-common-color font-bold">
          {title}
        </h1>
        <div aria-hidden="true" className="flex-1" />
      </header>
      <MarkdownContent markdown={markdown} />
    </div>
  );
}

export function MarkdownContent({ markdown }: Pick<MarkdownProps, "markdown">) {
  return (
    <article className="markdown-body">
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
