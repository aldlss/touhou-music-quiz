# 开发思路

先说一下流程的大概思路，首先是对曲子进行了以 1秒 为间隔的切分，然后播放的时候是获取一定量的曲子进行合并或切分等处理，并播放。比如说要播放 5s 的曲子，就会获取连续的 5 个 1秒 的曲子进行合并后播放。不过因为我切的似乎解码后并没有 1s 因此有时候会多获取一个，不过结果的秒数是不变的。

为什么是这样处理，主要是一是这样可以做到近乎随机片段的效果，二是这样大概也比较节省流量吧。

## 关键的两个外部输入

分别是曲子的分类和切分信息，这个存储在了一个 yaml 文件中，对应了环境变量中的 `NEXT_PUBLIC_FETCH_DATA_URL`；以及曲子的切片后资源，对应环境变量中的 `NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX`。

曲子的分类和切分信息是一个 yaml 文件，首先有如下两个定义：
```typescript
export type Music = {
    idx: number; // 表明序号，用于展示时排序
    name: string; // 曲子名
    amount: number; // 切分后的数量，以 1s 为单位切分
};

type MusicCollection = {
    idx: number; // 表明序号，用于展示时排序
    name: string; // 曲子集合名
    data: MusicCollection[] | Music[]; // 具体数据，有可能是一个下属的集合数组，也有可能是一个 Music 数组
};
```

大概允许嵌套三四层，即如下:
`MusicCollection -> MusicCollection -> MusicCollection -> MusicCollection -> Music`
或
`MusicCollection -> MusicCollection -> MusicCollection -> Music`
参考[目前使用的文件](./musicData.yaml)，对应起名字其中一个路径大概如下：
`Touhou Project -> 格斗游戏OST -> 贪欲之兽的音乐 -> ORIGINAL DISC 2 -> 天理人欲`

关于音乐资源，目前命名是这样的，比如说上面这首天理人欲，是这样处理
`格斗游戏OST//贪欲之兽的音乐//ORIGINAL DISC 2//8. 天理人欲//xxx.ogg`
其中，`//` 为分隔符，在 `constant.ts` 文件中有定义，`8. `为序号，其中数字是 idx - 1，`xxx` 是从 0 开始的数字，表示分割后的编号，`.ogg` 是后缀名，目前使用的是 ogg/opus 格式。
这之后，把 `.ogg` 前的名字使用 `SHA-1` 算法求摘要，即对 `格斗游戏OST//贪欲之兽的音乐//ORIGINAL DISC 2//8. 天理人欲//xxx` 求摘要，然后再加上 `.ogg` 后缀，就是要获取的文件名。
