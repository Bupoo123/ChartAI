import { nanoid } from "nanoid"

type KpiItem = {
    label?: string
    value?: string
    color?: string
}

type TopListItem = {
    label: string
    value: number
    color?: string
}

type BarChartInput = {
    categories: string[]
    values: number[]
    colors?: string[]
}

type StackedSegment = {
    label: string
    value: number
    color?: string
}

export type ChartPanelInput =
    | {
          type: "kpi-row"
          x: number
          y: number
          width: number
          height?: number
          title?: string
          items: KpiItem[]
      }
    | {
          type: "bar-chart"
          x: number
          y: number
          width: number
          height?: number
          title?: string
          data: BarChartInput
      }
    | {
          type: "top-list"
          x: number
          y: number
          width: number
          height?: number
          title?: string
          items: TopListItem[]
      }
    | {
          type: "pipeline"
          x: number
          y: number
          width: number
          height?: number
          title?: string
          steps: string[]
      }
    | {
          type: "stacked-bar"
          x: number
          y: number
          width: number
          height?: number
          title?: string
          segments: StackedSegment[]
      }

const DEFAULT_PANEL_HEIGHT = 180
const PALETTE = ["#2A8FEA", "#2FB67D", "#F2994A", "#9B51E0", "#EB5757"]

function escapeXml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function createCell({
    value,
    style,
    x,
    y,
    width,
    height,
    vertex = true,
    parent = "1",
    extra = "",
}: {
    value: string
    style: string
    x: number
    y: number
    width: number
    height: number
    vertex?: boolean
    parent?: string
    extra?: string
}): string {
    const id = `ct_${nanoid(8)}`
    return `<mxCell id="${id}" value="${escapeXml(
        value,
    )}" style="${style}" ${vertex ? 'vertex="1"' : ""} parent="${parent}" ${extra}>
  <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>
</mxCell>`
}

function panelBase(x: number, y: number, width: number, height: number) {
    return createCell({
        value: "",
        style: "rounded=1;arcSize=16;fillColor=#FFFFFF;strokeColor=#CFE6FA;strokeWidth=1;shadow=1;whiteSpace=wrap;html=1;",
        x,
        y,
        width,
        height,
    })
}

function panelTitle(text: string, x: number, y: number, width: number) {
    return createCell({
        value: text,
        style: "rounded=0;fillColor=none;strokeColor=none;fontColor=#0B2A3C;fontSize=14;fontStyle=1;whiteSpace=wrap;html=1;",
        x,
        y,
        width,
        height: 20,
    })
}

function clampNumber(value: number): number {
    if (!Number.isFinite(value)) return 0
    return value
}

function buildKpiRow(input: Extract<ChartPanelInput, { type: "kpi-row" }>) {
    const height = input.height ?? 110
    const titleHeight = input.title ? 24 : 0
    const padding = 15
    const gap = 12
    const availableHeight = height - titleHeight - padding
    const cardHeight = Math.max(48, availableHeight - 10)
    const items = input.items.slice(0, 5)
    const cardWidth =
        (input.width - padding * 2 - gap * (items.length - 1)) /
        Math.max(1, items.length)

    const cells: string[] = []
    cells.push(panelBase(input.x, input.y, input.width, height))
    if (input.title) {
        cells.push(panelTitle(input.title, input.x + 15, input.y + 10, 240))
    }

    items.forEach((item, index) => {
        const color = item.color || PALETTE[index % PALETTE.length]
        const cardX = input.x + padding + index * (cardWidth + gap)
        const cardY = input.y + titleHeight + padding
        cells.push(
            createCell({
                value: item.value || "—",
                style: `rounded=1;arcSize=10;fillColor=${color};strokeColor=none;fontColor=#FFFFFF;fontSize=18;fontStyle=1;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;`,
                x: cardX,
                y: cardY,
                width: cardWidth,
                height: cardHeight,
            }),
        )
        cells.push(
            createCell({
                value: item.label || "",
                style: "rounded=0;fillColor=none;strokeColor=none;fontColor=#335A74;fontSize=11;whiteSpace=wrap;html=1;align=center;verticalAlign=top;",
                x: cardX,
                y: cardY + cardHeight - 18,
                width: cardWidth,
                height: 16,
            }),
        )
    })

    return cells.join("\n")
}

