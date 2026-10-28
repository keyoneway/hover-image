import test from 'node:test';
import assert from 'node:assert/strict';
import { bindImage, changeImage, removeImage, imagePathFromMarkup, restoreImageBelow } from '../src/markup';

test('a bare website stays a clickable link while image metadata is hidden in attributes', () => {
  const source = 'https://www.pet-plus-us.com/';
  const result = bindImage(source, '90-Attachments/screen.png', 'id1');
  assert.match(result, /<a href="https:\/\/www\.pet-plus-us\.com\/"/);
  assert.match(result, />https:\/\/www\.pet-plus-us\.com\/<\/a>/);
  assert.equal(imagePathFromMarkup(result), '90-Attachments/screen.png');
  assert.equal(removeImage(result), source);
});

test('markdown link retains destination and label', () => {
  const source = '[Pet Plus](https://www.pet-plus-us.com/)';
  const result = bindImage(source, '90-Attachments/a.png', 'id2');
  assert.match(result, /<a href="https:\/\/www\.pet-plus-us\.com\/"/);
  assert.match(result, />Pet Plus<\/a>/);
  assert.equal(removeImage(result), source);
});

test('plain text can bind, change, and remove image without changing text', () => {
  const result = bindImage('参考网站', '90-Attachments/旧图.png', 'id3');
  const changed = changeImage(result, '90-Attachments/新图.png');
  assert.equal(imagePathFromMarkup(changed), '90-Attachments/新图.png');
  assert.equal(removeImage(changed), '参考网站');
});

test('HTML special characters are escaped and restored', () => {
  const source = 'A < B & "C"';
  const result = bindImage(source, '90-Attachments/a&b.png', 'id4');
  assert.equal(removeImage(result), source);
  assert.equal(imagePathFromMarkup(result), '90-Attachments/a&b.png');
});

test('restores the image directly below the bound text line and leaves other bindings intact', () => {
  const first = bindImage('https://a.example', '90-Attachments/a.png', 'first');
  const second = bindImage('第二个网站', '90-Attachments/b.png', 'second');
  const source = `${first}\n${second}\n`;
  assert.equal(restoreImageBelow(source, 'first', '![[90-Attachments/a.png]]'),
    `https://a.example\n![[90-Attachments/a.png]]\n${second}\n`);
});

test('does not duplicate the same image already immediately below the text', () => {
  const bound = bindImage('[参考](https://a.example)', '90-Attachments/a.png', 'id');
  const source = `${bound}\n\n![[90-Attachments/a.png]]\n`;
  assert.equal(restoreImageBelow(source, 'id', '![[90-Attachments/a.png]]'),
    '[参考](https://a.example)\n\n![[90-Attachments/a.png]]\n');
});

test('inserts after the complete line when the bound text is within a sentence', () => {
  const bound = bindImage('参考', '90-Attachments/a.png', 'id');
  assert.equal(restoreImageBelow(`看${bound}网站\n下一行`, 'id', '![[90-Attachments/a.png]]'),
    '看参考网站\n![[90-Attachments/a.png]]\n下一行');
});
