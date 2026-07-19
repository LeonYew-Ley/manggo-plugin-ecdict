# Manggo ECDICT 离线英汉词典插件

基于 [ECDICT](https://github.com/skywind3000/ECDICT) 的 Manggo 原生离线词典插件。查词逻辑参考 [pot-app-translate-plugin-ecdict](https://github.com/pot-app/pot-app-translate-plugin-ecdict)，适配 Manggo `manggo.plugin.v1` 结构化词典格式。

## 安装

1. 从 [Releases](https://github.com/LeonYew-Ley/manggo-plugin-ecdict/releases) 下载 `.mplugin` 文件
2. 打开 Manggo → 插件管理 → 安装插件
3. 在翻译服务设置中添加 **ECDICT**

安装包体积较大（含完整 `stardict.db`，约两百兆以上）。

## 本地打包

需要能访问 GitHub 以下载 ECDICT SQLite 发行包。

```powershell
# Windows
.\package.ps1
```

```bash
# macOS / Linux
./package.sh
```

产物位于 `dist/com.leonyew.ecdict.mplugin`。

## 开发说明

| 文件 | 说明 |
| --- | --- |
| `manggo.plugin.json` | 插件清单，`resultType: "dictionary"` |
| `main.js` | 使用 Bun `bun:sqlite` 查询 `stardict.db` |
| `package.ps1` / `package.sh` | 下载词典库并打包 `.mplugin` |

词典数据库不会提交到 Git；构建时从 ECDICT `1.0.28` 发行版下载。

### 手动验证

```bash
bun test
bun ./scripts/verify-real-db.mjs   # 需要先运行 package 脚本下载 stardict.db
```

在已安装 Manggo 的 Windows 上，可用官方插件 runner 做联调：

```powershell
.\package.ps1
.\scripts\verify-manggo-runner.ps1
bun ./scripts/register-manggo-provider.mjs   # 可选：写入翻译服务实例
```

然后重启 Manggo，在翻译服务中确认 **ECDICT** 可用。

## 致谢

- 词典数据：[skywind3000/ECDICT](https://github.com/skywind3000/ECDICT)
- Pot 插件实现参考：[pot-app/pot-app-translate-plugin-ecdict](https://github.com/pot-app/pot-app-translate-plugin-ecdict)
- Manggo 插件格式：[Pylogmon/manggo-plugin](https://github.com/Pylogmon/manggo-plugin)

## License

本仓库代码以 MIT 许可发布。ECDICT 数据请遵循其上游许可证。
