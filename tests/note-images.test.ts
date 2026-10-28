import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacentImage, scanNoteImages } from '../src/note-images';

test('finds an embedded image immediately below a link across blank lines', () => {
  const source = 'https://growingupvideo.com/\n\n![[Pasted image 20261027194426.png]]\n';
  const images = scanNoteImages(source);
  assert.deepEqual(images, [{ linkpath: 'Pasted image 20261027194426.png', line: 2, raw: '![[Pasted image 20261027194426.png]]', standalone: true }]);
  assert.deepEqual(adjacentImage(source, 0, images), images[0]);
});

test('supports markdown images and excludes fenced code', () => {
  const source = '![site](images/site.png)\n```md\n![[not-an-image.png]]\n```\nText ![[inline.png]]';
  assert.deepEqual(scanNoteImages(source).map(image => [image.linkpath, image.standalone]), [
    ['images/site.png', true], ['inline.png', false],
  ]);
});

test('never guesses past another content line or an inline image', () => {
  const source = 'https://a.example\nSome notes\n![[first.png]]\nhttps://b.example\nSee ![[second.png]]';
  const images = scanNoteImages(source);
  assert.equal(adjacentImage(source, 0, images), null);
  assert.equal(adjacentImage(source, 3, images), null);
});
