import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import Renderer from "../Renderer.vue";
import { createLibrary, defineComponent } from "../library.js";

// Dummy renderer — never actually renders DOM, used for parser/callback tests
const DummyComponent = (() => null) as any;

const TextContent = defineComponent({
	name: "TextContent",
	props: z.object({ text: z.string() }),
	description: "Displays text content",
	component: DummyComponent,
});

const library = createLibrary({
	components: [TextContent],
	root: "TextContent",
});

// openui-lang uses assignment syntax: `identifier = Component(args)`
const VALID_RESPONSE = 'root = TextContent("Hello world")';

// ─── Renderer ───────────────────────────────────────────────────────────────

describe("Renderer", () => {
	it("renders without errors when response is null", () => {
		const wrapper = mount(Renderer, {
			props: {
				response: null,
				library,
			},
		});

		expect(wrapper.element).toBeDefined();
	});

	it("renders without errors when response is empty string", () => {
		const wrapper = mount(Renderer, {
			props: {
				response: "",
				library,
			},
		});

		expect(wrapper.element).toBeDefined();
	});

	it("calls onParseResult with null when response is null", async () => {
		const onParseResult = vi.fn();

		mount(Renderer, {
			props: {
				response: null,
				library,
				onParseResult,
			},
		});

		await nextTick();

		expect(onParseResult).toHaveBeenCalledWith(null);
	});

	it("calls onParseResult with a ParseResult when given valid openui-lang", async () => {
		const onParseResult = vi.fn();

		mount(Renderer, {
			props: {
				response: VALID_RESPONSE,
				library,
				onParseResult,
			},
		});

		await nextTick();

		expect(onParseResult).toHaveBeenCalled();
		const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
		expect(result).not.toBeNull();
		expect(result.root).toBeDefined();
		expect(result.root).not.toBeNull();
	});

	it("parse result contains the correct component typeName", async () => {
		const onParseResult = vi.fn();

		mount(Renderer, {
			props: {
				response: VALID_RESPONSE,
				library,
				onParseResult,
			},
		});

		await nextTick();

		const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
		expect(result?.root?.typeName).toBe("TextContent");
	});

	it("defaults isStreaming to false", () => {
		// Should not throw when isStreaming is omitted
		const wrapper = mount(Renderer, {
			props: {
				response: null,
				library,
			},
		});
		expect(wrapper.element).toBeDefined();
	});

	it("accepts isStreaming prop without errors", () => {
		const wrapper = mount(Renderer, {
			props: {
				response: null,
				library,
				isStreaming: true,
			},
		});
		expect(wrapper.element).toBeDefined();
	});
});
