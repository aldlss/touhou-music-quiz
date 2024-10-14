/**
 * 水塘抽样
 * @param arr 进行抽样的数组
 * @param k 抽样的数量
 * @returns 返回抽样的结果
 */
export function reservoirSampling<T>(arr: T[], k: number): T[] {
  let reservoir = arr.slice(0, k);
  for (let i = k; i < arr.length; i++) {
    // 需要 i + 1 才是计算对的
    const j = Math.floor(Math.random() * (i + 1));
    if (j < k) {
      reservoir[j] = arr[i];
    }
  }
  return reservoir;
}

/**
 * 二分查找
 * @param list 需要进行二分查找的数组
 * @param cmp 二分查找比较函数，返回值大于 0 则往 end 方向查找，等于 0 返回当前值，小于 0 则往 start 方向查找
 * @returns 返回查找到的值，如果没有找到则返回 null
 */
export function binarySearch<T>(list: T[], cmp: (mid: T) => number): T | null {
  const l = 0,
    r = list.length;
  const search = (l: number, r: number): T | null => {
    if (l > r) {
      return null;
    }
    const mid = (l + r) >> 1;
    const res = cmp(list[mid]);
    if (res === 0) {
      return list[mid];
    } else if (res > 0) {
      return search(mid + 1, r);
    } else {
      return search(l, mid - 1);
    }
  };
  return search(l, r);
}
