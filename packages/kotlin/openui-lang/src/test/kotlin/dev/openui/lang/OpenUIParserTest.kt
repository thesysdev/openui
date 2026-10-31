package dev.openui.lang

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class OpenUIParserTest {
    private val library = openUILibrary {
        component(
            name = "Root",
            description = "Root layout.",
            props = listOf(PropDef("children", OpenUIType.ArrayOf(OpenUIType.Component("Component")))),
        )
        component(
            name = "Text",
            description = "Text content.",
            props = listOf(PropDef("text", OpenUIType.StringType)),
        )
        component(
            name = "Button",
            description = "Action button.",
            props = listOf(
                PropDef("label", OpenUIType.StringType),
                PropDef("action", OpenUIType.AnyType, required = false),
            ),
        )
        component(
            name = "Table",
            description = "Data table.",
            props = listOf(
                PropDef("columns", OpenUIType.ArrayOf(OpenUIType.StringType)),
                PropDef("rows", OpenUIType.ArrayOf(OpenUIType.RecordOf())),
            ),
        )
        root("Root")
    }

    @Test
    fun promptIncludesTypedComponentSignatures() {
        val prompt = library.prompt()

        assertTrue(prompt.contains("Root(children: Component[])"))
        assertTrue(prompt.contains("Button(label: string, action?: any)"))
    }

    @Test
    fun parsesRootAndMapsPositionalProps() {
        val result = OpenUIParser(library).parse(
            """
            root = Root([copy, action])
            copy = Text("Hello Kotlin")
            action = Button("Open", Action([@OpenUrl("https://openui.com")]))
            """.trimIndent(),
        )

        assertFalse(result.meta.incomplete)
        assertTrue(result.meta.errors.isEmpty())
        assertEquals("Root", result.root?.typeName)

        val children = result.root?.props?.get("children") as OpenUIValue.ArrayValue
        val text = children.values.first() as OpenUIValue.ElementValue
        assertEquals("Hello Kotlin", text.node.props["text"]?.asStringOrNull())
    }

    @Test
    fun streamParserReturnsPartialThenCompleteResult() {
        val stream = OpenUIParser(library).streamParser()

        val partial = stream.push("root = Root([Text(\"loa")
        assertTrue(partial.meta.incomplete)
        assertNotNull(partial.root)

        val complete = stream.push("ded\")])")
        assertFalse(complete.meta.incomplete)
        assertEquals("Root", complete.root?.typeName)
    }

    @Test
    fun extractsStateAndQueryStatements() {
        val result = OpenUIParser(library).parse(
            """
            ${'$'}search = "kotlin"
            rows = Query("searchRows", {q: ${'$'}search}, {rows: []}, 30)
            root = Root([Text("Loaded")])
            """.trimIndent(),
        )

        assertEquals("kotlin", result.stateDeclarations["${'$'}search"]?.asStringOrNull())
        assertEquals(1, result.queryStatements.size)
        assertEquals("rows", result.queryStatements.first().statementId)
    }
}
