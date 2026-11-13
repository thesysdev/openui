package dev.openui.lang

private sealed interface Expr {
    data object NullExpr : Expr
    data class Str(val value: String) : Expr
    data class Num(val value: Double) : Expr
    data class Bool(val value: Boolean) : Expr
    data class Arr(val values: List<Expr>) : Expr
    data class Obj(val fields: Map<String, Expr>) : Expr
    data class Ref(val name: String) : Expr
    data class Comp(val name: String, val args: List<Expr>, val namedArgs: Map<String, Expr>) : Expr
}

private data class Statement(val id: String, val expr: Expr)

public class OpenUIParser(private val library: ComponentLibrary) {
    public fun parse(input: String): ParseResult {
        val cleaned = stripComments(stripFences(input.trim())).trim()
        if (cleaned.isEmpty()) return emptyResult(incomplete = true)

        val (source, incomplete) = autoClose(cleaned)
        val statements = parseStatements(source)
        if (statements.isEmpty()) return emptyResult(incomplete)

        val statementMap = statements.associateBy { it.id }
        val entryId = pickEntryId(statementMap)
        val unresolved = linkedSetOf<String>()
        val errors = mutableListOf<ValidationError>()
        val reached = linkedSetOf<String>()

        val root = statementMap[entryId]
            ?.let { materializeElement(it.expr, it.id, statementMap, unresolved, errors, reached, incomplete) }
            ?.copy(statementId = entryId)

        val stateDeclarations = linkedMapOf<String, OpenUIValue>()
        val queries = mutableListOf<QueryStatementInfo>()
        val mutations = mutableListOf<MutationStatementInfo>()

        statements.forEach { statement ->
            when {
                statement.id.startsWith("$") -> {
                    stateDeclarations[statement.id] = materializeValue(
                        statement.expr,
                        statement.id,
                        statementMap,
                        unresolved,
                        errors,
                        reached,
                        incomplete,
                    )
                }
                statement.expr is Expr.Comp && statement.expr.name == "Query" -> {
                    queries += statement.expr.toQuery(statement.id, statementMap, unresolved, errors, reached, incomplete)
                }
                statement.expr is Expr.Comp && statement.expr.name == "Mutation" -> {
                    mutations += statement.expr.toMutation(statement.id, statementMap, unresolved, errors, reached, incomplete)
                }
            }
        }

        val orphaned = statements
            .map { it.id }
            .filterNot { it == entryId || it.startsWith("$") || it in reached }
            .filterNot { id ->
                val expr = statementMap[id]?.expr
                expr is Expr.Comp && (expr.name == "Query" || expr.name == "Mutation")
            }

        return ParseResult(
            root = root,
            meta = ParseResult.Meta(
                incomplete = incomplete,
                unresolved = unresolved.toList(),
                orphaned = orphaned,
                statementCount = statementMap.size,
                errors = errors,
            ),
            stateDeclarations = stateDeclarations,
            queryStatements = queries,
            mutationStatements = mutations,
        )
    }

    public fun streamParser(): OpenUIStreamParser = OpenUIStreamParser(this)

    private fun Expr.Comp.toQuery(
        statementId: String,
        statements: Map<String, Statement>,
        unresolved: MutableSet<String>,
        errors: MutableList<ValidationError>,
        reached: MutableSet<String>,
        incomplete: Boolean,
    ): QueryStatementInfo =
        QueryStatementInfo(
            statementId = statementId,
            tool = args.getOrNull(0)?.let { materializeValue(it, statementId, statements, unresolved, errors, reached, incomplete) },
            args = args.getOrNull(1)?.let { materializeValue(it, statementId, statements, unresolved, errors, reached, incomplete) },
            defaults = args.getOrNull(2)?.let { materializeValue(it, statementId, statements, unresolved, errors, reached, incomplete) },
            refreshInterval = args.getOrNull(3)?.let { materializeValue(it, statementId, statements, unresolved, errors, reached, incomplete) },
            complete = !incomplete,
        )

