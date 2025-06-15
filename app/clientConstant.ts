import { checkIsSupportOggOpus } from "./tools";
import { CheckLocalStorageAvailable } from "./_tools/localStorage";

// 确定浏览器类型，操作系统类型，以及是否支持 localStorage
export let localStorageAvailable: boolean = false;
export let isSupportOggOpus: boolean = false;

export function InitClientConstant() {
  localStorageAvailable = CheckLocalStorageAvailable();
  isSupportOggOpus = checkIsSupportOggOpus();
}
