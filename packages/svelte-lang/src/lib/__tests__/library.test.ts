import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// We test the library utilities directly — they don't depend on Svelte rendering.
// Import from the built source.
import { defineComponent, createLibrary } from '../library.js';

// Minimal stub component for testing (never actually rendered in these tests)
const StubComponent = {} as any;

describe('defineComponent', () => {
  it('returns a DefinedComponent with name, props, description, component, and ref', () => {
    const comp = defineComponent({
      name: 'TestCard',
      props: z.object({ title: z.string() }),
      description: 'A test card',
      component: StubComponent,
    });

    expect(comp.name).toBe('TestCard');
    expect(comp.description).toBe('A test card');
    expect(comp.component).toBe(StubComponent);
    expect(comp.ref).toBeDefined();
  });

  it('registers the schema in Zod global registry', () => {
    const schema = z.object({ label: z.string() });
    defineComponent({
      name: 'RegisteredComp',
      props: schema,
      description: 'test',
      component: StubComponent,
    });

    const meta = z.globalRegistry.get(schema);
    expect(meta).toBeDefined();
    expect(meta?.id).toBe('RegisteredComp');
  });

  it('provides a .ref for cross-referencing in parent schemas', () => {
    const child = defineComponent({
      name: 'ChildComp',
      props: z.object({ value: z.string() }),
      description: 'child',
      component: StubComponent,
    });

    // .ref can be used in a parent schema
    const parentSchema = z.object({
      items: z.array(child.ref),
    });

    expect(parentSchema).toBeDefined();
  });
});

describe('createLibrary', () => {
  const card = defineComponent({
    name: 'Card',
    props: z.object({ title: z.string(), content: z.any() }),
    description: 'A card',
    component: StubComponent,
  });

  const table = defineComponent({
    name: 'Table',
    props: z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }),
    description: 'A table',
    component: StubComponent,
  });

  it('creates a library with components record', () => {
    const lib = createLibrary({ components: [card, table] });

    expect(lib.components['Card']).toBe(card);
    expect(lib.components['Table']).toBe(table);
    expect(Object.keys(lib.components)).toHaveLength(2);
  });

  it('sets root component when specified', () => {
    const lib = createLibrary({ components: [card, table], root: 'Card' });
    expect(lib.root).toBe('Card');
  });

  it('throws if root component does not exist', () => {
    expect(() =>
      createLibrary({ components: [card], root: 'NonExistent' })
    ).toThrow(/Root component "NonExistent" was not found/);
  });

  it('stores componentGroups', () => {
    const lib = createLibrary({
      components: [card, table],
      componentGroups: [
        { name: 'Layout', components: ['Card'] },
        { name: 'Data', components: ['Table'] },
      ],
    });

    expect(lib.componentGroups).toHaveLength(2);
    expect(lib.componentGroups![0].name).toBe('Layout');
  });

  it('generates a prompt string', () => {
    const lib = createLibrary({ components: [card, table], root: 'Card' });
    const prompt = lib.prompt();

    expect(prompt).toContain('Card');
    expect(prompt).toContain('Table');
    expect(prompt).toContain('root');
  });

  it('generates a prompt with custom options', () => {
    const lib = createLibrary({ components: [card], root: 'Card' });
    const prompt = lib.prompt({
      preamble: 'Custom preamble here',
      additionalRules: ['Rule one', 'Rule two'],
    });

    expect(prompt).toContain('Custom preamble here');
    expect(prompt).toContain('Rule one');
    expect(prompt).toContain('Rule two');
  });

  it('generates JSON Schema with $defs for all components', () => {
    const lib = createLibrary({ components: [card, table], root: 'Card' });
    const schema = lib.toJSONSchema() as any;

    expect(schema.$defs).toBeDefined();
    expect(schema.$defs['Card']).toBeDefined();
    expect(schema.$defs['Table']).toBeDefined();
  });
});
