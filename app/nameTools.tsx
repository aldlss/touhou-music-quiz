import Link from "next/link";
import { separator } from "./constant";
import { Fragment } from "react";

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
 * @param musicRouteName 包含路径的曲子
 * @returns 用于渲染展示的 JSX.Element
 */
export function getDisplayMusicNameFromRouteName(musicRouteName: string) {
  const names = splitMusicRouteName(musicRouteName);
  return (
    <>
      {names?.map((name, idx) => {
        if (idx === 0) {
          return <Fragment key={name}></Fragment>;
        } else if (idx === names.length - 1) {
          const nameWithoutIdx = getMusicPureNameFromIdxName(name);
          return (
            <Link
              href={`https://thwiki.cc/${nameWithoutIdx}`}
              target="_blank"
              key={name}
            >
              <span className="text-link">{nameWithoutIdx}</span>
            </Link>
          );
        } else if (idx === 1 || idx === 2) {
          return (
            <span key={name}>
              {/* 最后一个才加 “的” */}
              {`${name}中${names.length - idx === 2 ? "的" : ""}`}
            </span>
          );
        } else {
          return <Fragment key={name}></Fragment>;
        }
      })}
    </>
  );
}
