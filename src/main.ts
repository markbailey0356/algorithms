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

const TAU = Math.PI * 2;
const VEC2_RIGHT = Object.freeze(vec2.fromValues(1, 0))
const VEC2_ZERO = Object.freeze(vec2.create())

function render() {
    assert(ctx != null)
    requestAnimationFrame(render)
    const rootStyles = getComputedStyle(document.documentElement)
    const background = rootStyles.getPropertyValue('--background').trim() || "black"
    const foreground = rootStyles.getPropertyValue('--foreground').trim() || "white"
    {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const rootPosition = vec2.fromValues(
        Math.round(canvas.width / 2),
        Math.round(canvas.height / 2),
    )
    { // draw root node
        const color = foreground
        const radius = 20
        const pos = rootPosition
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(pos[0], pos[1], radius, 0, TAU);
        ctx.stroke()
    }
    { // draw left leaf node
        const color = foreground
        const radius = 5

        const linkLength = 50
        const pos = vec2.create()
        vec2.scaleAndAdd(pos, pos, VEC2_RIGHT, linkLength)
        vec2.add(pos, pos, rootPosition)
        vec2.rotate(pos, pos, rootPosition, TAU * 3 / 8);
        ctx.strokeStyle = color
        ctx.lineWidth = 3

        ctx.beginPath()
        ctx.arc(pos[0], pos[1], radius, 0, TAU);
        ctx.stroke()

        vec2.rotate(pos, pos, rootPosition, TAU * -1 / 4);
        ctx.beginPath()
        ctx.arc(pos[0], pos[1], radius, 0, TAU);
        ctx.stroke()
    }
}

requestAnimationFrame(render)

