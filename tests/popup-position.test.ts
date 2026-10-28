import assert from 'node:assert/strict';
import test from 'node:test';
import { popupPosition } from '../src/popup-position';

test('anchors the popup below the latter half of the link', () => {
  assert.deepEqual(
    popupPosition({ left: 100, top: 50, width: 200, bottom: 70 }, { width: 160, height: 100 }, { width: 800, height: 600 }),
    { left: 220, top: 78 },
  );
});

test('keeps the popup in the viewport and flips above when needed', () => {
  assert.deepEqual(
    popupPosition({ left: 740, top: 500, width: 100, bottom: 520 }, { width: 240, height: 160 }, { width: 800, height: 600 }),
    { left: 552, top: 332 },
  );
});
