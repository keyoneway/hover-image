<div align="center">

**Hi there 👋 I'm keyoneway**<br/>
No-code builder empowered by AI. Explore possibilities, build practical tools,<br/>
and create real value in the AI era.

AI赋能的零代码创造者｜探索更多可能，打造实用工具，在AI时代创造真实价值

<br/>

[<img src="https://img.shields.io/badge/Xiaohongshu-%23FF2442?style=for-the-badge&logo=xiaohongshu&logoColor=white"/>](https://www.xiaohongshu.com/user/profile/5b9fd545f7e8b92f54dae9d9)
[<img src="https://img.shields.io/badge/Douyin-%23000000?style=for-the-badge&logo=tiktok&logoColor=white"/>](https://www.douyin.com/user/MS4wLjABAAAAOZgIpVr4F9IvTNFIXW_Z2Q61Z58RMMhvRCcMUn55ErMv9-DRPXQ2a86IY6hGE3Ld)
<br/><br/>
</div>

---

## 🛠 Featured Project
- **Hover Image**｜给 Obsidian 笔记里的文字或网址绑定图片，鼠标悬浮时预览，不占正文空间。

<div align="center">

**[English](#hover-image)**  **[中文说明](#中文说明)**

</div>

<a id="hover-image"></a>
# Hover Image
Bind an image already in your Obsidian vault to selected text or a website link. The note shows only the text; hovering over it previews the image, and moving away closes the preview. Links remain clickable.

## Features
- Pick an image from thumbnail galleries for the current note or the whole vault. Search vault images by filename or folder.
- When an image embed immediately follows a selected link, preselect it and optionally remove that embed from the note after binding. The image file is kept.
- Preview images on hover in Reading view or non-editing lines of Live Preview.
- Right-click bound text to replace its image or remove the association without deleting the image file.
- Store bindings in the Markdown note itself, without a separate database.

## Install
In Obsidian, open **Settings → Community plugins → Browse**, search for **Hover Image**, install it, and enable it. If the listing has not yet appeared in the app, download `manifest.json`, `main.js`, and `styles.css` from the [latest GitHub release](https://github.com/keyoneway/hover-image/releases/latest), put them in `<your-vault>/.obsidian/plugins/hover-image/`, and enable the plugin under **Settings → Community plugins**.

## Use
1. In Edit view, select a complete URL, Markdown link, or plain text.
2. Right-click and choose **设置悬浮图片**, or run **为选中文本设置悬浮图片** from the Command Palette.
3. Choose an existing image thumbnail under **当前笔记** (Current note) or **仓库全部图片** (All vault images), then confirm.
4. Hover over the bound text to preview. Right-click it in Reading view to replace or remove the image association.

## Limitations
- The note stores the binding as HTML attributes. Source mode and the line currently being edited in Live Preview can show this markup.
- Images must already be in the vault. The picker does not paste screenshots, fetch website screenshots, or download remote image URLs.
- Moving or renaming a bound image does not automatically update its stored path.
- The image-first workflow (select an image, then choose text) is not implemented.

## Development
```bash
npm install
npm test
npm run check
npm run build
```

## 中文说明

### 适用场景

比如整理网站参考清单时，只想在笔记里保留网址，不想让整张首页截图占据正文。先把截图放进 Obsidian 仓库（可以直接粘贴到当前笔记），再用 Hover Image 把截图绑定到网址上；鼠标移到网址时才显示图片。

### 使用方法

1. 在编辑视图选中完整的网址、Markdown 链接或普通文字。
2. 右键点击「设置悬浮图片」，也可以在命令面板搜索「为选中文本设置悬浮图片」。
3. 在「当前笔记」或「仓库全部图片」中点击图片缩略图，再点「确定」。仓库图片可以按文件名或文件夹搜索。
4. 如果网址下方紧跟着正文图片，弹窗会优先选中这张图；可以选择在绑定后移除正文中的图片嵌入，附件文件不会被删除。
5. 在阅读视图或实时预览的非编辑行悬浮文字查看图片。右键已绑定的文字，可更换图片或移除关联；移除关联不会删除图片文件。

### 安装

在 Obsidian「设置 → 第三方插件 → 浏览」中搜索 **Hover Image**，安装并启用。如果插件暂未出现在应用内搜索结果中，可以先从 [GitHub 最新版本](https://github.com/keyoneway/hover-image/releases/latest)下载 `manifest.json`、`main.js`、`styles.css`，放入仓库的 `.obsidian/plugins/hover-image/` 文件夹，再在「第三方插件」中启用。

### 数据与限制

- 关联信息以 HTML 属性保存在笔记中，不依赖额外数据库；源码模式和实时预览正在编辑的行会显示相关标记。
- 只能选择仓库里已有的图片；弹窗不支持直接粘贴新截图，也不会抓取网页首页或下载远程图片。
- 图片被移动或重命名后，已保存的图片路径不会自动更新。
- 暂未实现「先选图片、再指定文字」的反向操作。

## License

MIT. See [LICENSE](LICENSE).
