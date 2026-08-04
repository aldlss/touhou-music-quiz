import "client-only";

import { fetchMusicUrlPrefix } from "../constant";
import { ErrorType } from "../types";

export let isSupportOggOpus = false;

export function initAudioCapability() {
  const urlParams = new URLSearchParams(window.location.search);
  const isSupportOggOpusParam = urlParams.get("dev_supportOggOpus");
  if (isSupportOggOpusParam !== null) {
    isSupportOggOpus = isSupportOggOpusParam === "true";
  } else {
    isSupportOggOpus = checkIsSupportOggOpus();
  }
}

function checkIsSupportOggOpus() {
  const audio = document.createElement("audio");
  return audio.canPlayType("audio/ogg; codecs=opus") !== "";
}

/**
 * 根据曲子的 uuid 获取曲子
 * @param uuid 曲子的 uuid
 * @param idx 曲子片段的索引
 * @returns 返回曲子的 ArrayBuffer
 */
export const fetchMusicByUuid = async (uuid: string, idx: number) => {
  const fileName = `${uuid[0]}/${uuid}/${idx}.ogg`;
  const response = await fetch(`${fetchMusicUrlPrefix}${fileName}`, {
    headers: { Accept: "audio/ogg" },
  });
  if (!response.ok) {
    throw Error(ErrorType.NetworkError, {
      cause: `${response.status} ${response.statusText}`,
    });
  }
  return await response.arrayBuffer();
};
