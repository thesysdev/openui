# OpenUI Lang 基准测试

衡量 **OpenUI Lang** 与另外三种结构化流式格式在七个真实 UI 场景中的 token 效率和预计生成延迟：

- **YAML**
- **Vercel JSON-Render**（RFC 6902 patch 流）
- **Thesys C1 JSON**（标准化组件树）

## 格式

| 格式                   | 说明                                                                  |
| ---------------------- | --------------------------------------------------------------------- |
| **OpenUI Lang**        | 由 LLM 直接生成的面向行 DSL                                           |
| **YAML**               | YAML `root` / `elements` 规范载荷                                     |
| **Vercel JSON-Render** | [JSON Patch (RFC 6902)](https://jsonpatch.com/) 操作的 JSONL 流       |
| **Thesys C1 JSON**     | 标准化组件树 JSON（`component` + `props`）                            |

四种格式编码的 UI 完全相同。LLM 始终先生成 OpenUI Lang，然后将解析得到的 AST 映射为另外三种格式。

## 方法

1. 使用 `generate-samples.ts` 中固定的七个提示词集合（`simple-table`、`chart-with-data`、`contact-form`、`dashboard`、`pricing-page`、`settings-panel`、`e-commerce-product`）。
2. 针对每个提示词，使用 `gpt-5.2` 在 `temperature: 0` 且启用流式补全的条件下生成一次 OpenUI Lang。
3. 使用 `createParser(schema)` 解析 OpenUI Lang 输出，使位置参数通过 `schema.json` 映射为具名 props。
4. 将同一个解析后的 AST 转换为：
   - `*.c1.json`：通过 `thesys-c1-converter.ts` 转为 Thesys C1 格式。
   - `*.vercel.jsonl`：通过 `vercel-jsonl-converter.ts` 转为 json-render RFC 6902 patches。
   - `*.yaml`：通过 `yaml-converter.ts` 转为 json-render YAML 规范载荷。
5. 使用 `tiktoken` 和 `encoding_for_model("gpt-5")` 对 `samples/` 中所有保存的产物统计 token 数。
6. 以固定的 60 tokens/second 报告 token 数和预计解码延迟。

## 结果

使用 `tiktoken`（`gpt-5` 模型编码器）测得。由 GPT-5.2 在 temperature 0 下生成。

| 场景               |     YAML | Vercel JSON-Render | Thesys C1 JSON | OpenUI Lang |    相比 YAML | 相比 Vercel |    相比 C1 |
| ------------------ | -------: | -----------------: | -------------: | ----------: | -----------: | ----------: | ---------: |
| simple-table       |      316 |                340 |            357 |         148 |       -53.2% |      -56.5% |     -58.5% |
| chart-with-data    |      464 |                520 |            516 |         231 |       -50.2% |      -55.6% |     -55.2% |
| contact-form       |      762 |                893 |            849 |         294 |       -61.4% |      -67.1% |     -65.4% |
| dashboard          |     2128 |               2247 |           2261 |        1226 |       -42.4% |      -45.4% |     -45.8% |
| pricing-page       |     2230 |               2487 |           2379 |        1195 |       -46.4% |      -52.0% |     -49.8% |
| settings-panel     |     1077 |               1244 |           1205 |         540 |       -49.9% |      -56.6% |     -55.2% |
| e-commerce-product |     2145 |               2449 |           2381 |        1166 |       -45.6% |      -52.4% |     -51.0% |
| <strong>总计</strong>           | **9122** |          **10180** |       **9948** |    **4800** |   **-47.4%** |  **-52.8%** | **-51.7%** |


## 运行方式

### 前置条件

在 shell 中导出 `OPENAI_API_KEY`：

```bash
export OPENAI_API_KEY=sk-...
```


### 1. 生成样本（调用 OpenAI）

```bash
pnpm generate
```

这会针对每个场景调用一次 OpenAI，保存原始 `.oui` 输出，然后将其转换为 `.c1.json`、`.vercel.jsonl` 和 `.yaml`。所有文件都会存放到 `samples/` 中。还会额外写入一个 `metrics.json`，其中包含 API 响应中的 TTFT 和 TPS。

### 2. 运行基准测试报告（离线）

```bash
pnpm bench
```

读取 `samples/` 中的文件，使用 `tiktoken` 统计 token 数，并输出 token 和延迟表格。

## 文件结构

```text
benchmarks/
├── generate-samples.ts        # Calls OpenAI, converts AST to all four formats
├── run-benchmark.ts           # Reads samples/, prints token/latency tables
├── thesys-c1-converter.ts     # AST -> normalized Thesys C1 JSON converter
├── vercel-spec-converter.ts   # AST -> shared json-render spec projection
├── vercel-jsonl-converter.ts  # Shared spec -> RFC 6902 JSONL converter
├── yaml-converter.ts          # Shared spec -> YAML document converter
├── schema.json                # JSON Schema for the default component library
├── system-prompt.txt          # System prompt sent to the LLM
├── package.json
├── pnpm-lock.yaml
└── samples/
    ├── <scenario>.oui
    ├── <scenario>.c1.json
    ├── <scenario>.vercel.jsonl
    ├── <scenario>.yaml
    └── metrics.json
```

## 更新 Schema

`schema.json` 和 `system-prompt.txt` 由 `@openuidev/react-ui` 中的 `library.toJSONSchema()` 和 `library.prompt()` 生成。如果你新增或修改了组件，请重新生成它们：

```ts
import { openuiLibrary } from "@openuidev/react-ui";
import { writeFileSync } from "fs";

writeFileSync("schema.json", JSON.stringify(openuiLibrary.toJSONSchema(), null, 2));
writeFileSync("system-prompt.txt", openuiLibrary.prompt());
```

解析器（`createParser`）会读取该文件中 `$defs` 部分的组件定义，以便将位置参数映射为具名 props。

---

<!-- CO-OP TRANSLATOR DISCLAIMER START -->
**免责声明**：
本文档使用 AI 翻译服务 [Co-op Translator](https://github.com/Azure/co-op-translator) 进行了翻译。尽管我们力求准确，但请注意，自动翻译可能包含错误或不准确之处。应以该文档原始语言版本为权威来源。对于关键信息，建议采用专业人工翻译。对于因使用本翻译而产生的任何误解或曲解，我们概不负责。
<!-- CO-OP TRANSLATOR DISCLAIMER END -->