interface CellGeometry {
    x: number
    y: number
    width: number
    height: number
}

interface ParsedCell {
    id: string
    element: Element
    geometry: CellGeometry
    style: string
    vertex: boolean
    edge: boolean
    source?: string | null
    target?: string | null
}

interface Group {
    id: string
    members: ParsedCell[]
    top: number
    bottom: number
}

const DEFAULT_GAP = 18

function parseNumber(value: string | null, fallback = 0): number {
    if (value === null || value === undefined) return fallback
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function getGeometry(element: Element): CellGeometry | null {
    const geometry = element.querySelector("mxGeometry")
    if (!geometry) return null
    const width = parseNumber(geometry.getAttribute("width"), 0)
    const height = parseNumber(geometry.getAttribute("height"), 0)
    if (width <= 0 || height <= 0) return null
    const x = parseNumber(geometry.getAttribute("x"), 0)
    const y = parseNumber(geometry.getAttribute("y"), 0)
    return { x, y, width, height }
}

function isBackgroundCell(cell: ParsedCell): boolean {
    if (!cell.vertex) return false
    const { width, height } = cell.geometry
    if (width < 680 || height < 900) return false
    const style = cell.style
    return (
        style.includes("gradientColor=") ||
        style.includes("fillColor=#EAF6FF") ||
        style.includes("strokeColor=none")
    )
}

function isDecorationCell(cell: ParsedCell): boolean {
    if (!cell.vertex) return false
    const style = cell.style
    if (!style) return false
    return (
        style.includes("ellipse") ||
        style.includes("opacity=") ||
        style.includes("shape=ellipse")
    )
}

function isPanelCandidate(cell: ParsedCell): boolean {
    if (!cell.vertex) return false
    if (isBackgroundCell(cell)) return false
    if (isDecorationCell(cell)) return false
    const { width, height } = cell.geometry
    return width >= 300 && height >= 80
}

function contains(panel: ParsedCell, cell: ParsedCell): boolean {
    const padding = 1
    return (
        cell.geometry.x >= panel.geometry.x - padding &&
        cell.geometry.y >= panel.geometry.y - padding &&
        cell.geometry.x + cell.geometry.width <=
            panel.geometry.x + panel.geometry.width + padding &&
        cell.geometry.y + cell.geometry.height <=
            panel.geometry.y + panel.geometry.height + padding
    )
}

function getGroupBounds(members: ParsedCell[]): {
    top: number
    bottom: number
} {
    const tops = members.map((member) => member.geometry.y)
    const bottoms = members.map(
        (member) => member.geometry.y + member.geometry.height,
    )
    return {
        top: Math.min(...tops),
        bottom: Math.max(...bottoms),
    }
}

function shiftCell(cell: ParsedCell, deltaY: number) {
    const geometry = cell.element.querySelector("mxGeometry")
    if (!geometry) return
    const currentY = parseNumber(geometry.getAttribute("y"), 0)
    geometry.setAttribute("y", String(currentY + deltaY))
    cell.geometry.y += deltaY
}

function shiftEdgePoints(edge: ParsedCell, deltaY: number) {
    const geometry = edge.element.querySelector("mxGeometry")
    if (!geometry) return
    const points = geometry.querySelectorAll("Array[as='points'] > mxPoint")
    points.forEach((point) => {
        const currentY = parseNumber(point.getAttribute("y"), NaN)
        if (!Number.isFinite(currentY)) return
        point.setAttribute("y", String(currentY + deltaY))
    })
}

/**
 * Reflow chart-heavy infographic layouts by stacking panel groups vertically.
 * This is a heuristic pass to reduce overlaps for "infographic-charts" outputs.
 */
export function reflowInfographicChartsXml(xml: string): string {
    if (typeof DOMParser === "undefined") return xml
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<root>${xml}</root>`, "text/xml")
    if (doc.querySelector("parsererror")) {
        return xml
    }

    const serializer = new XMLSerializer()
    const cells = Array.from(doc.querySelectorAll("mxCell"))
        .map((element): ParsedCell | null => {
            const geometry = getGeometry(element)
            if (!geometry) return null
            return {
                id: element.getAttribute("id") || "",
                element,
                geometry,
                style: element.getAttribute("style") || "",
                vertex: element.getAttribute("vertex") === "1",
                edge: element.getAttribute("edge") === "1",
                source: element.getAttribute("source"),
                target: element.getAttribute("target"),
            }
        })
        .filter((cell): cell is ParsedCell => Boolean(cell))

    const vertexCells = cells.filter((cell) => cell.vertex)
    const edgeCells = cells.filter((cell) => cell.edge)
    const backgroundCells = vertexCells.filter((cell) => isBackgroundCell(cell))

    const panelCandidates = vertexCells.filter((cell) => isPanelCandidate(cell))

    const groups: Group[] = panelCandidates.map((panel) => ({
        id: panel.id,
        members: [panel],
        top: panel.geometry.y,
        bottom: panel.geometry.y + panel.geometry.height,
    }))

    const groupedIds = new Set(groups.map((group) => group.id))

    for (const cell of vertexCells) {
        if (groupedIds.has(cell.id)) continue
        if (isBackgroundCell(cell)) continue

        const containers = panelCandidates.filter((panel) =>
            contains(panel, cell),
        )
        if (containers.length === 0) continue

        const smallest = containers.reduce((prev, current) => {
            const prevArea = prev.geometry.width * prev.geometry.height
            const currArea = current.geometry.width * current.geometry.height
            return currArea < prevArea ? current : prev
        })

        const group = groups.find((item) => item.id === smallest.id)
        if (group) {
            group.members.push(cell)
        }
    }

    const ungrouped = vertexCells.filter(
        (cell) =>
            !isBackgroundCell(cell) &&
            !groups.some((group) =>
                group.members.some((member) => member.id === cell.id),
            ),
    )
    ungrouped.forEach((cell) => {
        groups.push({
            id: cell.id,
            members: [cell],
            top: cell.geometry.y,
            bottom: cell.geometry.y + cell.geometry.height,
        })
    })

    groups.forEach((group) => {
        const bounds = getGroupBounds(group.members)
        group.top = bounds.top
        group.bottom = bounds.bottom
    })

    groups.sort((a, b) => a.top - b.top)

    const shiftById = new Map<string, number>()
    let cursor = 0
    groups.forEach((group, index) => {
        if (index === 0) {
            cursor = group.bottom
            return
        }
        if (group.top < cursor + DEFAULT_GAP) {
            const delta = cursor + DEFAULT_GAP - group.top
            group.members.forEach((member) => {
                shiftCell(member, delta)
                shiftById.set(member.id, delta)
            })
            group.top += delta
            group.bottom += delta
        }
        cursor = group.bottom
    })

    edgeCells.forEach((edge) => {
        const sourceShift = edge.source ? shiftById.get(edge.source) : undefined
        const targetShift = edge.target ? shiftById.get(edge.target) : undefined
        if (!sourceShift || !targetShift) return
        if (sourceShift === targetShift) {
            shiftEdgePoints(edge, sourceShift)
        }
    })

    if (backgroundCells.length > 0) {
        const maxBottom = Math.max(
            ...vertexCells.map(
                (cell) => cell.geometry.y + cell.geometry.height,
            ),
        )
        backgroundCells.forEach((background) => {
            const geometry = background.element.querySelector("mxGeometry")
            if (!geometry) return
            const neededHeight = maxBottom + 40 - background.geometry.y
            if (neededHeight > background.geometry.height) {
                geometry.setAttribute("height", String(neededHeight))
            }
        })
    }

    const root = doc.documentElement
    const output = Array.from(root.childNodes)
        .map((node) => serializer.serializeToString(node))
        .join("\n")
    return output
}
