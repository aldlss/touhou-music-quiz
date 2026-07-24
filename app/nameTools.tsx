import Link from "next/link";
import { type QuizMusic } from "./types";

/**
 * 展示曲目的完整分类路径和当前语言名称。
 *
 * 分类路径与曲名之间使用斜杠分隔；曲名链接仍使用中文原名定位 THBWiki 页面。
 *
 * @param music 当前测验使用的曲目信息
 * @returns 用于展示完整曲名的元素
 */
export function DisplayMusicName({ music }: { music: QuizMusic }) {
  return (
    <span>
      {music.collectionPath.map((collectionName, index) => (
        <span key={`${index}-${collectionName}`}>{collectionName} / </span>
      ))}
      <Link href={`https://thwiki.cc/${music.wikiName}`} target="_blank">
        <span className="text-link">{music.name}</span>
      </Link>
    </span>
  );
}
