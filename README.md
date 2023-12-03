# 东方原曲认知测验（无尽版）

## 环境变量
`API_CLEAN_PASSWORD`: 清除 nextjs 数据缓存时的密码，如 `awpgijseopighjewsihougblns`

`NEXT_PUBLIC_FETCH_DATA_URL`: 获取曲子划分数据时的 URL，如 `https://raw.githubusercontent.com/xxx/yyy/zzz.yaml`

`NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX`: 获取音乐文件时的 URL 前缀，如 `https://raw.githubusercontent.com/xxx/yyy/zzz/`（主要是为了方便更改）

+ 会获取 `NEXT_PUBLIC_FETCH_DATA_URL` 和 `NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX/` 下的音乐文件

`NEXT_PUBLIC_QUIZ_BUFFER_SIZE`: 预加载的曲子数量，若不设置或者为无效值，则默认为 `auto`，即 Easy、Normal 难度缓存为 2，Hard、Lunatic 难度缓存为 1

`NEXT_PUBLIC_PREVIOUS_QUIZ_SET_CAPACITY`: 用于记录之前的 Quiz 的 SET 的大小，用于防止短期内重复，若不设置或为无效值或值小于 0，则默认为 10


## 注意事项

由于实现的原因，需要在安全上下文中部署该网页。