"use client";

import { initThemeStore } from "../_store/themeStore";
import { InitClientConstant } from "../clientConstant";
import {
  GetLocalStorageValue,
  LocalStorageKey,
  ClearLocalStorage,
  SetLocalStorageValue,
} from "./localStorage";

export function isClientSide() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function initClient() {
  // 设置客户端的一些基本信息
  InitClientConstant();
  window.AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  window.OfflineAudioContext =
    window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;

  // 检查是否过期，过期则清除一遍 localStorage，设置过期时间十五天
  const expireTimeDelta = 15 * 24 * 60 * 60 * 1000;
  // Number(null)为 0，大概不用担心
  const expireTime = Number(GetLocalStorageValue(LocalStorageKey.ExpireTime));
  if (expireTime + expireTimeDelta < Date.now() || isNaN(expireTime)) {
    ClearLocalStorage();
    SetLocalStorageValue(
      LocalStorageKey.ExpireTime,
      (Date.now() + expireTimeDelta).toString(),
    );
  }

  initThemeStore();
}

if (isClientSide()) {
  initClient();
}