    private fun Expr.Comp.toMutation(
        statementId: String,
        statements: Map<String, Statement>,
        unresolved: MutableSet<String>,
        errors: MutableList<ValidationError>,
        reached: MutableSet<String>,
        incomplete: Boolean,
    ): MutationStatementInfo =
        MutationStatementInfo(
            statementId = statementId,
            tool = args.getOrNull(0)?.let { materializeValue(it, statementId, statements, unresolved, errors, reached, incomplete) },
            args = args.getOrNull(1)?.let { materializeValue(it, statementId, statements, unresolved, errors, reached, incomplete) },
        )

    private fun materializeValue(
        expr: Expr,
        currentStatementId: String?,
        statements: Map<String, Statement>,
        unresolved: MutableSet<String>,
        errors: MutableList<ValidationError>,
        reached: MutableSet<String>,
        incomplete: Boolean,
    ): OpenUIValue =
        when (expr) {
            Expr.NullExpr -> OpenUIValue.NullValue
            is Expr.Str -> OpenUIValue.StringValue(expr.value)
            is Expr.Num -> OpenUIValue.NumberValue(expr.value)
            is Expr.Bool -> OpenUIValue.BooleanValue(expr.value)
            is Expr.Arr -> OpenUIValue.ArrayValue(
                expr.values.map {
                    materializeValue(it, currentStatementId, statements, unresolved, errors, reached, incomplete)
                },
            )
            is Expr.Obj -> OpenUIValue.ObjectValue(
                expr.fields.mapValues { (_, value) ->
                    materializeValue(value, currentStatementId, statements, unresolved, errors, reached, incomplete)
                },
            )
            is Expr.Ref -> {
                val statement = statements[expr.name]
                if (statement == null) {
                    unresolved += expr.name
                    OpenUIValue.NullValue
                } else {
                    reached += expr.name
                    materializeValue(statement.expr, statement.id, statements, unresolved, errors, reached, incomplete)
                }
            }
            is Expr.Comp -> {
                materializeElement(expr, currentStatementId, statements, unresolved, errors, reached, incomplete)
                    ?.let(OpenUIValue::ElementValue)
                    ?: OpenUIValue.NullValue
            }
        }

    private fun materializeElement(
        expr: Expr,
        currentStatementId: String?,
        statements: Map<String, Statement>,
        unresolved: MutableSet<String>,
        errors: MutableList<ValidationError>,
        reached: MutableSet<String>,
        incomplete: Boolean,
    ): ElementNode? {
        val comp = expr as? Expr.Comp ?: return null
        if (comp.name == "Query" || comp.name == "Mutation") return null

        val def = library.component(comp.name)
        if (def == null && !comp.name.isBuiltInCall()) {
            errors += ValidationError(
                code = ValidationErrorCode.UnknownComponent,
                component = comp.name,
                path = "",
                message = "Unknown component: ${comp.name}",
                statementId = currentStatementId,
            )
        }

        val propDefs = def?.props.orEmpty()
        val props = linkedMapOf<String, OpenUIValue>()

        comp.args.forEachIndexed { index, arg ->
            val prop = propDefs.getOrNull(index)
            if (prop == null && comp.name.isBuiltInCall()) {
                props["arg$index"] = materializeValue(arg, currentStatementId, statements, unresolved, errors, reached, incomplete)
            } else if (prop == null) {
                errors += ValidationError(
                    code = ValidationErrorCode.ExcessArgs,
                    component = comp.name,
                    path = "/$index",
                    message = "Component ${comp.name} does not declare positional argument $index.",
                    statementId = currentStatementId,
                )
            } else {
                props[prop.name] = materializeValue(arg, currentStatementId, statements, unresolved, errors, reached, incomplete)
            }
        }

        comp.namedArgs.forEach { (name, arg) ->
            props[name] = materializeValue(arg, currentStatementId, statements, unresolved, errors, reached, incomplete)
        }

        propDefs.forEach { prop ->
            val value = props[prop.name]
            if (value == null && prop.defaultValue != null) {
                props[prop.name] = prop.defaultValue
            } else if (value == null && prop.required && !incomplete) {
                errors += ValidationError(
                    code = ValidationErrorCode.MissingRequired,
                    component = comp.name,
                    path = "/${prop.name}",
                    message = "Missing required prop ${prop.name} for component ${comp.name}.",
                    statementId = currentStatementId,
                )
            } else if (value == OpenUIValue.NullValue && prop.required && !incomplete) {
                errors += ValidationError(
                    code = ValidationErrorCode.NullRequired,
                    component = comp.name,
                    path = "/${prop.name}",
                    message = "Required prop ${prop.name} for component ${comp.name} cannot be null.",
                    statementId = currentStatementId,
                )
            }
        }

        return ElementNode(
            statementId = currentStatementId,
            typeName = comp.name,
            props = props,
            partial = incomplete,
        )
    }

