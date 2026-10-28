import { App, Editor, Menu, Modal, Notice, Plugin, TFile } from 'obsidian';
import { bindImage, changeImage, removeImage } from './markup';
import { adjacentImage, NoteImage, scanNoteImages } from './note-images';
import { popupPosition } from './popup-position';

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;
const MARKUP = /<(a|span)\b[^>]*\bdata-hover-id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/g;

function findBinding(source: string, id: string): { start: number; end: number; markup: string } | null {
  for (const match of source.matchAll(MARKUP)) {
    if (match[2] === id && match.index !== undefined) {
      return { start: match.index, end: match.index + match[0].length, markup: match[0] };
    }
  }
  return null;
}

interface GalleryImage { file: TFile; embed?: NoteImage; recommended?: boolean }

class BindModal extends Modal {
  private path = '';
  private galleryEl: HTMLDivElement | null = null;
  private noteGalleryEl: HTMLDivElement | null = null;
  private vaultGalleryEl: HTMLDivElement | null = null;
  private vaultImages: GalleryImage[] | null = null;
  private renderedScopes = { note: false, vault: false };
  private searchEl: HTMLInputElement | null = null;
  private selectedEl: HTMLElement | null = null;
  private removeRow: HTMLLabelElement | null = null;
  private removeInput: HTMLInputElement | null = null;
  private galleryScope: 'note' | 'vault' = 'note';
  private selected: GalleryImage | null = null;
  private readonly noteImages: GalleryImage[];
  private readonly recommended: GalleryImage | null;

  constructor(
    app: App,
    private readonly initialPath: string,
    noteFile: TFile,
    noteSource: string,
    selectedLine: number | null,
    private readonly onConfirm: (path: string, removeEmbed: NoteImage | null) => Promise<void>,
  ) {
    super(app);
    const images = scanNoteImages(noteSource);
    const adjacent = selectedLine === null ? null : adjacentImage(noteSource, selectedLine, images);
    this.noteImages = images.flatMap(embed => {
      const file = app.metadataCache.getFirstLinkpathDest(embed.linkpath, noteFile.path);
      return file && IMAGE_EXTENSIONS.test(file.name) ? [{ file, embed, recommended: embed === adjacent }] : [];
    });
    this.recommended = this.noteImages.find(image => image.recommended) ?? null;
    const initialFile = initialPath ? app.vault.getAbstractFileByPath(initialPath) : null;
    this.selected = this.recommended ?? this.noteImages.find(image => image.file.path === initialPath) ?? (initialFile instanceof TFile ? { file: initialFile } : null);
    if (!this.noteImages.length) this.galleryScope = 'vault';
    this.path = this.selected?.file?.path ?? initialPath;
  }

  onOpen(): void {
    this.modalEl.addClass('hover-image-modal');
    this.titleEl.setText(this.initialPath ? '更换悬浮图片' : '设置悬浮图片');
    this.contentEl.empty();
    if (this.recommended) this.contentEl.createEl('p', { cls: 'hover-image-recommendation', text: '已优先选中网址下方的图片，确认即可绑定。' });
    const tabs = this.contentEl.createDiv({ cls: 'hover-image-tabs' });
    const noteTab = tabs.createEl('button', { text: `当前笔记 (${this.noteImages.length})` });
    const vaultTab = tabs.createEl('button', { text: '仓库全部图片' });
    const switchScope = (scope: 'note' | 'vault') => {
      if (this.galleryScope === scope) return;
      this.galleryScope = scope;
      noteTab.toggleClass('is-active', scope === 'note');
      vaultTab.toggleClass('is-active', scope === 'vault');
      if (this.searchEl) this.searchEl.style.display = scope === 'vault' ? '' : 'none';
      if (this.noteGalleryEl) this.noteGalleryEl.style.display = scope === 'note' ? '' : 'none';
      if (this.vaultGalleryEl) this.vaultGalleryEl.style.display = scope === 'vault' ? '' : 'none';
      this.galleryEl = scope === 'note' ? this.noteGalleryEl : this.vaultGalleryEl;
      if (!this.renderedScopes[scope]) this.renderGallery();
      else this.syncSelectedTiles();
    };
    noteTab.addEventListener('click', () => switchScope('note'));
    vaultTab.addEventListener('click', () => switchScope('vault'));
    noteTab.toggleClass('is-active', this.galleryScope === 'note');
    vaultTab.toggleClass('is-active', this.galleryScope === 'vault');
    this.searchEl = this.contentEl.createEl('input', { cls: 'hover-image-search', type: 'search', placeholder: '按文件名或文件夹搜索图片…' });
    this.searchEl.addEventListener('input', () => this.renderGallery());
    this.searchEl.style.display = this.galleryScope === 'vault' ? '' : 'none';
    this.noteGalleryEl = this.contentEl.createDiv({ cls: 'hover-image-gallery' });
    this.vaultGalleryEl = this.contentEl.createDiv({ cls: 'hover-image-gallery' });
    this.noteGalleryEl.style.display = this.galleryScope === 'note' ? '' : 'none';
    this.vaultGalleryEl.style.display = this.galleryScope === 'vault' ? '' : 'none';
    this.galleryEl = this.galleryScope === 'note' ? this.noteGalleryEl : this.vaultGalleryEl;
    this.renderGallery();
    this.removeRow = this.contentEl.createEl('label', { cls: 'hover-image-remove-row' });
    this.removeInput = this.removeRow.createEl('input', { type: 'checkbox' });
    this.removeRow.appendText(' 绑定后移除笔记中直接显示图片的那一行（不删除图片文件）');
    this.removeInput.checked = Boolean(this.recommended && !this.initialPath);
    const footer = this.contentEl.createDiv({ cls: 'hover-image-footer' });
    this.selectedEl = footer.createDiv({ cls: 'hover-image-selected' });
    const actions = footer.createDiv({ cls: 'hover-image-actions' });
    actions.createEl('button', { text: '取消' }).addEventListener('click', () => this.close());
    const save = actions.createEl('button', { text: '确定', cls: 'mod-cta' });
    save.addEventListener('click', () => { void this.confirm(save); });
    this.updateSelection();
  }

