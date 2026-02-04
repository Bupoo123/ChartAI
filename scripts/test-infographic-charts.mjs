#!/usr/bin/env node
/**
 * Test infographic-charts preset with a PDF file.
 * Usage: node scripts/test-infographic-charts.mjs [path/to/file.pdf]
 * Requires: dev server running (npm run dev), and .env.local with AI provider (e.g. DEEPSEEK_API_KEY).
 *
 * Optional: DEBUG_STREAM=1 to print first 2kb of raw stream; TEST_BASE_URL to override API base;
 *            TEST_OUTPUT_FILE / TEST_DRAWIO_FILE for result txt and .drawio path (default: project root).
 * Note: In Node, fetch stream chunks may arrive as comma-separated decimal bytes; the script decodes them.
 */
import { readFile, writeFile } from "fs/promises"
import { getDocumentProxy, extractText } from "unpdf"

const PDF_PATH =
    process.argv[2] ||
    "/Users/bupoo/Nutstore Files/Matridx-2025/251111 论文集/SCI论文PDF_2025.10/Gao 等 - 2024 - A single-center, retrospective study of hospitaliz.pdf"
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:6002"
const MAX_PDF_CHARS = Number(process.env.TEST_MAX_PDF_CHARS) || 70000
const OUT_FILE =
    process.env.TEST_OUTPUT_FILE ||
    new URL("../test-infographic-charts-result.txt", import.meta.url).pathname
const DRAWIO_FILE =
    process.env.TEST_DRAWIO_FILE ||
    new URL("../test-infographic-charts-result.drawio", import.meta.url).pathname

/** Strip CDATA wrapper and repair truncated XML from AI output. */
function normalizeDiagramXml(xml) {
    let s = String(xml).trim()
    if (s.startsWith("<![CDATA[")) s = s.slice(9)
    if (s.endsWith("]]>")) s = s.slice(0, -3)
    s = s.trim()
    if (s.endsWith("</mx") && !s.endsWith("</mxCell>")) s += "Cell>"
    // If still truncated (e.g. ends mid-attribute like <mxGeometry x="280" y), keep only up to last complete </mxCell>
    const lastClose = s.lastIndexOf("</mxCell>")
    if (lastClose !== -1) {
        const after = s.slice(lastClose + 9).trim()
        if (after && !after.startsWith("<")) s = s.slice(0, lastClose + 9)
    }
    // Remove duplicate trailing </mxCell> (invalid XML that breaks draw.io)
    s = s.replace(/(<\/mxCell>)\s*\1+\s*$/g, "$1")
    return s
}

