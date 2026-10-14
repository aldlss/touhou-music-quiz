import "client-only";
import { isClientSide } from "./environment";

let localStorageAvailable = false;
const memoryStorage = new Map<LocalStorageKey, string>();

export enum LocalStorageKey {
  /** 用于测试 local storage 是否可用 */
  StorageTest = "__storage_test__",
  /** local storage 过期时间 */
  ExpireTime = "expire_time",
  /** 当前主题设置：`auto` `light` `dark` */
  ThemeAppearance = "theme_appearance",
  /** 用户昵称 */
  Nickname = "nickname",
  /** 游戏中的音量设置：`0 ~ 1.0`*/
  THM_Volume = "thm_volume",
  /** 是否是未访问过的新用户：`0`：否 `1`：是 */
  THM_FirstVisit = "thm_first_visit",
}

export function initLocalStorage() {
  localStorageAvailable = checkLocalStorageAvailable();
}

function checkLocalStorageAvailable(): boolean {
  try {
    const storage = window.localStorage;
    const x = LocalStorageKey.StorageTest;
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch {
    return false;
  }
}

/** 保存成功返回 true；浏览器存储不可用时仅保存在内存，刷新后丢失。 */
export function SetLocalStorageValue(key: LocalStorageKey, value: string) {
  if (!isClientSide()) {
    return false;
  }
  if (localStorageAvailable) {
    window.localStorage.setItem(key, value);
  } else {
    memoryStorage.set(key, value);
  }
  return true;
}

/**
 * 获取 localStorage 中的值
 * @param key localStorage 键
 * @return localStorage 中的值，如果不存在则返回 null
 */
export function GetLocalStorageValue(key: LocalStorageKey): string | null;
/**
 * 获取 localStorage 中的值
 * @param key localStorage 键
 * @param defaultValue 默认值，如果存储中不存在该键，会设置该键的值为 `defaultValue`
 * @param writeDefaultValue 是否在存储中不存在该键时设置默认值，默认为 `true`
 * @return localStorage 中的值，如果不存在则返回 `defaultValue`
 */
export function GetLocalStorageValue(
  key: LocalStorageKey,
  defaultValue: string,
  writeDefaultValue?: boolean,
): string;
export function GetLocalStorageValue(
  key: LocalStorageKey,
  defaultValue?: string,
  writeDefaultValue = true,
) {
  if (!isClientSide()) {
    return defaultValue ?? null;
  }
  const value = localStorageAvailable
    ? window.localStorage.getItem(key)
    : memoryStorage.get(key) ?? null;
  if (value !== null) return value;
  if (defaultValue === undefined) return null;
  if (writeDefaultValue) {
    SetLocalStorageValue(key, defaultValue);
  }
  return defaultValue;
}

export function ClearLocalStorage() {
  if (!isClientSide()) return;
  memoryStorage.clear();
  if (localStorageAvailable) {
    window.localStorage.clear();
  }
}
