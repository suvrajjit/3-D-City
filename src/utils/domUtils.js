/**
 * domUtils - Utility functions for safe DOM manipulation to prevent XSS vulnerabilities.
 */

/**
 * Creates an HTML element safely without using innerHTML.
 * @param {string} tag - The HTML tag name (e.g. 'div', 'span')
 * @param {string|string[]} [classNames] - CSS class names
 * @param {string} [textContent] - Text content for the element
 * @returns {HTMLElement} The created safe DOM element
 */
export function createSafeElement(tag, classNames = '', textContent = '') {
  const el = document.createElement(tag);
  if (classNames) {
    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else {
      el.className = classNames;
    }
  }
  if (textContent) {
    el.textContent = textContent;
  }
  return el;
}
