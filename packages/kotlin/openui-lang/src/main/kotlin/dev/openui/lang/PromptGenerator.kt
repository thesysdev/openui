package dev.openui.lang

public data class ToolSpec(
    public val name: String,
    public val description: String? = null,
    public val inputSchema: Map<String, Any?> = emptyMap(),
    public val outputSchema: Map<String, Any?> = emptyMap(),
)

public data class PromptOptions(
    public val preamble: String? = null,
    public val additionalRules: List<String> = emptyList(),
    public val examples: List<String> = emptyList(),
    public val toolExamples: List<String> = emptyList(),
    public val tools: List<ToolSpec> = emptyList(),
    public val editMode: Boolean = false,
    public val inlineMode: Boolean = false,
    public val toolCalls: Boolean = tools.isNotEmpty(),
    public val bindings: Boolean = toolCalls,
)

public object PromptGenerator {
    private const val DefaultPreamble =
        "You are an AI assistant that responds using openui-lang, a declarative UI language. Your ENTIRE response must be valid openui-lang code - no markdown, no explanations, just openui-lang."

    public fun generate(library: ComponentLibrary, options: PromptOptions = PromptOptions()): String {
        val rootName = library.root ?: library.components.keys.firstOrNull() ?: "Root"
        return buildString {
            appendLine(options.preamble ?: DefaultPreamble)
            appendLine()
            appendLine("## Syntax Rules")
            appendLine("1. Each statement is on its own line: `identifier = Expression`")
            appendLine("2. `root` is the entry point - every program must define `root = $rootName(...)`")
            appendLine("3. Expressions are strings, numbers, booleans, null, arrays, objects, or component calls.")
            appendLine("4. Arguments are positional and follow the component signature order.")
            appendLine("5. Define reusable child nodes as statements and reference them from parent arrays.")
            if (options.bindings) {
                appendLine("6. Declare mutable state with `\$` variables, for example `\$search = \"\"`.")
            }
            appendLine()
            appendLine("## Components")
            library.components.values.sortedBy { it.name }.forEach { component ->
                appendLine("- `${component.signature()}` - ${component.description}")
            }
            if (library.componentGroups.isNotEmpty()) {
                appendLine()
                appendLine("## Component Groups")
                library.componentGroups.forEach { group ->
                    appendLine("- ${group.name}: ${group.components.joinToString(", ")}")
                    group.notes.forEach { appendLine("  - $it") }
                }
            }
            if (options.toolCalls) {
                appendLine()
                appendLine("## Query and Mutation")
                appendLine("- Use `Query(\"tool\", {args}, {defaults}, refreshSeconds?)` for live data.")
                appendLine("- Use `Mutation(\"tool\", {args})` for actions that change data.")
                appendLine("- Use `Action([@Run(queryName)])` in interactive components to trigger work.")
            }
            if (options.tools.isNotEmpty()) {
                appendLine()
                appendLine("## Tools")
                options.tools.forEach { tool ->
                    append("- `${tool.name}`")
                    if (tool.description != null) append(" - ${tool.description}")
                    appendLine()
                }
            }
            if (options.additionalRules.isNotEmpty()) {
                appendLine()
                appendLine("## Additional Rules")
                options.additionalRules.forEach { appendLine("- $it") }
            }
            if (options.examples.isNotEmpty() || options.toolExamples.isNotEmpty()) {
                appendLine()
                appendLine("## Examples")
                (options.examples + options.toolExamples).forEach { example ->
                    appendLine("```")
                    appendLine(example.trim())
                    appendLine("```")
                }
            }
        }.trim()
    }
}
