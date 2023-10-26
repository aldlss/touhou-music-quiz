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