/** Wrap raw mxCell XML into full draw.io mxfile (same structure as lib/utils wrapWithMxFile). */
function wrapWithMxFile(xml) {
    const ROOT_CELLS = '<mxCell id="0"/><mxCell id="1" parent="0"/>'
    if (!xml || !String(xml).trim())
        return `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root>${ROOT_CELLS}</root></mxGraphModel></diagram></mxfile>`
    let content = String(xml).trim()
    if (content.includes("<mxfile>")) return content
    if (content.includes("<mxGraphModel"))
        return `<mxfile><diagram name="Page-1" id="page-1">${content}</diagram></mxfile>`
    if (content.includes("<root>")) content = content.replace(/<\/?root>/g, "").trim()
    content = content
        .replace(/<mxCell[^>]*\bid=["']0["'][^>]*(?:\/>|><\/mxCell>)/g, "")
        .replace(/<mxCell[^>]*\bid=["']1["'][^>]*(?:\/>|><\/mxCell>)/g, "")
        .trim()
    return `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root>${ROOT_CELLS}${content}</root></mxGraphModel></diagram></mxfile>`
}

function trimForCharts(text) {
    const lower = text.toLowerCase()
    const abstractIndex = Math.max(
        lower.indexOf("abstract"),
        lower.indexOf("摘要"),
    )
    const startIndex = abstractIndex >= 0 ? abstractIndex : 0
    const sliced = text.slice(startIndex)
    if (sliced.length <= MAX_PDF_CHARS) return sliced
    return sliced.slice(0, MAX_PDF_CHARS) + "\n\n[Content trimmed for length.]"
}

async function main() {
    console.log("PDF path:", PDF_PATH)
    console.log("Extracting text with unpdf...")
    const buffer = await readFile(PDF_PATH)
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    const extracted = (text || "").trim()
    if (!extracted) {
        console.error("No text extracted from PDF.")
        process.exit(1)
    }
    const content = trimForCharts(extracted)
    const fileName = PDF_PATH.split("/").pop()
    const userText = `Generate an infographic-charts style diagram from this paper.\n\n[PDF: ${fileName}]\n${content}`

    const messages = [
        {
            role: "user",
            parts: [{ type: "text", text: userText }],
        },
    ]
    const body = {
        messages,
        xml: "",
        previousXml: "",
        sessionId: "test-infographic-charts",
    }
    const headers = {
        "Content-Type": "application/json",
        "x-diagram-style": "infographic-charts",
    }

    console.log("Requesting", BASE_URL + "/api/chat", "(x-diagram-style: infographic-charts)...")
    const res = await fetch(BASE_URL + "/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        console.error("HTTP", res.status, res.statusText)
        const t = await res.text()
        console.error(t.slice(0, 500))
        process.exit(1)
    }
    const stream = res.body
    if (!stream) {
        console.error("No response body")
        process.exit(1)
    }
    let buffer2 = ""
    const toolCalls = new Set()
    const errors = []
    const eventTypes = new Set()
    const toolInputs = [] // { toolName, toolCallId, input } for tool-input-available
    let rawSample = ""
    const DATA_PREFIX = "data: "

    function processLine(line) {
        if (!line.startsWith(DATA_PREFIX)) return
        const payload = line.slice(DATA_PREFIX.length).trim()
        if (payload === "[DONE]") return
        try {
            const json = JSON.parse(payload)
            if (json.type) eventTypes.add(json.type)
            if (json.type === "tool-input-start" || json.type === "tool-input-available")
                if (json.toolName) toolCalls.add(json.toolName)
            if (json.type === "tool-input-available" && json.toolName && json.input)
                toolInputs.push({
                    toolName: json.toolName,
                    toolCallId: json.toolCallId,
                    input: json.input,
                })
            if (json.type === "error" && json.errorText)
                errors.push(json.errorText)
        } catch (_) {}
    }

    // Decode chunk: Node fetch may give Buffer/Uint8Array; some responses use comma-separated byte arrays
    function chunkToStr(chunk) {
        const raw = chunk.toString()
        // If chunk looks like "100,97,116,97,..." (comma-separated decimal bytes), decode it
        if (/^\d+(,\d+)*$/.test(raw.trim())) {
            try {
                return raw.split(",").map((n) => String.fromCharCode(parseInt(n, 10))).join("")
            } catch (_) {
                return raw
            }
        }
        return raw
    }

    try {
        for await (const chunk of stream) {
            const str = chunkToStr(chunk)
            if (rawSample.length < 2000) rawSample += str
            buffer2 += str
            const lines = buffer2.split(/\n+/)
            buffer2 = lines.pop() || ""
            for (const line of lines) processLine(line)
        }
    } catch (streamErr) {
        console.warn("Stream ended early:", streamErr.message || streamErr)
    }
    // Flush remaining buffer (last line may have no trailing newline)
    if (buffer2.trim()) {
        for (const line of buffer2.split(/\n+/)) processLine(line)
    }

    if (process.env.DEBUG_STREAM) {
        console.log("--- Raw stream sample (first 2000 chars) ---")
        console.log(rawSample.slice(0, 2000))
        console.log("--- End sample ---")
    }
    console.log("Event types in stream:", [...eventTypes].sort().join(", "))
    console.log("\nTool calls seen:", [...toolCalls])
    if (errors.length) {
        console.log("\nErrors:", errors.length)
        errors.forEach((e, i) => console.log(i + 1, (e || "").slice(0, 300)))
    }
    const ok = toolCalls.has("display_diagram") || toolCalls.has("build_chart_panel")
    if (ok) console.log("\n[OK] Infographic-charts test produced diagram-related tool calls.")
    else console.log("\n[WARN] No display_diagram or build_chart_panel in stream.")

    // Build result file content
    const lines = [
        "# Infographic-charts 测试结果",
        `生成时间: ${new Date().toISOString()}`,
        `PDF: ${PDF_PATH}`,
        `API: ${BASE_URL}/api/chat`,
        "",
        "## 摘要",
        ok ? "[OK] 检测到图表相关 tool 调用" : "[WARN] 未检测到 display_diagram / build_chart_panel",
        "",
        "## 事件类型",
        [...eventTypes].sort().join(", ") || "(无)",
        "",
        "## Tool 调用",
        [...toolCalls].length ? [...toolCalls].join(", ") : "(无)",
        "",
    ]
    if (errors.length) {
        lines.push("## 错误", "")
        errors.forEach((e, i) => lines.push(`${i + 1}. ${(e || "").slice(0, 500)}`, ""))
    }
    if (toolInputs.length) {
        lines.push("## Tool 输入摘要", "")
        for (const t of toolInputs) {
            lines.push(`### ${t.toolName} (${t.toolCallId || "-"})`, "")
            if (t.input && typeof t.input === "object") {
                if (t.input.xml !== undefined) {
                    const xml = String(t.input.xml)
                    lines.push("xml 长度:", String(xml.length), "")
                    lines.push("xml 前 2000 字符:", "")
                    lines.push(xml.slice(0, 2000))
                    if (xml.length > 2000) lines.push("\n... (已截断)")
                    lines.push("")
                } else {
                    lines.push(JSON.stringify(t.input, null, 2).slice(0, 2000))
                    if (JSON.stringify(t.input).length > 2000) lines.push("\n... (已截断)")
                    lines.push("")
                }
            }
        }
    }
    if (process.env.DEBUG_STREAM && rawSample) {
        lines.push("## 原始流样本 (前 2000 字符)", "")
        lines.push(rawSample.slice(0, 2000), "")
    }
    const resultText = lines.join("\n")
    await writeFile(OUT_FILE, resultText, "utf8")
    console.log("\n结果已写入:", OUT_FILE)

    // Write full diagram as .drawio from last display_diagram XML (strip CDATA, repair truncation)
    const displayDiagramInput = [...toolInputs].reverse().find((t) => t.toolName === "display_diagram" && t.input?.xml != null)
    if (displayDiagramInput?.input?.xml) {
        const normalized = normalizeDiagramXml(displayDiagramInput.input.xml)
        const fullDrawioXml = wrapWithMxFile(normalized)
        await writeFile(DRAWIO_FILE, fullDrawioXml, "utf8")
        console.log("流程图 .drawio 已写入:", DRAWIO_FILE)
    } else if (toolCalls.has("display_diagram") && !displayDiagramInput) {
        console.log("(未生成 .drawio：流中仅有 display_diagram 调用，未捕获到完整 XML)")
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
