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

function LeafNode(): LeafNode {
    return {position: vec2.create()}
}

function TreeNode(color: "black" | "red", value: number, label: string = ""): TreeNode {
    return {
        left: LeafNode(),
        right: LeafNode(),
        color,
        value,
        position: vec2.create(),
        label,
    }
}

function isTreeNode(node: LeafNode): node is TreeNode {
    return "color" in node;
}

const root = TreeNode("black", 20, "0");
const node1 = TreeNode("red", 30, "1");
root.right = node1
const node2 = TreeNode("black", 25, "2");
node1.left = node2
const node3 = TreeNode("black", 15, "3");
root.left = node3
const node4 = TreeNode("red", 18, "4");
node3.right = node4
const node6 = TreeNode("black", 35, "6");
node1.right = node6
const node5 = TreeNode("red", 27, "5");
node6.right = node5
const node8 = TreeNode("black", 20, "8");
node4.right = node8
const node10 = TreeNode("black", 29, "10");
node4.left = node10
const node11 = TreeNode("red", 29, "11");
node8.left = node11

{
    interface Context {
        levels?: (LeafNode | null)[][]
        depth?: number,
        i?: number,
    }

    function createLevels(node: LeafNode, {levels = [], depth = 0, i = 0}: Context = {}): (LeafNode | null)[][] {
        levels[depth] ??= Array(2 ** depth).fill(null)
        levels[depth][i] = node
        if (isTreeNode(node)) {
            createLevels(node.left, {levels, depth: depth + 1, i: 2 * i})
            createLevels(node.right, {levels, depth: depth + 1, i: 2 * i + 1})
        }
        return levels
    }

    const levels = createLevels(root)

    levels.forEach((level, depth) => {
        const height = levels.length - depth - 1;
        const scaleBase = 1;
        const scale = scaleBase ** height;
        let totalSpace = 0
        for (const node of level) {
            const space = scale * getSpace(node)
            totalSpace += space
        }
        let x = -0.5 * totalSpace
        for (const node of level) {
            const space = scale * getSpace(node)
            if (node) {
                node.position[0] = x + 0.5 * space
                node.position[1] = H * depth
            }
            x += space;
        }
    })

    function getSpace(node: LeafNode | null): number {
        if (node == null) return 0.5 * H
        if (isTreeNode(node)) return 1.5 * H;
        return 1 * H;
    }
}

function relaxNode(node: LeafNode, level = 0, levelNeighbours: LeafNode[] = []) {
    const alpha = 1;
    { // repel left neighbour
        const x = node.position[0]
        const k = 1
        const a = 1.25
        const neighbour = levelNeighbours[level]
        if (neighbour) {
            const tdx = a * H
            const dx = x - neighbour.position[0]
            let ax = 0.5 * k * (tdx - dx)
            ax = Math.max(0, ax)
            node.position[0] += ax
            neighbour.position[0] -= ax
        }
        levelNeighbours[level] = node
    }
    levelNeighbours[level] = node
    if (isTreeNode(node)) {
        const k = 0.2
        const a = 0.5
        const x = node.position[0]
        { // left child
            const child = node.left
            const tdx = a * H

            const dx = x - child.position[0];
            const ax = 0.5 * k * (tdx - dx)
            node.position[0] += ax
            child.position[0] -= ax
        }
        { // right child
            const child = node.right
            const tdx = -a * H

            const dx = x - child.position[0];
            const ax = 0.5 * alpha * k * (tdx - dx)
            node.position[0] += ax
            child.position[0] -= ax
        }
        relaxNode(node.left, level + 1, levelNeighbours)
        relaxNode(node.right, level + 1, levelNeighbours)
    }
}

const RELAXATION_ITERATIONS = 50
for (let i = 0; i < RELAXATION_ITERATIONS; i++) {
    relaxNode(root)
}

const TAU = Math.PI * 2;

const mousePosition = new DOMPoint()
// TODO: maybe put mouse listeners on the window?
canvas.addEventListener("mousemove", event => {
    mousePosition.x = event.offsetX
    mousePosition.y = event.offsetY
})

let mouseClicked = false;
canvas.addEventListener("click", () => {
    mouseClicked = true;
})

