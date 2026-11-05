package dev.openui.sample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.openui.compose.OpenUIRenderer
import dev.openui.lang.OpenUIParser
import dev.openui.lang.OpenUIType
import dev.openui.lang.PropDef
import dev.openui.lang.openUILibrary

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    StreamingChatDemo()
                }
            }
        }
    }
}

@Composable
private fun StreamingChatDemo() {
    val library = remember { sampleLibrary() }
    val parser = remember { OpenUIParser(library).streamParser() }
    var source by remember {
        mutableStateOf(
            """
            root = Root([title, card])
            title = Heading("Native Kotlin OpenUI")
            card = Card([copy, action])
            copy = Text("This UI was parsed from OpenUI Lang and rendered by Jetpack Compose.")
            action = Button("Continue", Action([@ToAssistant("Show me the next step")]))
            """.trimIndent(),
        )
    }
    val result = parser.set(source)

    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        OutlinedTextField(
            value = source,
            onValueChange = { source = it },
            modifier = Modifier.weight(1f),
            label = { Text("Streaming OpenUI Lang buffer") },
        )
        OpenUIRenderer(
            node = result.root,
            onAction = { action ->
                source += "\nnotice = Text(\"Action: ${action.label ?: action.component}\")"
            },
        )
    }
}

private fun sampleLibrary() = openUILibrary {
    component(
        name = "Root",
        description = "Top-level container for a generated screen.",
        props = listOf(PropDef("children", OpenUIType.ArrayOf(OpenUIType.Component("Component")))),
    )
    component(
        name = "Card",
        description = "Grouped content surface.",
        props = listOf(PropDef("children", OpenUIType.ArrayOf(OpenUIType.Component("Component")))),
    )
    component(
        name = "Heading",
        description = "Large section heading.",
        props = listOf(PropDef("text", OpenUIType.StringType)),
    )
    component(
        name = "Text",
        description = "Body text.",
        props = listOf(PropDef("text", OpenUIType.StringType)),
    )
    component(
        name = "Button",
        description = "Button that dispatches an OpenUI action callback.",
        props = listOf(
            PropDef("label", OpenUIType.StringType),
            PropDef("action", OpenUIType.AnyType, required = false),
        ),
    )
    root("Root")
}
