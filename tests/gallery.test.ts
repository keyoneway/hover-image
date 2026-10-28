import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingImages, orderedImages, nextGalleryPage } from '../src/gallery';

test('orders all vault images newest first and excludes non-images', () => {
  const files = [
    { path: 'docs/note.md', name: 'note.md', stat: { mtime: 9 } },
    { path: '90-Attachments/old.png', name: 'old.png', stat: { mtime: 1 } },
    { path: '90-Attachments/new.JPG', name: 'new.JPG', stat: { mtime: 8 } },
  ];
  assert.deepEqual(orderedImages(files).map(file => file.name), ['new.JPG', 'old.png']);
});

test('searches the complete vault image set by filename or folder, not only the first 80', () => {
  const files = Array.from({ length: 175 }, (_, index) => ({
    path: `90-Attachments/image-${index}.png`, name: `image-${index}.png`, stat: { mtime: index },
  }));
  files[174].path = '参考网站/首页截图.png';
  files[174].name = '首页截图.png';
  const all = orderedImages(files);
  const tiles = all.map(file => ({ file }));
  assert.equal(matchingImages(tiles, '首页截图').length, 1);
  assert.equal(matchingImages(tiles, '参考网站').length, 1);
  assert.equal(matchingImages(tiles, 'IMAGE-10').length, 11);
  assert.deepEqual([0, 80, 160].flatMap(offset => nextGalleryPage(all, offset)).map(file => file.path), all.map(file => file.path));
});
