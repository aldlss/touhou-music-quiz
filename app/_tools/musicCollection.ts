import type { Music, MusicCollection, QuizMusic } from "../types";

export function isMusicCollection(
  item: Music | MusicCollection,
): item is MusicCollection {
  return (item as MusicCollection).data !== undefined;
}

export function isMusicCollectionList(
  items: Music[] | MusicCollection[],
): items is MusicCollection[] {
  return items.length === 0 || isMusicCollection(items[0]);
}

export function isMusicList(
  items: Music[] | MusicCollection[],
): items is Music[] {
  return items.length === 0 || !isMusicCollection(items[0]);
}

export const setMusicCollectionSelected = (
  musicCollection: MusicCollection,
  selected: boolean,
): number => {
  let sum = 0;

  for (const item of musicCollection.data) {
    if (isMusicCollection(item)) {
      const count = setMusicCollectionSelected(item, selected);
      sum += count;
    } else {
      item.selected = selected;
      sum += selected ? 1 : 0;
    }
  }
  musicCollection.selected = sum;
  return sum;
};

export const selectMusicCollectionBySid = (
  sid: number,
  musicCollection: MusicCollection,
): number => {
  if (sid === musicCollection.sid) {
    // 保存旧值，手动计算差值
    const oldSelected = musicCollection.selected;
    musicCollection.selected = setMusicCollectionSelected(
      musicCollection,
      !musicCollection.selected,
    );
    return musicCollection.selected - oldSelected;
  }

  let delta = 0;
  for (const item of musicCollection.data) {
    if (isMusicCollection(item)) {
      if (sid > item.sid) {
        // 因为父类的 sid 是大于所有子项的，所以如果 sid 大于当前项，那么就不用继续往里找了
        continue;
      }
      // 预期返回差值
      delta = selectMusicCollectionBySid(sid, item);
      // 保险一点
      if (delta !== 0) {
        break;
      }
    } else if (item.sid === sid) {
      item.selected = !item.selected;
      delta = item.selected ? 1 : -1;
      break;
    }
  }
  musicCollection.selected += delta;
  return delta;
};

// 返回的是 filter 后的深拷贝
export function filterMusicCollection(
  musicCollection: MusicCollection,
  ifFilter: (item: Music | MusicCollection) => boolean,
): MusicCollection {
  const temp: MusicCollection = {
    ...musicCollection,
    data: [],
  };
  if (musicCollection.data.length === 0) return temp;
  if (isMusicCollectionList(musicCollection.data)) {
    for (const item of musicCollection.data) {
      if (ifFilter(item)) {
        (temp.data as MusicCollection[]).push(
          filterMusicCollection(item, ifFilter),
        );
      }
    }
  } else {
    for (const item of musicCollection.data) {
      if (ifFilter(item)) {
        (temp.data as Music[]).push({ ...item });
      }
    }
  }
  return temp;
}

export function flattenMusicCollection(
  musicCollection: MusicCollection,
  collectionPath: string[] = [],
): QuizMusic[] {
  const result: QuizMusic[] = [];
  if (isMusicList(musicCollection.data)) {
    for (const music of musicCollection.data) {
      result.push({
        sid: music.sid,
        amount: music.amount,
        name: music.name,
        wikiName: music.wikiName,
        collectionPath,
        uuid: music.uuid,
      });
    }
  } else {
    // 这样做会造成顶层 musicColletion 的 name 是写不进去的，但是正符合要求
    for (const collection of musicCollection.data) {
      result.push(
        ...flattenMusicCollection(collection, [
          ...collectionPath,
          collection.name,
        ]),
      );
    }
  }
  return result;
}
