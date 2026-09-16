package dev.openui.lang

public class ComponentLibrary(
    components: List<ComponentDef> = emptyList(),
    public val componentGroups: List<ComponentGroup> = emptyList(),
    public val root: String? = null,
) {
    private val componentMap: LinkedHashMap<String, ComponentDef> = linkedMapOf()

    public val components: Map<String, ComponentDef>
        get() = componentMap.toMap()

    init {
        components.forEach(::register)
        require(root == null || componentMap.containsKey(root)) {
            "Root component \"$root\" was not found in the component library."
        }
    }

    public fun register(component: ComponentDef): ComponentLibrary = apply {
        componentMap[component.name] = component
    }

    public fun prompt(options: PromptOptions = PromptOptions()): String =
        PromptGenerator.generate(this, options)

    public fun paramNames(componentName: String): List<String> =
        componentMap[componentName]?.props?.map { it.name }.orEmpty()

    public fun component(componentName: String): ComponentDef? = componentMap[componentName]
}

public class ComponentLibraryBuilder {
    private val components = mutableListOf<ComponentDef>()
    private val groups = mutableListOf<ComponentGroup>()
    private var root: String? = null

    public fun component(
        name: String,
        description: String,
        props: List<PropDef> = emptyList(),
    ) {
        components += ComponentDef(name, description, props)
    }

    public fun group(name: String, components: List<String>, notes: List<String> = emptyList()) {
        groups += ComponentGroup(name, components, notes)
    }

    public fun root(name: String) {
        root = name
    }

    internal fun build(): ComponentLibrary = ComponentLibrary(components, groups, root)
}

public fun openUILibrary(block: ComponentLibraryBuilder.() -> Unit): ComponentLibrary =
    ComponentLibraryBuilder().apply(block).build()
