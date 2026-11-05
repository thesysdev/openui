package dev.openui.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.openui.lang.ElementNode
import dev.openui.lang.OpenUIValue
import dev.openui.lang.asArrayOrEmpty
import dev.openui.lang.asElementOrNull
import dev.openui.lang.asStringOrNull

public data class OpenUIAction(
    public val component: String,
    public val label: String?,
    public val payload: OpenUIValue?,
)

public fun interface ComponentRenderer {
    @Composable
    public fun Render(node: ElementNode, context: OpenUIRenderContext)
}

public class OpenUIRenderContext(
    private val registry: OpenUIComposeRegistry,
    private val onAction: (OpenUIAction) -> Unit,
) {
    @Composable
    public fun Render(node: ElementNode?) {
        OpenUIRenderer(node = node, registry = registry, onAction = onAction)
    }

    public fun dispatch(action: OpenUIAction) {
        onAction(action)
    }
}

public class OpenUIComposeRegistry(
    renderers: Map<String, ComponentRenderer> = emptyMap(),
) {
    private val renderers = LinkedHashMap(defaultRenderers()).apply {
        putAll(renderers)
    }

    public fun register(name: String, renderer: ComponentRenderer): OpenUIComposeRegistry = apply {
        renderers[name] = renderer
    }

    internal fun renderer(name: String): ComponentRenderer? = renderers[name]
}

@Composable
public fun OpenUIRenderer(
    node: ElementNode?,
    registry: OpenUIComposeRegistry = OpenUIComposeRegistry(),
    onAction: (OpenUIAction) -> Unit = {},
) {
    val context = OpenUIRenderContext(registry, onAction)
    if (node == null) {
        Text("No UI to render", color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    registry.renderer(node.typeName)?.Render(node, context)
        ?: Text("Unknown component: ${node.typeName}", color = MaterialTheme.colorScheme.error)
}

private fun defaultRenderers(): Map<String, ComponentRenderer> =
    mapOf(
        "Root" to ComponentRenderer { node, context ->
            Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                node.children().forEach { context.Render(it) }
            }
        },
        "Stack" to ComponentRenderer { node, context ->
            val direction = node.stringProp("direction") ?: "column"
            if (direction == "row") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    node.children().forEach { context.Render(it) }
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    node.children().forEach { context.Render(it) }
                }
            }
        },
        "VStack" to ComponentRenderer { node, context ->
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                node.children().forEach { context.Render(it) }
            }
        },
        "HStack" to ComponentRenderer { node, context ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                node.children().forEach { context.Render(it) }
            }
        },
        "Card" to ComponentRenderer { node, context ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    node.children().forEach { context.Render(it) }
                }
            }
        },
        "Text" to ComponentRenderer { node, _ ->
            Text(node.stringProp("text") ?: node.stringProp("children") ?: "")
        },
        "TextContent" to ComponentRenderer { node, _ ->
            Text(node.stringProp("text") ?: "")
        },
        "Heading" to ComponentRenderer { node, _ ->
            Text(node.stringProp("text") ?: "", style = MaterialTheme.typography.headlineSmall)
        },
        "Button" to ComponentRenderer { node, context ->
            val label = node.stringProp("label") ?: node.stringProp("text") ?: "Button"
            Button(
                onClick = {
                    context.dispatch(OpenUIAction(node.typeName, label, node.props["action"]))
                },
            ) {
                Text(label)
            }
        },
        "Input" to ComponentRenderer { node, context ->
            OutlinedTextField(
                value = node.stringProp("value") ?: "",
                onValueChange = {
                    context.dispatch(OpenUIAction(node.typeName, node.stringProp("name"), OpenUIValue.StringValue(it)))
                },
                label = { Text(node.stringProp("label") ?: "") },
                modifier = Modifier.fillMaxWidth(),
            )
        },
        "Checkbox" to ComponentRenderer { node, context ->
            Row {
                Checkbox(
                    checked = (node.props["checked"] as? OpenUIValue.BooleanValue)?.value ?: false,
                    onCheckedChange = {
                        context.dispatch(OpenUIAction(node.typeName, node.stringProp("name"), OpenUIValue.BooleanValue(it)))
                    },
                )
                Text(node.stringProp("label") ?: "")
            }
        },
        "List" to ComponentRenderer { node, context ->
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(node.children()) { child -> context.Render(child) }
            }
        },
        "Table" to ComponentRenderer { node, _ ->
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(node.stringProp("title") ?: "Table", style = MaterialTheme.typography.titleMedium)
                Divider()
                Text(
                    "Rows: ${node.props["rows"]?.asArrayOrEmpty().orEmpty().size}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        },
        "Chart" to ComponentRenderer { node, _ ->
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(node.stringProp("title") ?: "Chart", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(96.dp))
                Text("Chart data ready", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        },
    )

private fun ElementNode.children(): List<ElementNode> {
    val direct = props["children"]?.asArrayOrEmpty().orEmpty().mapNotNull { it.asElementOrNull() }
    if (direct.isNotEmpty()) return direct
    return props["items"]?.asArrayOrEmpty().orEmpty().mapNotNull { it.asElementOrNull() }
}

private fun ElementNode.stringProp(name: String): String? =
    props[name]?.asStringOrNull()
