// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createSafeElement } from '../src/utils/domUtils.js';

describe('domUtils', () => {
  it('should create an element with the correct tag', () => {
    const el = createSafeElement('div');
    expect(el.tagName).toBe('DIV');
  });

  it('should add a single class name', () => {
    const el = createSafeElement('span', 'my-class');
    expect(el.classList.contains('my-class')).toBe(true);
  });

  it('should add multiple class names from an array', () => {
    const el = createSafeElement('p', ['class1', 'class2']);
    expect(el.classList.contains('class1')).toBe(true);
    expect(el.classList.contains('class2')).toBe(true);
  });

  it('should safely add text content without evaluating HTML', () => {
    const el = createSafeElement('div', '', '<strong>Not Bold</strong>');
    expect(el.innerHTML).toBe('&lt;strong&gt;Not Bold&lt;/strong&gt;');
    expect(el.textContent).toBe('<strong>Not Bold</strong>');
  });
});