function buildBarChart(input: Extract<ChartPanelInput, { type: "bar-chart" }>) {
    const height = input.height ?? DEFAULT_PANEL_HEIGHT
    const padding = 16
    const titleHeight = input.title ? 24 : 0
    const plotX = input.x + padding
    const plotY = input.y + padding + titleHeight
    const plotWidth = input.width - padding * 2
    const plotHeight = height - padding * 2 - titleHeight - 20

    const cells: string[] = []
    cells.push(panelBase(input.x, input.y, input.width, height))
    if (input.title) {
        cells.push(panelTitle(input.title, input.x + 15, input.y + 10, 280))
    }

    cells.push(
        createCell({
            value: "",
            style: "rounded=0;fillColor=none;strokeColor=#CFE6FA;strokeWidth=1;whiteSpace=wrap;html=1;",
            x: plotX,
            y: plotY,
            width: plotWidth,
            height: plotHeight,
        }),
    )

    const gridLines = 4
    for (let i = 1; i <= gridLines; i += 1) {
        const y = plotY + (plotHeight / (gridLines + 1)) * i
        cells.push(
            createCell({
                value: "",
                style: "rounded=0;fillColor=none;strokeColor=#E3F1FF;strokeWidth=1;dashed=1;dashPattern=3 3;whiteSpace=wrap;html=1;",
                x: plotX,
                y,
                width: plotWidth,
                height: 1,
            }),
        )
    }

    const categories = input.data.categories.slice(0, 8)
    const values = input.data.values
        .slice(0, categories.length)
        .map(clampNumber)
    const max = Math.max(...values, 1)
    const barGap = 10
    const barWidth =
        (plotWidth - barGap * (categories.length - 1)) /
        Math.max(1, categories.length)

    categories.forEach((category, index) => {
        const value = values[index] ?? 0
        const barHeight = (value / max) * (plotHeight - 20)
        const barX = plotX + index * (barWidth + barGap)
        const barY = plotY + plotHeight - barHeight
        const color =
            input.data.colors?.[index] || PALETTE[index % PALETTE.length]

        cells.push(
            createCell({
                value: "",
                style: `rounded=1;arcSize=6;fillColor=${color};strokeColor=none;whiteSpace=wrap;html=1;`,
                x: barX,
                y: barY,
                width: barWidth,
                height: barHeight,
            }),
        )
        cells.push(
            createCell({
                value: category,
                style: "rounded=0;fillColor=none;strokeColor=none;fontColor=#335A74;fontSize=11;whiteSpace=wrap;html=1;align=center;verticalAlign=top;",
                x: barX,
                y: plotY + plotHeight + 2,
                width: barWidth,
                height: 16,
            }),
        )
    })

    return cells.join("\n")
}

function buildTopList(input: Extract<ChartPanelInput, { type: "top-list" }>) {
    const height = input.height ?? DEFAULT_PANEL_HEIGHT
    const padding = 16
    const titleHeight = input.title ? 24 : 0
    const rowHeight = 24
    const items = input.items.slice(0, 6)
    const max = Math.max(...items.map((item) => clampNumber(item.value)), 1)
    const barMaxWidth = input.width - padding * 2 - 80

    const cells: string[] = []
    cells.push(panelBase(input.x, input.y, input.width, height))
    if (input.title) {
        cells.push(panelTitle(input.title, input.x + 15, input.y + 10, 220))
    }

    items.forEach((item, index) => {
        const rowY = input.y + padding + titleHeight + index * rowHeight
        const barWidth = (clampNumber(item.value) / max) * barMaxWidth
        const color = item.color || PALETTE[index % PALETTE.length]

        cells.push(
            createCell({
                value: item.label,
                style: "rounded=0;fillColor=none;strokeColor=none;fontColor=#0B2A3C;fontSize=12;whiteSpace=wrap;html=1;align=left;verticalAlign=middle;",
                x: input.x + padding,
                y: rowY,
                width: 120,
                height: rowHeight,
            }),
        )
        cells.push(
            createCell({
                value: "",
                style: `rounded=1;arcSize=8;fillColor=${color};strokeColor=none;whiteSpace=wrap;html=1;`,
                x: input.x + padding + 120,
                y: rowY + 4,
                width: Math.max(barWidth, 8),
                height: 14,
            }),
        )
        cells.push(
            createCell({
                value: String(item.value),
                style: "rounded=0;fillColor=none;strokeColor=none;fontColor=#335A74;fontSize=11;whiteSpace=wrap;html=1;align=right;verticalAlign=middle;",
                x: input.x + input.width - padding - 40,
                y: rowY,
                width: 40,
                height: rowHeight,
            }),
        )
    })

    return cells.join("\n")
}

const MAX_PIPELINE_STEP_CHARS = 18
const MIN_PIPELINE_PILL_WIDTH = 100

