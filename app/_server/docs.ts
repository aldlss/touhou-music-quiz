import "server-only";

// 如果有结尾的 / 则去掉
const fetchBase: string = `${process.env.NEXT_PUBLIC_FETCH_BASE}`.endsWith(
  "/",
)
  ? `${process.env.NEXT_PUBLIC_FETCH_BASE}`.slice(0, -1)
  : `${process.env.NEXT_PUBLIC_FETCH_BASE}`;

export async function fetchDocsText(path: string): Promise<string> {
  const url = `${fetchBase}/${path}`;
  const res = await fetch(url, {
    next: { revalidate: 86_400, tags: ["docs"] },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return await res.text();
}
