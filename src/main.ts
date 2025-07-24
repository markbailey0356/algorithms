import {glMatrix, vec2} from "gl-matrix";

glMatrix.setMatrixArrayType(Array)

function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || "assert failed");
    }
}

interface TreeNode {
    left: Node | null,
    right: Node | null,
    color: "black" | "red"
}

const canvas = document.createElement("canvas")
document.body.append(canvas)

function resize() {
    canvas.height = innerHeight * devicePixelRatio;
    canvas.width = innerWidth * devicePixelRatio;
}

resize()
window.addEventListener("resize", resize)
const ctx = canvas.getContext("2d")

const rootNode: TreeNode = {
    left: null,
    right: null,
    color: "black",
}

const redNode: TreeNode = {
    left: null,
    right: null,
    color: "red",
}

const TAU = Math.PI * 2;

function render() {
    assert(ctx != null)
    requestAnimationFrame(render)
    ctx.resetTransform()
    const rootStyles = getComputedStyle(document.documentElement)
    const background = rootStyles.getPropertyValue('--background').trim() || "black"
    const foreground = rootStyles.getPropertyValue('--foreground').trim() || "white"
    const red = rootStyles.getPropertyValue('--red').trim() || "red"
    {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const rootPosition = vec2.fromValues(
        Math.round(canvas.width / 2),
        Math.round(canvas.height / 2),
    )
    const levelHeight = 50
    ctx.translate(rootPosition[0], rootPosition[1])
    drawNode(ctx, rootNode)
    ctx.translate(levelHeight, levelHeight)
    drawNode(ctx, redNode)

    function drawNode(ctx: CanvasRenderingContext2D, node: TreeNode) {
        const nodeRadius = 20
        const leafRadius = 5
        const levelHeight = 50
        const pos = vec2.create()
        { // draw root node
            const color = foreground
            const radius = nodeRadius
            ctx.strokeStyle = color
            ctx.fillStyle = red
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(pos[0], pos[1], radius, 0, TAU);
            if (node.color == "red") ctx.fill()
            ctx.stroke()
        }
        { // draw leaf nodes
            const color = foreground
            const radius = leafRadius

            ctx.strokeStyle = color
            ctx.lineWidth = 3

            const pos = vec2.create()

            { // draw right leaf
                vec2.set(pos, levelHeight, levelHeight)
                const distance = vec2.len(pos)

                ctx.beginPath()
                ctx.arc(pos[0], pos[1], radius, 0, TAU);
                ctx.stroke()

                vec2.scale(pos, pos, (distance - leafRadius) / distance)

                ctx.beginPath()
                ctx.moveTo(pos[0], pos[1])

                vec2.scale(pos, pos, nodeRadius / (distance - leafRadius))

                ctx.lineTo(pos[0], pos[1])
                ctx.stroke()
            }

            { // draw left leaf
                vec2.set(pos, -levelHeight, levelHeight)
                const distance = vec2.len(pos)

                ctx.beginPath()
                ctx.arc(pos[0], pos[1], radius, 0, TAU);
                ctx.stroke()

                vec2.scale(pos, pos, (distance - leafRadius) / distance)

                ctx.beginPath()
                ctx.moveTo(pos[0], pos[1])

                vec2.scale(pos, pos, nodeRadius / (distance - leafRadius))

                ctx.lineTo(pos[0], pos[1])
                ctx.stroke()
            }

        }
    }
}

requestAnimationFrame(render)

