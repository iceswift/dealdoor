import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import ImageUpload from '../../components/shared/ImageUpload';

describe('demo image controls', () => {
  it('preserves the existing image without an upload input or removal button', () => {
    const html = renderToStaticMarkup(createElement(ImageUpload, { type: 'logo', disabled: true, currentUrl: '/uploads/logos/sample.webp', onUpload: () => {} }));
    expect(html).toContain('/uploads/logos/sample.webp');
    expect(html).toContain('Demo:');
    expect(html).not.toContain('type="file"');
    expect(html).not.toContain('<button');
  });
  it('retains normal upload controls outside restricted forms', () => {
    const html = renderToStaticMarkup(createElement(ImageUpload, { type: 'deal', onUpload: () => {} }));
    expect(html).toContain('type="file"');
  });
});