  private renderGallery(): void {
    if (!this.galleryEl) return;
    this.galleryEl.empty();
    const all: GalleryImage[] = this.galleryScope === 'note'
      ? this.noteImages
      : (this.vaultImages ??= this.app.vault.getFiles().filter(file => IMAGE_EXTENSIONS.test(file.name)).sort((a, b) => b.stat.mtime - a.stat.mtime).map(file => ({ file })));
    this.renderedScopes[this.galleryScope] = true;
    const query = this.galleryScope === 'vault' ? this.searchEl?.value.trim().toLowerCase() ?? '' : '';
    const matches = all.filter(image => image.file.path.toLowerCase().includes(query));
    this.galleryEl.toggleClass('is-empty', matches.length === 0);
    if (!matches.length) {
      const empty = this.galleryEl.createDiv({ cls: 'hover-image-empty' });
      if (this.galleryScope === 'note') empty.createSpan({ cls: 'hover-image-empty-icon', text: '!' });
      empty.createSpan({ text: this.galleryScope === 'note' ? '当前笔记没有匹配的图片，可切换到「仓库全部图片」。' : '没有匹配的图片。' });
      return;
    }
    for (const image of matches.slice(0, 80)) {
      const tile = this.galleryEl.createEl('button', { cls: 'hover-image-tile', attr: { type: 'button', title: image.file.path, 'aria-label': `选择 ${image.file.path}` } });
      tile.dataset.imagePath = image.file.path;
      tile.dataset.imageLine = String(image.embed?.line ?? -1);
      tile.toggleClass('is-selected', this.selected?.file.path === image.file.path && this.selected?.embed?.line === image.embed?.line);
      tile.createEl('img', { attr: { src: this.app.vault.getResourcePath(image.file), alt: '', loading: 'lazy' } });
      tile.createEl('span', { text: image.file.name });
      if (image.recommended) tile.createEl('strong', { cls: 'hover-image-badge', text: '下方图片' });
      tile.addEventListener('click', () => {
        this.selected = image;
        this.path = image.file.path;
        if (this.removeInput) this.removeInput.checked = Boolean(image.recommended && !this.initialPath);
        this.updateSelection();
        this.syncSelectedTiles();
      });
    }
    if (matches.length > 80) this.galleryEl.createEl('p', { cls: 'hover-image-gallery-limit', text: `显示前 80 / ${matches.length} 张，请输入关键词缩小范围。` });
  }

  private syncSelectedTiles(): void {
    for (const tile of Array.from(this.galleryEl?.querySelectorAll<HTMLButtonElement>('.hover-image-tile') ?? [])) {
      tile.toggleClass('is-selected', tile.dataset.imagePath === this.selected?.file.path && Number(tile.dataset.imageLine) === (this.selected?.embed?.line ?? -1));
    }
  }

  private updateSelection(): void {
    if (this.selectedEl) {
      this.selectedEl.setText(this.path ? `已选择：${this.path}` : '');
      this.selectedEl.style.display = this.path ? '' : 'none';
    }
    if (this.removeRow) this.removeRow.style.display = this.selected?.embed?.standalone ? 'flex' : 'none';
  }

  private async confirm(button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    try {
      const file = this.app.vault.getAbstractFileByPath(this.path);
      if (!(file instanceof TFile) || !IMAGE_EXTENSIONS.test(file.name)) throw new Error('请选择仓库中已有的图片。');
      await this.onConfirm(file.path, this.removeInput?.checked && this.selected?.embed?.standalone ? this.selected.embed : null);
      this.close();
      new Notice('悬浮图片已设置');
    } catch (error) {
      new Notice(error instanceof Error ? error.message : '设置失败');
      button.disabled = false;
    }
  }

  onClose(): void { this.contentEl.empty(); }
}

export default class HoverImagePlugin extends Plugin {
  private popup: HTMLDivElement | null = null;
  private hoverTimer: number | null = null;