function buildPipeline(input: Extract<ChartPanelInput, { type: "pipeline" }>) {
    const height = input.height ?? 100
    const padding = 16
    const titleHeight = input.title ? 24 : 0
    const steps = input.steps.slice(0, 6)
    let gap = 10
    let pillWidth =
        (input.width - padding * 2 - gap * (steps.length - 1)) /
        Math.max(1, steps.length)
    pillWidth = Math.max(pillWidth, MIN_PIPELINE_PILL_WIDTH)
    const totalWidth =
        padding * 2 + steps.length * pillWidth + (steps.length - 1) * gap
    if (totalWidth > input.width) {
        gap = 6
        pillWidth =
            (input.width - padding * 2 - gap * (steps.length - 1)) /
            Math.max(1, steps.length)
    }
    const pillHeight = Math.max(34, height - padding * 2 - titleHeight)

    const cells: string[] = []
    cells.push(panelBase(input.x, input.y, input.width, height))
    if (input.title) {
        cells.push(panelTitle(input.title, input.x + 15, input.y + 10, 220))
    }

    steps.forEach((step, index) => {
        const label =
            step.length > MAX_PIPELINE_STEP_CHARS
                ? step.slice(0, 15).trim() + "\u2026"
                : step
        const pillX = input.x + padding + index * (pillWidth + gap)
        const pillY = input.y + padding + titleHeight
        cells.push(
            createCell({
                value: label,
                style: "rounded=1;arcSize=18;fillColor=#EAF6FF;strokeColor=#8CBEE8;strokeWidth=1;fontColor=#0B2A3C;fontSize=12;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;",
                x: pillX,
                y: pillY,
                width: pillWidth,
                height: pillHeight,
            }),
        )
        if (index < steps.length - 1) {
            cells.push(
                createCell({
                    value: "›",
                    style: "rounded=0;fillColor=none;strokeColor=none;fontColor=#2A8FEA;fontSize=18;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;",
                    x: pillX + pillWidth + 2,
                    y: pillY,
                    width: gap,
                    height: pillHeight,
                }),
            )
        }
    })

    return cells.join("\n")
}

function buildStackedBar(
    input: Extract<ChartPanelInput, { type: "stacked-bar" }>,
) {
    const height = input.height ?? 140
    const padding = 16
    const titleHeight = input.title ? 24 : 0
    const barHeight = 26
    const barY = input.y + padding + titleHeight + 10
    const barX = input.x + padding
    const barWidth = input.width - padding * 2
    const segments = input.segments.slice(0, 6)
    const total = Math.max(
        segments.reduce((sum, segment) => sum + clampNumber(segment.value), 0),
        1,
    )

    const cells: string[] = []
    cells.push(panelBase(input.x, input.y, input.width, height))
    if (input.title) {
        cells.push(panelTitle(input.title, input.x + 15, input.y + 10, 220))
    }

    let currentX = barX
    segments.forEach((segment, index) => {
        const width = (clampNumber(segment.value) / total) * barWidth
        const color = segment.color || PALETTE[index % PALETTE.length]
        cells.push(
            createCell({
                value: "",
                style: `rounded=1;arcSize=6;fillColor=${color};strokeColor=none;whiteSpace=wrap;html=1;`,
                x: currentX,
                y: barY,
                width,
                height: barHeight,
            }),
        )
        currentX += width
    })

    segments.forEach((segment, index) => {
        const legendY = barY + barHeight + 10 + index * 16
        const color = segment.color || PALETTE[index % PALETTE.length]
        cells.push(
            createCell({
                value: "",
                style: `rounded=1;arcSize=4;fillColor=${color};strokeColor=none;whiteSpace=wrap;html=1;`,
                x: barX,
                y: legendY + 3,
                width: 10,
                height: 10,
            }),
        )
        cells.push(
            createCell({
                value: `${segment.label} ${segment.value}`,
                style: "rounded=0;fillColor=none;strokeColor=none;fontColor=#335A74;fontSize=11;whiteSpace=wrap;html=1;align=left;verticalAlign=middle;",
                x: barX + 14,
                y: legendY,
                width: barWidth - 14,
                height: 14,
            }),
        )
    })

    return cells.join("\n")
}

export function buildChartPanelXml(input: ChartPanelInput): string {
    switch (input.type) {
        case "kpi-row":
            return buildKpiRow(input)
        case "bar-chart":
            return buildBarChart(input)
        case "top-list":
            return buildTopList(input)
        case "pipeline":
            return buildPipeline(input)
        case "stacked-bar":
            return buildStackedBar(input)
    }
}
