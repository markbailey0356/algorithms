import {glMatrix, vec2} from "gl-matrix";

glMatrix.setMatrixArrayType(Array)

function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || "assert failed");
    }
}

interface LeafNode {
    position: vec2
}

interface TreeNode extends LeafNode {
    left: TreeNode | LeafNode
    right: TreeNode | LeafNode
    color: "black" | "red"
    value: number
    label: string
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

const H = 60

function LeafNode(x: number = 0, y: number = 0): LeafNode {
    return {position: vec2.fromValues(x, y)}
}

function TreeNode(color: "black" | "red", value: number, x: number, y: number, label: string = "") : TreeNode {
    return {
        left: LeafNode(x-H, y+H),
        right: LeafNode(x+H, y+H),
        color,
        value,
        position: vec2.fromValues(x, y),
        label,
    }
}

const root = TreeNode("black", 20, 0, 0, "0");
const node1 = TreeNode("red", 30, H, H, "1");
root.right = node1
const node2 = TreeNode("black", 25, 0.75 * H, 2 * H, "2");
node1.left = node2
const node3 = TreeNode("black", 15, -H, H, "3");
root.left = node3
node3.right.position[0] = -0.75 * H
{
    const pos = node3.right.position
    const node4 = TreeNode("red", 18, pos[0], pos[1], "4");
    node3.right = node4
    node4.right.position[0] = -0.5 * H
    node2.left.position[0] = 0.5 * H
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
    const nodeRadius = 20
    const leafRadius = 5
    {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const treeHeight = 3 * H
    ctx.translate(canvas.width / 2, canvas.height / 2 - 0.5 * treeHeight)
    drawSubtree(ctx, root)


    function isTreeNode(node: LeafNode) : node is TreeNode {
        return "color" in node;
    }

    function drawSubtree(ctx: CanvasRenderingContext2D, node: LeafNode, parent?: TreeNode) {
        if (isTreeNode(node)) {
            drawTreeNode(ctx, node, parent)
            drawSubtree(ctx, node.left, node)
            drawSubtree(ctx, node.right, node)
        } else {
            drawLeafNode(ctx, node, parent)
        }
    }

    function drawLeafNode(ctx: CanvasRenderingContext2D, node: LeafNode, parent?: TreeNode) {
        ctx.save()

        // ctx.translate(node.position[0], node.position[1])
        const radius = leafRadius
        const pos = node.position
        ctx.strokeStyle = foreground;
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(pos[0], pos[1], radius, 0, TAU)
        ctx.stroke()

        if (parent) {
            const pos = vec2.create()
            const a = parent.position
            const b = node.position
            const d = vec2.distance(a, b)

            { // draw right leaf
                vec2.lerp(pos, a, b, nodeRadius / d)
                ctx.beginPath()
                ctx.moveTo(pos[0], pos[1])
                vec2.lerp(pos, a, b, 1 - radius / d)
                ctx.lineTo(pos[0], pos[1])
                ctx.stroke()
            }
        }

        ctx.restore()
    }

    function drawTreeNode(ctx: CanvasRenderingContext2D, node: TreeNode, parent?: TreeNode) {
        ctx.save()
        const pos = node.position
        const radius = nodeRadius
        { // draw root node
            const color = foreground
            ctx.strokeStyle = color
            ctx.fillStyle = red
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(pos[0], pos[1], radius, 0, TAU);
            if (node.color == "red") ctx.fill()
            ctx.stroke()
        }
        if (parent) {
            const pos = vec2.create()
            const a = parent.position
            const b = node.position
            const d = vec2.distance(a, b)

            { // draw right leaf
                vec2.lerp(pos, a, b, nodeRadius / d)
                ctx.beginPath()
                ctx.moveTo(pos[0], pos[1])
                vec2.lerp(pos, a, b, 1 - radius / d)
                ctx.lineTo(pos[0], pos[1])
                ctx.stroke()
            }
        }
        if (node.label) { // draw label
            ctx.font = "10px monospace"
            ctx.textAlign = "right"
            ctx.textBaseline = "middle"
            ctx.fillStyle = foreground
            ctx.translate(pos[0], pos[1])
            ctx.fillText(node.label, -nodeRadius - 5, 0)
        }
        ctx.restore()
    }
}

requestAnimationFrame(render)

