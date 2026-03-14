import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { z } from 'zod';
import { createParser } from '@openuidev/react-lang';
import { defineComponent, createLibrary } from '../library.js';
import RendererTest from './RendererTest.svelte';
import TestCard from './TestCard.svelte';

function createTestLibrary() {
  const card = defineComponent({
    name: 'Card',
    props: z.object({
      title: z.string(),
      content: z.any(),
    }),
    description: 'A card component',
    component: TestCard,
  });

  return createLibrary({
    components: [card],
    root: 'Card',
  });
}

describe('Renderer', () => {
  it('renders null when response is null', () => {
    const library = createTestLibrary();
    render(RendererTest, {
      props: { response: null, library },
    });

    const wrapper = screen.getByTestId('renderer-wrapper');
    expect(wrapper.children).toHaveLength(0);
  });

  it('renders a simple Card component from OpenUI Lang', () => {
    const library = createTestLibrary();
    const response = 'root = Card("Hello World", "Some content")';

    render(RendererTest, {
      props: { response, library },
    });

    expect(screen.getByTestId('test-card')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent('Hello World');
    expect(screen.getByTestId('card-content')).toHaveTextContent('Some content');
  });

  it('renders with reference variables', () => {
    const library = createTestLibrary();
    const response = `root = Card("My Title", content)\ncontent = "Referenced content"`;

    render(RendererTest, {
      props: { response, library },
    });

    expect(screen.getByTestId('card-title')).toHaveTextContent('My Title');
    expect(screen.getByTestId('card-content')).toHaveTextContent('Referenced content');
  });

  it('renders nothing for empty response', () => {
    const library = createTestLibrary();
    render(RendererTest, {
      props: { response: '', library },
    });

    const wrapper = screen.getByTestId('renderer-wrapper');
    expect(wrapper.children).toHaveLength(0);
  });

  it('debug: parse array root', () => {
    const library = createTestLibrary();
    const parser = createParser(library.toJSONSchema());
    const response = 'root = Card([Card("a","b"), Card("c","d")])';
    const result = parser.parse(response);
    console.log('SCHEMA:', JSON.stringify(library.toJSONSchema(), null, 2));
    console.log('ROOT:', JSON.stringify(result.root, null, 2));
    console.log('ERRORS:', JSON.stringify(result.errors, null, 2));
  });

  it('handles incomplete/streaming input gracefully', () => {
    const library = createTestLibrary();
    // Incomplete input — parser auto-closes
    const response = 'root = Card("Streaming", "partial';

    render(RendererTest, {
      props: { response, library, isStreaming: true },
    });

    expect(screen.getByTestId('test-card')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent('Streaming');
  });
});