    private fun parseStatements(source: String): List<Statement> {
        val parser = ExpressionParser(source)
        return parser.statements()
    }

    private fun pickEntryId(statements: Map<String, Statement>): String =
        when {
            statements.containsKey("root") -> "root"
            library.root != null && statements.containsKey(library.root) -> library.root
            else -> statements.keys.first()
        }
}

public class OpenUIStreamParser(private val parser: OpenUIParser) {
    private var buffer: String = ""

    public fun push(chunk: String): ParseResult {
        buffer += chunk
        return parser.parse(buffer)
    }

    public fun set(fullText: String): ParseResult {
        buffer = fullText
        return parser.parse(buffer)
    }

    public fun getResult(): ParseResult = parser.parse(buffer)
}

private class ExpressionParser(private val source: String) {
    private var index = 0

    fun statements(): List<Statement> {
        val statements = mutableListOf<Statement>()
        while (!eof()) {
            skipWhitespace()
            val id = parseIdentifier(allowState = true)
            if (id == null) {
                index++
                continue
            }
            skipWhitespace()
            if (!match("=")) continue
            val expr = parseExpression() ?: continue
            statements += Statement(id, expr)
        }
        return statements
    }

    private fun parseExpression(): Expr? {
        skipWhitespace()
        if (eof()) return null
        return when (peek()) {
            '"' -> Expr.Str(parseString())
            '[' -> Expr.Arr(parseArray())
            '{' -> Expr.Obj(parseObject())
            else -> when {
                startsWith("true") -> {
                    index += 4
                    Expr.Bool(true)
                }
                startsWith("false") -> {
                    index += 5
                    Expr.Bool(false)
                }
                startsWith("null") -> {
                    index += 4
                    Expr.NullExpr
                }
                peek() == '-' || peek().isDigit() -> Expr.Num(parseNumber())
                else -> parseIdentifier(allowState = true, allowBuiltin = true)?.let { ident ->
                    skipWhitespace()
                    if (match("(")) {
                        val (args, named) = parseArguments()
                        Expr.Comp(ident, args, named)
                    } else {
                        Expr.Ref(ident)
                    }
                }
            }
        }
    }

    private fun parseArguments(): Pair<List<Expr>, Map<String, Expr>> {
        val args = mutableListOf<Expr>()
        val named = linkedMapOf<String, Expr>()
        while (!eof()) {
            skipWhitespace()
            if (match(")")) break
            val checkpoint = index
            val maybeName = parseIdentifier(allowState = false, allowBuiltin = false)
            if (maybeName != null) {
                skipWhitespace()
                if (match(":")) {
                    parseExpression()?.let { named[maybeName] = it }
                } else {
                    index = checkpoint
                    if (parseExpression()?.let(args::add) == null) index++
                }
            } else {
                if (parseExpression()?.let(args::add) == null) index++
            }
            skipWhitespace()
            match(",")
        }
        return args to named
    }

    private fun parseArray(): List<Expr> {
        match("[")
        val values = mutableListOf<Expr>()
        while (!eof()) {
            skipWhitespace()
            if (match("]")) break
            if (parseExpression()?.let(values::add) == null) index++
            skipWhitespace()
            match(",")
        }
        return values
    }

    private fun parseObject(): Map<String, Expr> {
        match("{")
        val fields = linkedMapOf<String, Expr>()
        while (!eof()) {
            skipWhitespace()
            if (match("}")) break
            val key = if (peek() == '"') parseString() else parseIdentifier(allowState = false, allowBuiltin = false)
            skipWhitespace()
            if (key != null && match(":")) {
                if (parseExpression()?.let { fields[key] = it } == null) index++
            } else if (key == null) {
                index++
            }
            skipWhitespace()
            match(",")
        }
        return fields
    }

