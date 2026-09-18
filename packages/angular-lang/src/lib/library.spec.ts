import { Component } from "@angular/core";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "./library";

@Component({
  selector: "test-card",
  template: "",
})
class TestCardComponent {}

@Component({
  selector: "test-stack",
  template: "",
})
class TestStackComponent {}

describe("angular-lang library wrapper", () => {
  it("defines an Angular component with schema metadata and a reusable ref", () => {
    const Card = defineComponent({
      name: "Card",
      description: "A card container",
      props: z.object({
        title: z.string(),
      }),
      component: TestCardComponent,
    });

    expect(Card.name).toBe("Card");
    expect(Card.description).toBe("A card container");
    expect(Card.component).toBe(TestCardComponent);
    expect(Card.ref).toBe(Card.props);
  });

  it("creates a library with registered Angular components and a root", () => {
    const Card = defineComponent({
      name: "Card",
      description: "A card container",
      props: z.object({
        title: z.string(),
      }),
      component: TestCardComponent,
    });

    const Stack = defineComponent({
      name: "Stack",
      description: "A vertical layout",
      props: z.object({
        gap: z.number().optional(),
      }),
      component: TestStackComponent,
    });

    const library = createLibrary({
      components: [Card, Stack],
      root: "Card",
      id: "angular-demo",
    });

    expect(library.root).toBe("Card");
    expect(library.id).toBe("angular-demo");
    expect(library.components["Card"]?.component).toBe(TestCardComponent);
    expect(library.components["Stack"]?.component).toBe(TestStackComponent);
    expect(library.toJSONSchema().$defs).toHaveProperty("Card");
    expect(library.toJSONSchema().$defs).toHaveProperty("Stack");
  });

  it("throws when the configured root does not exist", () => {
    const Card = defineComponent({
      name: "Card",
      description: "A card container",
      props: z.object({
        title: z.string(),
      }),
      component: TestCardComponent,
    });

    expect(() => {
      createLibrary({
        components: [Card],
        root: "MissingRoot",
      });
    }).toThrow(/Root component/);
  });
});
