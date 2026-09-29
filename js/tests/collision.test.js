import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aabb, circleRect } from '../collision.js';

test('aabb: nachodzące prostokąty kolidują', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), true);
});

test('aabb: rozłączne prostokąty nie kolidują', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 5, h: 5 }), false);
  assert.equal(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 20, w: 5, h: 5 }), false);
});

test('aabb: stykające się krawędzie nie kolidują', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false);
});

test('aabb: prostokąt w środku drugiego koliduje', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 100, h: 100 }, { x: 40, y: 40, w: 2, h: 2 }), true);
});

test('circleRect: okrąg zahaczający o róg / daleko od prostokąta', () => {
  const rect = { x: 0, y: 0, w: 10, h: 10 };
  assert.equal(circleRect(13, 13, 5, rect), true);   // odległość od rogu ≈ 4.24
  assert.equal(circleRect(20, 20, 5, rect), false);
  assert.equal(circleRect(5, 5, 1, rect), true);     // środek w prostokącie
});
