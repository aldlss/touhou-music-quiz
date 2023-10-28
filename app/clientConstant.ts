import {
    CheckLocalStorageAvailable,
    checkBrowserType,
    CheckOsType,
} from "./tools";
import { BrowserType, OsType } from "./types";

// 确定浏览器类型，操作系统类型，以及是否支持 localStorage
export let localStorageAvailable: boolean = false;
export let browserType: BrowserType = BrowserType.Other;
export let osType: OsType = OsType.Other;

export function InitClientConstant() {
    localStorageAvailable = CheckLocalStorageAvailable();
    browserType = checkBrowserType(navigator.userAgent);
    osType = CheckOsType(navigator.userAgent);
}
