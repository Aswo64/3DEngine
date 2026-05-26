const bg = "black"
const fg = "white"
canvas.width = 1000
canvas.height = 1000
const ctx = canvas.getContext("2d")

function clear() {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function point({ x, y }) {
    const s = 20
    ctx.fillStyle = fg
    ctx.fillRect(x - s / 2, y - s / 2, s, s)
}

function line({ x, y }, { x: x2, y: y2 }) {
    ctx.strokeStyle = fg
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

function screen(p) {
    return {
        x: (p.x + 1) / 2 * canvas.width,
        y: (1 - (p.y + 1) / 2) * canvas.height
    }
}

const fov = Math.PI/1.3

function project({ x, y, z }) {
    return {
        y: y / (z * Math.tan(fov/2)),
        x: (x * canvas.height/canvas.width) / (z * Math.tan(fov/2))
    }
}

const FPS = 60
let dz = 0
let dx = 0
let dy = 0
let angle = 0
let mouseX = 0
let yaw = 0
let mouseY = 0


const vs = [
    {x:  0.25, y:  0.25, z:  -0.25},
    {x: -0.25, y:  0.25, z:  -0.25},
    {x: -0.25, y: -0.25, z:  -0.25},
    {x:  0.25, y: -0.25, z:  -0.25},

    {x:  0.25, y:  0.25, z: 0.25},
    {x: -0.25, y:  0.25, z: 0.25},
    {x: -0.25, y: -0.25, z: 0.25},
    {x:  0.25, y: -0.25, z: 0.25}, 
]

const fcs = [
    [0, 1, 2],
    [0, 2, 3],
    [4, 6, 5],
    [4, 7, 6],
    [3,7,4],
    [3,4,0],
    [0,4,5],
    [0,5,1],
    [1,5,6],
    [1,6,2],
    [3,2,6],
    [3,6,7]
]

function translate_z({ x, y, z }, dz) {
    return {
        x: x,
        y: y,
        z: z + dz
    }
}

function translate_x({ x, y, z }, dx) {
    return {
        x: x + dx,
        y: y,
        z: z
    }
}
function translate_y({ x, y, z }, dy) {
    return {
        x: x,
        y: y + dy,
        z: z
    }
}

function rotate_y({ x, y, z }, a) {
    return {
        x: x * Math.cos(a) - z * Math.sin(a),
        y: y,
        z: x * Math.sin(a) + z * Math.cos(a)
    }
}

function rotate_x({ x, y, z }, a) {
    return {
        x: x,
        y: y * Math.cos(a) - z * Math.sin(a),
        z: y * Math.sin(a) + z * Math.cos(a)
    }
}

function rotate_z({ x, y, z }, a) { 
  return { 
    x: x * Math.cos(a) - y * Math.sin(a), 
    y: x * Math.sin(a) + y * Math.cos(a), 
    z: z 
  }; 
}

function addVector(one, two){
    return {
        x: one.x + two.x,
        y: one.y + two.y,
        z : one.z + two.z
    }
}

function subVector(one, two){
    return {
        x: one.x - two.x,
        y: one.y - two.y,
        z : one.z - two.z
    }
}


function frame() {
    const dt = 1 / FPS
    const speed = 0.5
    angle += Math.PI * dt /4
    clear()

    // for (const v of vs) {
    //     point(screen(project(translate_z(rotate_y(v, angle), dz))))
    // }

    // Each face is to be a triangle
    for (const fc of fcs) {
        for (let i = 0; i < fc.length; i++) {
            //Research how the rotation matrix works and why mouseY has to be negative
            const v1 = translate_z(rotate_z(rotate_x(rotate_y(vs[fc[i]], angle), angle), angle), 1)
            const v2 = translate_z(rotate_z(rotate_x(rotate_y(vs[fc[(i + 1) % fc.length]], angle), angle), angle), 1)


            if(v2.z <= 0 && v1.z <= 0){
                continue
            }
            if(v2.z <= 0){
                const t = (0.001 - v2.z)/(v1.z-v2.z)
                const v3 = addVector(v2, scalarVector(subVector(v1, v2), t))
                line(screen(project(v1)),screen(project((v3))))
                continue
            }
            if(v1.z <= 0){
                //Research why the 0.01 can't just be 0
                const t = (0.001 - v1.z)/(v2.z-v1.z)
                const v3 = addVector(v1, scalarVector(subVector(v2, v1), t))
                line(screen(project(v3)),screen(project((v2))))
                continue
            }

            line(screen(project(v1)),screen(project((v2))))
        }
    }
    
    setTimeout(frame, 1000 / FPS)
}


setTimeout(frame, 1000 / FPS)