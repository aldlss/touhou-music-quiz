# 部署相关

## 环境变量

分为写在 `.env` 和 `.env.local` 中的环境变量，主要是处于安全性考虑，当然写在一起也不是不行。

### .env

`NEXT_PUBLIC_QUIZ_BUFFER_SIZE`: 预加载的曲子数量，若不设置或者为无效值，则默认为 `auto`，即 Easy、Normal 难度缓存为 2，Hard、Lunatic 难度缓存为 1

`NEXT_PUBLIC_PREVIOUS_QUIZ_SET_CAPACITY`: 用于记录之前的 Quiz 的 SET 的大小，用于防止短期内重复，若不设置或为无效值或值小于 0，则默认为 10

### .env.local

`API_CLEAN_PASSWORD`: 清除 nextjs 数据缓存时的密码，如 `awpgijseopighjewsihougblns`

`NEXT_PUBLIC_FETCH_DATA_URL`: 获取曲子划分数据时的 URL，如 `https://raw.githubusercontent.com/xxx/yyy/zzz.yaml`

`NEXT_PUBLIC_FETCH_MUSIC_NAMES_URL`: 曲库名称 JSON 的完整 URL 模板，必须包含 `{locale}`，例如 `https://example.com/names/{locale}.json`。正式环境和开发环境可分别指向对应的名称文件。

`NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX`: 获取音乐文件时的 URL 前缀，如 `https://raw.githubusercontent.com/xxx/yyy/zzz/`（主要是为了方便更改）

+ 会获取 `NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX/` 下的音乐文件

+ 关于 `NEXT_PUBLIC_FETCH_DATA_URL`、`NEXT_PUBLIC_FETCH_MUSIC_NAMES_URL` 和 `NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX`，可以参考 [开发思路](./develop.md) 中的说明。

## 注意事项

由于实现的原因，需要在安全上下文中部署该网页。

## 清理缓存

`GET /clean-all` 用于清理当前部署的服务端缓存。`clean_password` 参数必须与该部署环境中的 `API_CLEAN_PASSWORD` 一致。

带 `tag` 参数时，使对应的数据缓存立即过期。例如，清理曲库数据：

```text
/clean-all?clean_password=<密码>&tag=music-collection
```

项目使用的数据 tag：

| tag | 缓存内容 |
| --- | --- |
| `music-collection` | 曲库元数据 |
| `music-names` | 所有语言的曲库名称 |
| `music-names-en`、`music-names-ja` | 对应语言的曲库名称 |
| `docs` | 文档内容 |

不带 `tag` 参数时，使根布局下的页面缓存失效，覆盖各语言页面和文档页：

```text
/clean-all?clean_password=<密码>
```

需要同时更新数据和页面缓存时，先清理相关 tag，再发起不带 `tag` 的请求。缓存会在下次访问时重新生成，已经打开的页面需要重新加载。

成功时返回 `revalidated: true`，以及本次处理的 `tag` 或 `path`。密码错误时返回 HTTP 401；部署环境未配置 `API_CLEAN_PASSWORD` 时返回 HTTP 503。