  onload(): void {
    this.addCommand({
      id: 'bind-selection', name: '为选中文本设置悬浮图片',
      editorCheckCallback: (checking, editor) => {
        if (!editor.getSelection().trim()) return false;
        if (!checking) this.bindSelection(editor);
        return true;
      },
    });
    this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => {
      if (editor.getSelection().trim()) menu.addItem(item => item.setTitle('设置悬浮图片').setIcon('image').onClick(() => this.bindSelection(editor)));
    }));
    this.registerDomEvent(document, 'mouseover', event => {
      const target = (event.target as Element | null)?.closest?.('.hover-image-target') as HTMLElement | null;
      if (!target) return;
      this.hidePopup();
      this.hoverTimer = window.setTimeout(() => this.showPopup(target), 180);
    });
    this.registerDomEvent(document, 'mouseout', event => {
      const target = (event.target as Element | null)?.closest?.('.hover-image-target');
      if (target && !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) this.hidePopup();
    });
    this.registerDomEvent(document, 'scroll', () => this.hidePopup(), true);
    this.registerDomEvent(document, 'contextmenu', event => this.openBindingMenu(event), true);
  }

  onunload(): void { this.hidePopup(); }

  private bindSelection(editor: Editor): void {
    const selection = editor.getSelection();
    if (!selection.trim()) { new Notice('请先选中文本或网站链接'); return; }
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) { new Notice('请先打开一篇笔记'); return; }
    const from = editor.getCursor('from');
    const to = editor.getCursor('to');
    new BindModal(this.app, '', file, editor.getValue(), to.line, async (imagePath, removeEmbed) => {
      if (editor.getRange(from, to) !== selection) throw new Error('选区已改变，请重新选择文字。');
      if (this.app.workspace.getActiveFile()?.path !== file.path) throw new Error('当前笔记已切换，请重新操作。');
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const changes = [{ from, to, text: bindImage(selection, imagePath, id) }];
      if (removeEmbed) {
        const line = editor.getLine(removeEmbed.line);
        if (line?.trim() !== removeEmbed.raw) throw new Error('正文图片位置已改变，请重新选择。');
        const startLine = removeEmbed.line > 0 && !editor.getLine(removeEmbed.line - 1).trim() ? removeEmbed.line - 1 : removeEmbed.line;
        const end = removeEmbed.line + 1 < editor.lineCount()
          ? { line: removeEmbed.line + 1, ch: 0 }
          : { line: removeEmbed.line, ch: line.length };
        changes.push({ from: { line: startLine, ch: 0 }, to: end, text: '' });
      }
      editor.transaction({ changes });
    }).open();
  }

  private showPopup(target: HTMLElement): void {
    this.hoverTimer = null;
    const path = target.dataset.hoverImage;
    if (!path) return;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    const popup = document.body.createDiv({ cls: 'hover-image-popup' });
    const image = popup.createEl('img');
    image.alt = '';
    const place = () => {
      if (!popup.isConnected) return;
      const rect = target.getBoundingClientRect();
      const position = popupPosition(rect, popup.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight });
      popup.style.left = `${position.left}px`;
      popup.style.top = `${position.top}px`;
    };
    image.addEventListener('load', place);
    image.src = this.app.vault.getResourcePath(file);
    place();
    window.requestAnimationFrame(place);
    this.popup = popup;
  }

  private hidePopup(): void {
    if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
    this.hoverTimer = null;
    this.popup?.remove();
    this.popup = null;
  }

  private openBindingMenu(event: MouseEvent): void {
    const target = (event.target as Element | null)?.closest?.('.hover-image-target') as HTMLElement | null;
    const id = target?.dataset.hoverId;
    if (!id) return;
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) return;
    event.preventDefault();
    event.stopPropagation();
    this.hidePopup();
    const menu = new Menu();
    menu.addItem(item => item.setTitle('更换悬浮图片').setIcon('image').onClick(() => {
      void this.app.vault.cachedRead(file).then(source => {
        new BindModal(this.app, target.dataset.hoverImage ?? '', file, source, null, async path => this.updateBinding(file, id, markup => changeImage(markup, path))).open();
      }).catch(error => new Notice(error instanceof Error ? error.message : '无法读取当前笔记'));
    }));
    menu.addItem(item => item.setTitle('移除悬浮图片关联').setIcon('unlink').onClick(() => {
      void this.updateBinding(file, id, removeImage).then(() => new Notice('已移除关联，图片文件保留')).catch(error => new Notice(error instanceof Error ? error.message : '移除失败'));
    }));
    menu.showAtMouseEvent(event);
  }

  private async updateBinding(file: TFile, id: string, change: (markup: string) => string): Promise<void> {
    let found = false;
    await this.app.vault.process(file, source => {
      const binding = findBinding(source, id);
      if (!binding) return source;
      found = true;
      return source.slice(0, binding.start) + change(binding.markup) + source.slice(binding.end);
    });
    if (!found) throw new Error('未在当前笔记找到关联，请重新打开笔记。');
  }
}