interface TraverseContext {
    parent: LeafNode | null
    depth: number
    index: number
}
function* traverse(node: LeafNode) {
    const context: TraverseContext = {
        parent: null,
        depth: 0,
        index: 0,
    }
    function* traverseInner(node: LeafNode) : Generator<[LeafNode, Readonly<TraverseContext>]> {
        if (isTreeNode(node)) {
            yield [node, context]
            const {parent, depth, index}  = context
            context.parent = node
            context.depth = depth + 1
            context.index = 2*index
            yield* traverseInner(node.left)
            context.index = 2*index + 1
            yield* traverseInner(node.right)
            context.parent = parent
            context.depth = depth
            context.index = index
        } else {
            yield [node, context]
        }
    }
    yield* traverseInner(node)

}

function render() {
    assert(ctx != null)
    requestAnimationFrame(render)

    const rootStyles = getComputedStyle(document.documentElement)
    const background = rootStyles.getPropertyValue('--background').trim() || "black"
    const foreground = rootStyles.getPropertyValue('--foreground').trim() || "white"
    const red = rootStyles.getPropertyValue('--red').trim() || "red"
    const nodeRadius = 20
    const leafRadius = 5

    ctx.resetTransform()
    {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    { // apply camera transform
        const treeHeight = (function() {
            let maxDepth = 0
            for (const [, context] of traverse(root)) {
                maxDepth = Math.max(context.depth, maxDepth)
            }
            return maxDepth
        })()
        ctx.translate(canvas.width / 2, canvas.height / 2 - 0.5 * treeHeight * H)
    }
    const cameraTransform = ctx.getTransform().invertSelf()
    const mouseCamera = cameraTransform.transformPoint(mousePosition);

    let [focusNode, focusParent] = (function() {
        let minParent: LeafNode | null = null;
        let minNode: LeafNode | null = null;
        let minDistance = Infinity;
        for (const [node, context] of traverse(root)) {
            const dx = mouseCamera.x - node.position[0]
            const dy = mouseCamera.y - node.position[1]
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < minDistance) {
                minParent = context.parent;
                minNode = node;
                minDistance = distance;
            }
        }
        if (minDistance > nodeRadius) {
            return [null, null]
        }
        return [minNode, minParent]
    })()

    if (focusNode != null && !isTreeNode(focusNode)) {
        canvas.style.cursor = "pointer"
    } else {
        canvas.style.cursor = "default"
    }

    if (
        mouseClicked
        && focusNode != null && !isTreeNode(focusNode)
        && focusParent != null && isTreeNode(focusParent)
    ) {
        const color = Math.random() < 0.5 ? "red" : "black";
        const newNode = TreeNode(color, 0)
        const pos = focusNode.position;
        vec2.copy(newNode.position, pos);
        vec2.set(newNode.left.position, pos[0] - 0.5 * H, pos[1] + H);
        vec2.set(newNode.right.position, pos[0] + 0.5 * H, pos[1] + H);
        if (focusParent.right == focusNode) {
            focusParent.right = newNode
        } else {
            focusParent.left = newNode
        }
    }

    relaxNode(root)

    mouseClicked = false

    drawSubtree(ctx, root)

    function drawSubtree(ctx: CanvasRenderingContext2D, node: LeafNode, parent?: TreeNode) {
        if (isTreeNode(node)) {
            drawNode(ctx, node, parent)
            drawSubtree(ctx, node.left, node)
            drawSubtree(ctx, node.right, node)
        } else {
            drawNode(ctx, node, parent)
        }
    }

    function drawNode(ctx: CanvasRenderingContext2D, node: LeafNode, parent?: TreeNode) {
        ctx.save()

        const pos = node.position
        const radius = isTreeNode(node) ? nodeRadius : leafRadius
        ctx.strokeStyle = foreground
        ctx.fillStyle = background
        if (isTreeNode(node) && node.color == "red") {
            ctx.fillStyle = red
        }
        ctx.lineWidth = 3
        if (node == focusNode && !isTreeNode(node)) {
            ctx.lineWidth = 6
        }
        ctx.beginPath()
        ctx.arc(pos[0], pos[1], radius, 0, TAU);
        ctx.fill()
        ctx.stroke()
        ctx.lineWidth = 3

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

        if (isTreeNode(node) && node.label) { // draw label
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

