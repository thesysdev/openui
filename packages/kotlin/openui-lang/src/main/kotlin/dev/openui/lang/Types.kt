package dev.openui.lang

public sealed interface OpenUIType {
    public fun signature(): String

    public data object StringType : OpenUIType {
        override fun signature(): String = "string"
    }

    public data object NumberType : OpenUIType {
        override fun signature(): String = "number"
    }

    public data object BooleanType : OpenUIType {
        override fun signature(): String = "boolean"
    }

    public data object AnyType : OpenUIType {
        override fun signature(): String = "any"
    }

    public data class Literal(public val value: String) : OpenUIType {
        override fun signature(): String = "\"$value\""
    }

    public data class Enum(public val values: List<String>) : OpenUIType {
        override fun signature(): String = values.joinToString(" | ") { "\"$it\"" }
    }

    public data class Component(public val name: String) : OpenUIType {
        override fun signature(): String = name
    }

    public data class ArrayOf(public val item: OpenUIType) : OpenUIType {
        override fun signature(): String = "${item.signature()}[]"
    }

    public data class RecordOf(
        public val key: OpenUIType = StringType,
        public val value: OpenUIType = AnyType,
    ) : OpenUIType {
        override fun signature(): String = "Record<${key.signature()}, ${value.signature()}>"
    }

    public data class ObjectOf(public val fields: List<PropDef>) : OpenUIType {
        override fun signature(): String =
            fields.joinToString(prefix = "{", postfix = "}") { field ->
                val optional = if (field.required) "" else "?"
                "${field.name}$optional: ${field.type.signature()}"
            }
    }

    public data class Binding(public val inner: OpenUIType) : OpenUIType {
        override fun signature(): String = "\$binding<${inner.signature()}>"
    }
}

public data class PropDef(
    public val name: String,
    public val type: OpenUIType = OpenUIType.AnyType,
    public val required: Boolean = true,
    public val defaultValue: OpenUIValue? = null,
)

public data class ComponentDef(
    public val name: String,
    public val description: String,
    public val props: List<PropDef> = emptyList(),
) {
    public fun signature(): String {
        val params = props.joinToString(", ") { prop ->
            val optional = if (prop.required) "" else "?"
            "${prop.name}$optional: ${prop.type.signature()}"
        }
        return "$name($params)"
    }
}

public data class ComponentGroup(
    public val name: String,
    public val components: List<String>,
    public val notes: List<String> = emptyList(),
)

public sealed interface OpenUIValue {
    public data object NullValue : OpenUIValue
    public data class StringValue(public val value: String) : OpenUIValue
    public data class NumberValue(public val value: Double) : OpenUIValue
    public data class BooleanValue(public val value: Boolean) : OpenUIValue
    public data class ArrayValue(public val values: List<OpenUIValue>) : OpenUIValue
    public data class ObjectValue(public val fields: Map<String, OpenUIValue>) : OpenUIValue
    public data class ElementValue(public val node: ElementNode) : OpenUIValue
}

public data class ElementNode(
    public val statementId: String? = null,
    public val typeName: String,
    public val props: Map<String, OpenUIValue>,
    public val partial: Boolean,
    public val hasDynamicProps: Boolean = false,
)

public enum class ValidationErrorCode {
    MissingRequired,
    NullRequired,
    UnknownComponent,
    InlineReserved,
    ExcessArgs,
}

public data class ValidationError(
    public val code: ValidationErrorCode,
    public val component: String,
    public val path: String,
    public val message: String,
    public val statementId: String? = null,
)

public data class QueryStatementInfo(
    public val statementId: String,
    public val tool: OpenUIValue?,
    public val args: OpenUIValue?,
    public val defaults: OpenUIValue?,
    public val refreshInterval: OpenUIValue?,
    public val complete: Boolean,
)

public data class MutationStatementInfo(
    public val statementId: String,
    public val tool: OpenUIValue?,
    public val args: OpenUIValue?,
)

public data class ParseResult(
    public val root: ElementNode?,
    public val meta: Meta,
    public val stateDeclarations: Map<String, OpenUIValue>,
    public val queryStatements: List<QueryStatementInfo>,
    public val mutationStatements: List<MutationStatementInfo>,
) {
    public data class Meta(
        public val incomplete: Boolean,
        public val unresolved: List<String>,
        public val orphaned: List<String>,
        public val statementCount: Int,
        public val errors: List<ValidationError>,
    )
}

public fun OpenUIValue.asStringOrNull(): String? =
    (this as? OpenUIValue.StringValue)?.value

public fun OpenUIValue.asArrayOrEmpty(): List<OpenUIValue> =
    (this as? OpenUIValue.ArrayValue)?.values.orEmpty()

public fun OpenUIValue.asElementOrNull(): ElementNode? =
    (this as? OpenUIValue.ElementValue)?.node
