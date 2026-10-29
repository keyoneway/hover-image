import assert from 'node:assert/strict';
import test from 'node:test';
import { pointerIsInHoverRegion } from '../src/hover-region';

test('keeps preview open while moving between bound text and its popup', () => {
  const text = { contains: (node: object) => node === insideText };
  const popup = { contains: (node: object) => node === insidePopup };
  const insideText = {};
  const insidePopup = {};
  const outside = {};
  assert.equal(pointerIsInHoverRegion(insideText as Node, text as Node, popup as Node), true);
  assert.equal(pointerIsInHoverRegion(insidePopup as Node, text as Node, popup as Node), true);
  assert.equal(pointerIsInHoverRegion(outside as Node, text as Node, popup as Node), false);
  assert.equal(pointerIsInHoverRegion(null, text as Node, popup as Node), false);
});
