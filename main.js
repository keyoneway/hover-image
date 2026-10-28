"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HoverImagePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/markup.ts
var attr = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var html = (value) => attr(value).replace(/'/g, "&#39;");
var unattr = (value) => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
function bindImage(source, imagePath, id) {
  if (!source.trim() || !imagePath.trim()) throw new Error("Text and image path are required");
  const original = attr(encodeURIComponent(source));
  const base = `class="hover-image-target" data-hover-id="${attr(id)}" data-hover-image="${attr(imagePath)}" data-hover-original="${original}"`;
  const md = source.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
  if (md) return `<a href="${attr(md[2])}" ${base}>${html(md[1])}</a>`;
  if (/^https?:\/\/[^\s<>]+$/.test(source)) return `<a href="${attr(source)}" ${base}>${html(source)}</a>`;
  return `<span ${base}>${html(source)}</span>`;
}
function imagePathFromMarkup(markup) {
  const match = markup.match(/\bdata-hover-image="([^"]*)"/);
  return match ? unattr(match[1]) : null;
}
function changeImage(markup, imagePath) {
  if (!imagePath.trim() || !imagePathFromMarkup(markup)) throw new Error("Invalid image binding");
  return markup.replace(/\bdata-hover-image="[^"]*"/, `data-hover-image="${attr(imagePath)}"`);
}
function removeImage(markup) {
  const match = markup.match(/\bdata-hover-original="([^"]*)"/);
  if (!match) throw new Error("Invalid image binding");
  return decodeURIComponent(unattr(match[1]));
}

