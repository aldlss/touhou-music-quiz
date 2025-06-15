import { localStorageAvailable } from "../clientConstant";

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

export function CheckLocalStorageAvailable(): boolean {
  try {
    const storage = window.localStorage;
    const x = LocalStorageKey.StorageTest;
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

export function SetLocalStorageValue(key: LocalStorageKey, value: string) {
  if (!localStorageAvailable) {
    return false;
  }
  window.localStorage.setItem(key, value);
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
 * @param defaultValue 默认值，如果 localStorage 中不存在该键，会设置该键的值为 `defaultValue`
 * @return localStorage 中的值，如果不存在则返回 `defaultValue`
 */
export function GetLocalStorageValue(
  key: LocalStorageKey,
  defaultValue: string,
): string;
export function GetLocalStorageValue(
  key: LocalStorageKey,
  defaultValue?: string,
) {
  if (!localStorageAvailable) {
    return defaultValue ?? null;
  }
  const value = window.localStorage.getItem(key);
  if (defaultValue === undefined) {
    return value ?? null;
  } else {
    if (value === null) {
      SetLocalStorageValue(key, defaultValue);
      return defaultValue;
    } else {
      return value;
    }
  }
}

export function ClearLocalStorage() {
  if (!localStorageAvailable) {
    return;
  }
  window.localStorage.clear();
}
