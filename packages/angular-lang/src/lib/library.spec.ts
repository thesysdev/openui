import { Component } from "@angular/core";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "./library";

@Component({
  selector: "test-card",
  template: "",
})
class TestCardComponent {}

describe("angular-lang library wrapper", () => {
  it("registers an Angular component through the public library helpers", () => {
    const Card = defineComponent({
      name: "Card",
      description: "A card container",
      props: z.object({
        title: z.string(),
      }),
      component: TestCardComponent,
    });

    const library = createLibrary({
      components: [Card],
      root: "Card",
    });

    expect(library.root).toBe("Card");
    expect(library.components["Card"]?.component).toBe(TestCardComponent);
    expect(Card.ref).toBe(Card.props);
  });
});
