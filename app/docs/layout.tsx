import "./github-markdown-host-color-var.css";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="p-1">{children}</main>;
}
