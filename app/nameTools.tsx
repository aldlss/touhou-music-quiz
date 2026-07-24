import Link from "next/link";
import { separator } from "./constant";
import { useTranslations } from "next-intl";

/**
 * 将包含路径的曲子按分隔符分割并返回
 * @param musicRouteName 包含路径的曲子
 * @returns 分割后字符串数组
 */
export function splitMusicRouteName(musicRouteName: string) {
  return musicRouteName.split(separator);
}

/**
 * 通过带序号的曲子名字返回不带序号的名字
 * @param musicPureName 例：`2. Lunatic Dreamer`
 * @returns 例：`Lunatic Dreamer`
 */
export function getMusicPureNameFromIdxName(musicPureName: string) {
  return musicPureName.replace(/^\d+\. */, "");
}

/**
 * 通过包含路径的曲子全名返回带序号的名字
 * @param musicRouteName 例：`Windows作品//TH16.5 	秘封噩梦日记//2. Lunatic Dreamer`
 * @returns 例：`2. Lunatic Dreamer`
 */
export function getMusicIdxNameFromRouteName(musicRouteName: string) {
  const split = splitMusicRouteName(musicRouteName);
  return split[split.length - 1];
}

/**
 * 通过包含路径的曲子全名返回不带序号的名字
 * @param musicRouteName 例：`Windows作品//TH16.5 	秘封噩梦日记//2. Lunatic Dreamer`
 * @returns 例：`Lunatic Dreamer`
 */
export function getMusicPureNameFromRouteName(musicRouteName: string) {
  return getMusicPureNameFromIdxName(
    getMusicIdxNameFromRouteName(musicRouteName),
  );
}

/**
 * 通过包含路径的曲子全名返回用于展示渲染的全名
 * @param name 中文路径名称
 * @param displayName 当前语言的展示路径名称
 * @returns 用于渲染展示的 JSX.Element
 */
export function DisplayMusicName({
  name,
  displayName,
}: {
  name: string;
  displayName: string;
}) {
  const t = useTranslations("MusicName");
  const displayNames = splitMusicRouteName(displayName);
  const sourceMusicName = getMusicPureNameFromRouteName(name);
  const musicName = getMusicPureNameFromRouteName(displayName);
  const pathNames = displayNames.slice(1, -1).slice(0, 2);
  const pathPrefix =
    pathNames.length === 2
      ? t("doublePathPrefix", {
          parent: pathNames[0],
          collection: pathNames[1],
        })
      : pathNames.length === 1
        ? t("singlePathPrefix", { collection: pathNames[0] })
        : "";

  return (
    <span>
      {pathPrefix}
      <Link href={`https://thwiki.cc/${sourceMusicName}`} target="_blank">
        <span className="text-link">{musicName}</span>
      </Link>
    </span>
  );
}
