/** 创建一局测验的选曲器；每次抽取（含预加载和加载失败）都会计数。 */
export function createMusicPicker<T extends { uuid: string }>(
  musicList: readonly T[],
  recentCapacity: number,
  random: () => number = Math.random,
): () => T {
  const available = [
    ...new Map(musicList.map((item) => [item.uuid, item])).values(),
  ];
  if (available.length === 0) throw new Error("选曲列表不能为空");

  // 沿用小曲库的去重范围，至少保留三首可选；不足三首时不排除。
  const capacity = Math.min(
    Math.max(0, Math.floor(recentCapacity) || 0),
    Math.max(0, available.length - 3),
  );
  const counts = new Map<string, number>();
  const recent: T[] = [];
  let recentIndex = 0;

  return () => {
    const firstIndex = Math.floor(random() * available.length);
    let selectedIndex = firstIndex;
    let selected = available[firstIndex];

    if (available.length > 1) {
      // 从剩余位置抽第二首，无须反复重抽来排除第一首。
      let secondIndex = Math.floor(random() * (available.length - 1));
      if (secondIndex >= firstIndex) secondIndex++;
      const second = available[secondIndex];
      const firstCount = counts.get(selected.uuid) ?? 0;
      const secondCount = counts.get(second.uuid) ?? 0;
      if (
        secondCount < firstCount ||
        (secondCount === firstCount && random() < 0.5)
      ) {
        selected = second;
        selectedIndex = secondIndex;
      }
    }

    counts.set(selected.uuid, (counts.get(selected.uuid) ?? 0) + 1);
    if (capacity > 0) {
      // 用末项填补选中位置，池内顺序不影响等概率抽样。
      const last = available.pop()!;
      if (selectedIndex < available.length) available[selectedIndex] = last;

      if (recent.length < capacity) {
        recent.push(selected);
      } else {
        // 环形队列放回到期曲目，避免 shift 随去重容量线性移动元素。
        available.push(recent[recentIndex]);
        recent[recentIndex] = selected;
        recentIndex = (recentIndex + 1) % capacity;
      }
    }
    return selected;
  };
}