    private fun parseString(): String {
        match("\"")
        val result = StringBuilder()
        while (!eof()) {
            val ch = source[index++]
            if (ch == '"') break
            if (ch == '\\' && !eof()) {
                val escaped = source[index++]
                result.append(
                    when (escaped) {
                        'n' -> '\n'
                        'r' -> '\r'
                        't' -> '\t'
                        '"' -> '"'
                        '\\' -> '\\'
                        else -> escaped
                    },
                )
            } else {
                result.append(ch)
            }
        }
        return result.toString()
    }

    private fun parseNumber(): Double {
        val start = index
        if (peek() == '-') index++
        while (!eof() && peek().isDigit()) index++
        if (!eof() && peek() == '.') {
            index++
            while (!eof() && peek().isDigit()) index++
        }
        return source.substring(start, index).toDoubleOrNull() ?: 0.0
    }

    private fun parseIdentifier(allowState: Boolean, allowBuiltin: Boolean = false): String? {
        if (eof()) return null
        val start = index
        if (allowState && peek() == '$') index++
        if (allowBuiltin && !eof() && peek() == '@') index++
        if (eof() || !(peek().isLetter() || peek() == '_')) {
            index = start
            return null
        }
        index++
        while (!eof() && (peek().isLetterOrDigit() || peek() == '_' || peek() == '-')) index++
        return source.substring(start, index)
    }

    private fun skipWhitespace() {
        while (!eof() && peek().isWhitespace()) index++
    }

    private fun match(token: String): Boolean {
        if (!startsWith(token)) return false
        index += token.length
        return true
    }

    private fun startsWith(token: String): Boolean = source.startsWith(token, index)
    private fun eof(): Boolean = index >= source.length
    private fun peek(): Char = source[index]
}

private fun String.isBuiltInCall(): Boolean = this == "Action" || startsWith("@")

private fun emptyResult(incomplete: Boolean): ParseResult =
    ParseResult(
        root = null,
        meta = ParseResult.Meta(
            incomplete = incomplete,
            unresolved = emptyList(),
            orphaned = emptyList(),
            statementCount = 0,
            errors = emptyList(),
        ),
        stateDeclarations = emptyMap(),
        queryStatements = emptyList(),
        mutationStatements = emptyList(),
    )

private fun stripFences(input: String): String {
    if (!input.startsWith("```")) return input
    val firstNewline = input.indexOf('\n')
    if (firstNewline == -1) return ""
    val body = input.substring(firstNewline + 1)
    val trailing = body.lastIndexOf("```")
    return if (trailing >= 0) body.substring(0, trailing) else body
}

private fun stripComments(input: String): String =
    input.lineSequence().joinToString("\n") { line ->
        var inString = false
        var escaped = false
        for (i in line.indices) {
            val ch = line[i]
            if (escaped) {
                escaped = false
                continue
            }
            if (ch == '\\' && inString) {
                escaped = true
                continue
            }
            if (ch == '"') inString = !inString
            if (!inString && ch == '#') return@joinToString line.substring(0, i).trimEnd()
            if (!inString && ch == '/' && line.getOrNull(i + 1) == '/') {
                return@joinToString line.substring(0, i).trimEnd()
            }
        }
        line
    }

private fun autoClose(input: String): Pair<String, Boolean> {
    var parens = 0
    var brackets = 0
    var braces = 0
    var inString = false
    var escaped = false
    input.forEach { ch ->
        if (escaped) {
            escaped = false
            return@forEach
        }
        if (ch == '\\' && inString) {
            escaped = true
            return@forEach
        }
        if (ch == '"') {
            inString = !inString
            return@forEach
        }
        if (!inString) {
            when (ch) {
                '(' -> parens++
                ')' -> parens = (parens - 1).coerceAtLeast(0)
                '[' -> brackets++
                ']' -> brackets = (brackets - 1).coerceAtLeast(0)
                '{' -> braces++
                '}' -> braces = (braces - 1).coerceAtLeast(0)
            }
        }
    }
    val incomplete = inString || parens > 0 || brackets > 0 || braces > 0
    val closed = buildString {
        append(input)
        if (inString) append('"')
        repeat(braces) { append('}') }
        repeat(brackets) { append(']') }
        repeat(parens) { append(')') }
    }
    return closed to incomplete
}