// src/note-images.ts
function scanNoteImages(source) {
  var _a, _b;
  const images = [];
  let inFence = false;
  for (const [line, text] of source.split("\n").entries()) {
    if (/^\s*(```|~~~)/.test(text)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const pattern = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]|!\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g;
    for (const match of text.matchAll(pattern)) {
      images.push({
        linkpath: ((_b = (_a = match[1]) != null ? _a : match[2]) != null ? _b : match[3]).trim(),
        line,
        raw: match[0],
        standalone: text.trim() === match[0]
      });
    }
  }
  return images;
}
function adjacentImage(source, anchorLine, images) {
  var _a;
  const lines = source.split("\n");
  for (let line = anchorLine + 1; line < lines.length; line++) {
    if (!lines[line].trim()) continue;
    return (_a = images.find((image) => image.line === line && image.standalone)) != null ? _a : null;
  }
  return null;
}

// src/popup-position.ts
function popupPosition(link, popup, viewport) {
  const anchor = link.left + link.width * 0.6;
  const left = Math.max(8, Math.min(anchor, viewport.width - popup.width - 8));
  const below = link.bottom + 8;
  const top = below + popup.height > viewport.height - 8 ? Math.max(8, link.top - popup.height - 8) : below;
  return { left, top };
}

// src/main.ts
var IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;
var MARKUP = /<(a|span)\b[^>]*\bdata-hover-id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/g;
function findBinding(source, id) {
  for (const match of source.matchAll(MARKUP)) {
    if (match[2] === id && match.index !== void 0) {
      return { start: match.index, end: match.index + match[0].length, markup: match[0] };
    }
  }
  return null;
}
var BindModal = class extends import_obsidian.Modal {
  constructor(app, initialPath, noteFile, noteSource, selectedLine, onConfirm) {
    var _a, _b, _c, _d, _e, _f;
    super(app);
    this.initialPath = initialPath;
    this.onConfirm = onConfirm;
    __publicField(this, "path", "");
    __publicField(this, "galleryEl", null);
    __publicField(this, "noteGalleryEl", null);
    __publicField(this, "vaultGalleryEl", null);
    __publicField(this, "vaultImages", null);
    __publicField(this, "renderedScopes", { note: false, vault: false });
    __publicField(this, "searchEl", null);
    __publicField(this, "selectedEl", null);
    __publicField(this, "removeRow", null);
    __publicField(this, "removeInput", null);
    __publicField(this, "galleryScope", "note");
    __publicField(this, "selected", null);
    __publicField(this, "noteImages");
    __publicField(this, "recommended");
    const images = scanNoteImages(noteSource);
    const adjacent = selectedLine === null ? null : adjacentImage(noteSource, selectedLine, images);
    this.noteImages = images.flatMap((embed) => {
      const file = app.metadataCache.getFirstLinkpathDest(embed.linkpath, noteFile.path);
      return file && IMAGE_EXTENSIONS.test(file.name) ? [{ file, embed, recommended: embed === adjacent }] : [];
    });
    this.recommended = (_a = this.noteImages.find((image) => image.recommended)) != null ? _a : null;
    const initialFile = initialPath ? app.vault.getAbstractFileByPath(initialPath) : null;
    this.selected = (_c = (_b = this.recommended) != null ? _b : this.noteImages.find((image) => image.file.path === initialPath)) != null ? _c : initialFile instanceof import_obsidian.TFile ? { file: initialFile } : null;
    if (!this.noteImages.length) this.galleryScope = "vault";
    this.path = (_f = (_e = (_d = this.selected) == null ? void 0 : _d.file) == null ? void 0 : _e.path) != null ? _f : initialPath;
  }
  onOpen() {
    this.modalEl.addClass("hover-image-modal");
    this.titleEl.setText(this.initialPath ? "\u66F4\u6362\u60AC\u6D6E\u56FE\u7247" : "\u8BBE\u7F6E\u60AC\u6D6E\u56FE\u7247");
    this.contentEl.empty();
    if (this.recommended) this.contentEl.createEl("p", { cls: "hover-image-recommendation", text: "\u5DF2\u4F18\u5148\u9009\u4E2D\u7F51\u5740\u4E0B\u65B9\u7684\u56FE\u7247\uFF0C\u786E\u8BA4\u5373\u53EF\u7ED1\u5B9A\u3002" });
    const tabs = this.contentEl.createDiv({ cls: "hover-image-tabs" });
    const noteTab = tabs.createEl("button", { text: `\u5F53\u524D\u7B14\u8BB0 (${this.noteImages.length})` });
    const vaultTab = tabs.createEl("button", { text: "\u4ED3\u5E93\u5168\u90E8\u56FE\u7247" });
    const switchScope = (scope) => {
      if (this.galleryScope === scope) return;
      this.galleryScope = scope;
      noteTab.toggleClass("is-active", scope === "note");
      vaultTab.toggleClass("is-active", scope === "vault");
      if (this.searchEl) this.searchEl.style.display = scope === "vault" ? "" : "none";
      if (this.noteGalleryEl) this.noteGalleryEl.style.display = scope === "note" ? "" : "none";
      if (this.vaultGalleryEl) this.vaultGalleryEl.style.display = scope === "vault" ? "" : "none";
      this.galleryEl = scope === "note" ? this.noteGalleryEl : this.vaultGalleryEl;
      if (!this.renderedScopes[scope]) this.renderGallery();
      else this.syncSelectedTiles();
    };
    noteTab.addEventListener("click", () => switchScope("note"));
    vaultTab.addEventListener("click", () => switchScope("vault"));
    noteTab.toggleClass("is-active", this.galleryScope === "note");
    vaultTab.toggleClass("is-active", this.galleryScope === "vault");
    this.searchEl = this.contentEl.createEl("input", { cls: "hover-image-search", type: "search", placeholder: "\u6309\u6587\u4EF6\u540D\u6216\u6587\u4EF6\u5939\u641C\u7D22\u56FE\u7247\u2026" });
    this.searchEl.addEventListener("input", () => this.renderGallery());
    this.searchEl.style.display = this.galleryScope === "vault" ? "" : "none";
    this.noteGalleryEl = this.contentEl.createDiv({ cls: "hover-image-gallery" });
    this.vaultGalleryEl = this.contentEl.createDiv({ cls: "hover-image-gallery" });
    this.noteGalleryEl.style.display = this.galleryScope === "note" ? "" : "none";
    this.vaultGalleryEl.style.display = this.galleryScope === "vault" ? "" : "none";
    this.galleryEl = this.galleryScope === "note" ? this.noteGalleryEl : this.vaultGalleryEl;
    this.renderGallery();
    this.removeRow = this.contentEl.createEl("label", { cls: "hover-image-remove-row" });
    this.removeInput = this.removeRow.createEl("input", { type: "checkbox" });
    this.removeRow.appendText(" \u7ED1\u5B9A\u540E\u79FB\u9664\u7B14\u8BB0\u4E2D\u76F4\u63A5\u663E\u793A\u56FE\u7247\u7684\u90A3\u4E00\u884C\uFF08\u4E0D\u5220\u9664\u56FE\u7247\u6587\u4EF6\uFF09");
    this.removeInput.checked = Boolean(this.recommended && !this.initialPath);
    const footer = this.contentEl.createDiv({ cls: "hover-image-footer" });
    this.selectedEl = footer.createDiv({ cls: "hover-image-selected" });
    const actions = footer.createDiv({ cls: "hover-image-actions" });
    actions.createEl("button", { text: "\u53D6\u6D88" }).addEventListener("click", () => this.close());
    const save = actions.createEl("button", { text: "\u786E\u5B9A", cls: "mod-cta" });
    save.addEventListener("click", () => {
      void this.confirm(save);
    });
    this.updateSelection();
  }
  renderGallery() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (!this.galleryEl) return;
    this.galleryEl.empty();
    const all = this.galleryScope === "note" ? this.noteImages : (_a = this.vaultImages) != null ? _a : this.vaultImages = this.app.vault.getFiles().filter((file) => IMAGE_EXTENSIONS.test(file.name)).sort((a, b) => b.stat.mtime - a.stat.mtime).map((file) => ({ file }));
    this.renderedScopes[this.galleryScope] = true;
    const query = this.galleryScope === "vault" ? (_c = (_b = this.searchEl) == null ? void 0 : _b.value.trim().toLowerCase()) != null ? _c : "" : "";
    const matches = all.filter((image) => image.file.path.toLowerCase().includes(query));
    this.galleryEl.toggleClass("is-empty", matches.length === 0);
    if (!matches.length) {
      const empty = this.galleryEl.createDiv({ cls: "hover-image-empty" });
      if (this.galleryScope === "note") empty.createSpan({ cls: "hover-image-empty-icon", text: "!" });
      empty.createSpan({ text: this.galleryScope === "note" ? "\u5F53\u524D\u7B14\u8BB0\u6CA1\u6709\u5339\u914D\u7684\u56FE\u7247\uFF0C\u53EF\u5207\u6362\u5230\u300C\u4ED3\u5E93\u5168\u90E8\u56FE\u7247\u300D\u3002" : "\u6CA1\u6709\u5339\u914D\u7684\u56FE\u7247\u3002" });
      return;
    }
    for (const image of matches.slice(0, 80)) {
      const tile = this.galleryEl.createEl("button", { cls: "hover-image-tile", attr: { type: "button", title: image.file.path, "aria-label": `\u9009\u62E9 ${image.file.path}` } });
      tile.dataset.imagePath = image.file.path;
      tile.dataset.imageLine = String((_e = (_d = image.embed) == null ? void 0 : _d.line) != null ? _e : -1);
      tile.toggleClass("is-selected", ((_f = this.selected) == null ? void 0 : _f.file.path) === image.file.path && ((_h = (_g = this.selected) == null ? void 0 : _g.embed) == null ? void 0 : _h.line) === ((_i = image.embed) == null ? void 0 : _i.line));
      tile.createEl("img", { attr: { src: this.app.vault.getResourcePath(image.file), alt: "", loading: "lazy" } });
      tile.createEl("span", { text: image.file.name });
      if (image.recommended) tile.createEl("strong", { cls: "hover-image-badge", text: "\u4E0B\u65B9\u56FE\u7247" });
      tile.addEventListener("click", () => {
        this.selected = image;
        this.path = image.file.path;
        if (this.removeInput) this.removeInput.checked = Boolean(image.recommended && !this.initialPath);
        this.updateSelection();
        this.syncSelectedTiles();
      });
    }
    if (matches.length > 80) this.galleryEl.createEl("p", { cls: "hover-image-gallery-limit", text: `\u663E\u793A\u524D 80 / ${matches.length} \u5F20\uFF0C\u8BF7\u8F93\u5165\u5173\u952E\u8BCD\u7F29\u5C0F\u8303\u56F4\u3002` });
  }
  syncSelectedTiles() {
    var _a, _b, _c, _d, _e, _f;
    for (const tile of Array.from((_b = (_a = this.galleryEl) == null ? void 0 : _a.querySelectorAll(".hover-image-tile")) != null ? _b : [])) {
      tile.toggleClass("is-selected", tile.dataset.imagePath === ((_c = this.selected) == null ? void 0 : _c.file.path) && Number(tile.dataset.imageLine) === ((_f = (_e = (_d = this.selected) == null ? void 0 : _d.embed) == null ? void 0 : _e.line) != null ? _f : -1));
    }
  }
  updateSelection() {
    var _a, _b;
    if (this.selectedEl) {
      this.selectedEl.setText(this.path ? `\u5DF2\u9009\u62E9\uFF1A${this.path}` : "");
      this.selectedEl.style.display = this.path ? "" : "none";
    }
    if (this.removeRow) this.removeRow.style.display = ((_b = (_a = this.selected) == null ? void 0 : _a.embed) == null ? void 0 : _b.standalone) ? "flex" : "none";
  }
  async confirm(button) {
    var _a, _b, _c;
    button.disabled = true;
    try {
      const file = this.app.vault.getAbstractFileByPath(this.path);
      if (!(file instanceof import_obsidian.TFile) || !IMAGE_EXTENSIONS.test(file.name)) throw new Error("\u8BF7\u9009\u62E9\u4ED3\u5E93\u4E2D\u5DF2\u6709\u7684\u56FE\u7247\u3002");
      await this.onConfirm(file.path, ((_a = this.removeInput) == null ? void 0 : _a.checked) && ((_c = (_b = this.selected) == null ? void 0 : _b.embed) == null ? void 0 : _c.standalone) ? this.selected.embed : null);
      this.close();
      new import_obsidian.Notice("\u60AC\u6D6E\u56FE\u7247\u5DF2\u8BBE\u7F6E");
    } catch (error) {
      new import_obsidian.Notice(error instanceof Error ? error.message : "\u8BBE\u7F6E\u5931\u8D25");
      button.disabled = false;
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var HoverImagePlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "popup", null);
    __publicField(this, "hoverTimer", null);
  }
  onload() {
    this.addCommand({
      id: "bind-selection",
      name: "\u4E3A\u9009\u4E2D\u6587\u672C\u8BBE\u7F6E\u60AC\u6D6E\u56FE\u7247",
      editorCheckCallback: (checking, editor) => {
        if (!editor.getSelection().trim()) return false;
        if (!checking) this.bindSelection(editor);
        return true;
      }
    });
    this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor) => {
      if (editor.getSelection().trim()) menu.addItem((item) => item.setTitle("\u8BBE\u7F6E\u60AC\u6D6E\u56FE\u7247").setIcon("image").onClick(() => this.bindSelection(editor)));
    }));
    this.registerDomEvent(document, "mouseover", (event) => {
      var _a, _b;
      const target = (_b = (_a = event.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, ".hover-image-target");
      if (!target) return;
      this.hidePopup();
      this.hoverTimer = window.setTimeout(() => this.showPopup(target), 180);
    });
    this.registerDomEvent(document, "mouseout", (event) => {
      var _a, _b;
      const target = (_b = (_a = event.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, ".hover-image-target");
      if (target && !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) this.hidePopup();
    });
    this.registerDomEvent(document, "scroll", () => this.hidePopup(), true);
    this.registerDomEvent(document, "contextmenu", (event) => this.openBindingMenu(event), true);
  }
  onunload() {
    this.hidePopup();
  }
  bindSelection(editor) {
    const selection = editor.getSelection();
    if (!selection.trim()) {
      new import_obsidian.Notice("\u8BF7\u5148\u9009\u4E2D\u6587\u672C\u6216\u7F51\u7AD9\u94FE\u63A5");
      return;
    }
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u7BC7\u7B14\u8BB0");
      return;
    }
    const from = editor.getCursor("from");
    const to = editor.getCursor("to");
    new BindModal(this.app, "", file, editor.getValue(), to.line, async (imagePath, removeEmbed) => {
      var _a;
      if (editor.getRange(from, to) !== selection) throw new Error("\u9009\u533A\u5DF2\u6539\u53D8\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u6587\u5B57\u3002");
      if (((_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path) !== file.path) throw new Error("\u5F53\u524D\u7B14\u8BB0\u5DF2\u5207\u6362\uFF0C\u8BF7\u91CD\u65B0\u64CD\u4F5C\u3002");
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const changes = [{ from, to, text: bindImage(selection, imagePath, id) }];
      if (removeEmbed) {
        const line = editor.getLine(removeEmbed.line);
        if ((line == null ? void 0 : line.trim()) !== removeEmbed.raw) throw new Error("\u6B63\u6587\u56FE\u7247\u4F4D\u7F6E\u5DF2\u6539\u53D8\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002");
        const startLine = removeEmbed.line > 0 && !editor.getLine(removeEmbed.line - 1).trim() ? removeEmbed.line - 1 : removeEmbed.line;
        const end = removeEmbed.line + 1 < editor.lineCount() ? { line: removeEmbed.line + 1, ch: 0 } : { line: removeEmbed.line, ch: line.length };
        changes.push({ from: { line: startLine, ch: 0 }, to: end, text: "" });
      }
      editor.transaction({ changes });
    }).open();
  }
  showPopup(target) {
    this.hoverTimer = null;
    const path = target.dataset.hoverImage;
    if (!path) return;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian.TFile)) return;
    const popup = document.body.createDiv({ cls: "hover-image-popup" });
    const image = popup.createEl("img");
    image.alt = "";
    const place = () => {
      if (!popup.isConnected) return;
      const rect = target.getBoundingClientRect();
      const position = popupPosition(rect, popup.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight });
      popup.style.left = `${position.left}px`;
      popup.style.top = `${position.top}px`;
    };
    image.addEventListener("load", place);
    image.src = this.app.vault.getResourcePath(file);
    place();
    window.requestAnimationFrame(place);
    this.popup = popup;
  }
  hidePopup() {
    var _a;
    if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
    this.hoverTimer = null;
    (_a = this.popup) == null ? void 0 : _a.remove();
    this.popup = null;
  }
  openBindingMenu(event) {
    var _a, _b;
    const target = (_b = (_a = event.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, ".hover-image-target");
    const id = target == null ? void 0 : target.dataset.hoverId;
    if (!id) return;
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof import_obsidian.TFile)) return;
    event.preventDefault();
    event.stopPropagation();
    this.hidePopup();
    const menu = new import_obsidian.Menu();
    menu.addItem((item) => item.setTitle("\u66F4\u6362\u60AC\u6D6E\u56FE\u7247").setIcon("image").onClick(() => {
      void this.app.vault.cachedRead(file).then((source) => {
        var _a2;
        new BindModal(this.app, (_a2 = target.dataset.hoverImage) != null ? _a2 : "", file, source, null, async (path) => this.updateBinding(file, id, (markup) => changeImage(markup, path))).open();
      }).catch((error) => new import_obsidian.Notice(error instanceof Error ? error.message : "\u65E0\u6CD5\u8BFB\u53D6\u5F53\u524D\u7B14\u8BB0"));
    }));
    menu.addItem((item) => item.setTitle("\u79FB\u9664\u60AC\u6D6E\u56FE\u7247\u5173\u8054").setIcon("unlink").onClick(() => {
      void this.updateBinding(file, id, removeImage).then(() => new import_obsidian.Notice("\u5DF2\u79FB\u9664\u5173\u8054\uFF0C\u56FE\u7247\u6587\u4EF6\u4FDD\u7559")).catch((error) => new import_obsidian.Notice(error instanceof Error ? error.message : "\u79FB\u9664\u5931\u8D25"));
    }));
    menu.showAtMouseEvent(event);
  }
  async updateBinding(file, id, change) {
    let found = false;
    await this.app.vault.process(file, (source) => {
      const binding = findBinding(source, id);
      if (!binding) return source;
      found = true;
      return source.slice(0, binding.start) + change(binding.markup) + source.slice(binding.end);
    });
    if (!found) throw new Error("\u672A\u5728\u5F53\u524D\u7B14\u8BB0\u627E\u5230\u5173\u8054\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u7B14\u8BB0\u3002");
  }
};
