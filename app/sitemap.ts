import type { MetadataRoute } from "next";
import { SITE_URL } from "./constant";

const homepageLanguages = {
  "zh-CN": SITE_URL,
  en: `${SITE_URL}/en`,
  ja: `${SITE_URL}/ja`,
  "x-default": SITE_URL,
};

const homepages = [SITE_URL, `${SITE_URL}/en`, `${SITE_URL}/ja`];

const docsPages = [
  { path: "/docs/selected", priority: 0.5 },
  { path: "/docs/same-name", priority: 0.5 },
  { path: "/docs/version", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...homepages.map((url) => ({
      url,
      priority: 1,
      alternates: { languages: homepageLanguages },
    })),
    ...docsPages.map(({ path, priority }) => ({
      url: `${SITE_URL}${path}`,
      priority,
    })),
  ];
}
