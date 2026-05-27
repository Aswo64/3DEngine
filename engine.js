const bg = "black"
const fg = "white"
canvas.width = 1000
canvas.height = 1000
const ctx = canvas.getContext("2d")



const dropzone = document.querySelector('.dropzone');
const reader = new FileReader();
let vs = [];
let fcs = [];
let smallest = 0;
let biggest = 0;
let speed = 0;

function parseObjFile(fileText) {
    vs = [];
    fcs = [];
    const lines = fileText.split(/\r?\n/);
    smallest = 0
    biggest = 0
    //Puts camera back to origin so you don't have to go on a pilgramage to get back to see smaller models
    dx = 0
    dy = 0
    dz = 0

    for (let line of lines) {
        line = line.trim();

        if (!line || line.startsWith('#')) {
            continue;
        }

        const parts = line.split(/\s+/);

        if (line.startsWith('v ')) {
            smallest = Math.min(smallest, ...parts.slice(1,4).map(Number))
            biggest = Math.max(biggest, ...parts.slice(1,4).map(Number))
            vs.push({
            x: parseFloat(parts[1]),
            y: parseFloat(parts[2]),
            z: parseFloat(parts[3])
        });
        } 
        if (line.startsWith('f ')) {
                const parts = line.split(/\s+/);
                // We subtract one because obj files start from 1, not 0
                const a = parseInt(parts[1].split('/')[0], 10)-1;
                const b = parseInt(parts[2].split('/')[0], 10)-1;
                const c = parseInt(parts[3].split('/')[0], 10)-1;

                fcs.push([a,b,c]);
            }
    }
    //Recalculates the speed so viewing larger models aren't a pain in the ass
    speed = Math.sqrt(biggest**2 + smallest**2)/2.5
    
}



reader.onload = function(e) {
    const textContent = e.target.result;
    parseObjFile(textContent);
};


dropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    img.style.filter = 'invert(100%)';
});

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('active')
    e.dataTransfer.dropEffect = 'move';
    img.style.filter = 'invert(100%)';
});

dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.classList.remove('active')
    img.style.filter = 'invert(0%)';
});

function assignFile(file){
    if(!file){
        console.log("nofile")
    }

    const extension = file.name.split('.').pop().toLowerCase();
    console.log("Extension:", extension);
    
    if (extension === "obj") {
      reader.readAsText(file);
    }
    else{
        console.log("give valid file")
    }
    
}

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('active')
    img.style.filter = '';
    const {files} = e.dataTransfer;
    assignFile(files[0])
});


document.getElementById('objFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    assignFile(file)
    
});


function clear() {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function point({ x, y }, z) {
    const s = 20/(z*5)
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

const fov = Math.PI/1.5

function project({ x, y, z }) {
    return {
        y: y / (z * Math.tan(fov/2)),
        x: (x * canvas.height/canvas.width) / (z * Math.tan(fov/2))
    }
}

const FPS = 60
setTimeout(frame, 1000 / FPS)
let dz = 0
let dx = 0
let dy = 0
const dt = 1 / FPS
let angle = 0
let mouseX = 0
let yaw = 0
let mouseY = 0

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

function scalarVector(vector, scalar){
    return{
        x: vector.x * scalar,
        y: vector.y * scalar,
        z: vector.z * scalar
    }
}

function crossProduct(p1, p2, p3){
    const v1 = subVector(p2, p1)
    const v2 = subVector(p3, p1)

    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    }   
}

function normVect(v1){
    const t = Math.sqrt(v1.x**2 + v1.y**2 + v1.z**2)
    return {
        x: v1.x/t,
        y: v1.y/t,
        z: v1.z/t
    }
}

function midpoint(p1, p2, p3){
    return {
        x: (p1.x + p2.x + p3.x) / 3,
        y: (p1.y + p2.y + p3.y) / 3,
        z: (p1.z + p2.z + p3.z) / 3
    }
}


function frame() {
    clear()
    if (keys['w']){ 
        if(keys['shift']){
            dy -= speed * dt
        } else{
            dz -= Math.cos(yaw) * speed * dt
            dx -= Math.sin(yaw) * speed * dt
        }
    }
    if (keys['s']){ 
        if(keys['shift']){
            dy += speed * dt
        } else{
            dz += Math.cos(yaw)* speed * dt
            dx += Math.sin(yaw)* speed * dt
        }
    }
    if (keys['a']){ 
        dx += Math.cos(yaw) * speed * dt
        dz -= Math.sin(yaw) * speed * dt
    }
    if (keys['d']){ 
        dx -= Math.cos(yaw) * speed * dt
        dz += Math.sin(yaw) * speed * dt
    }
    angle += Math.PI * dt *1 /4
    

    // Each face is to be a triangle
    for (const fc of fcs) {
        for (let i = 0; i < fc.length; i++) {
            //Research how the rotation matrix works and why mouseY has to be negative
            yaw = mouseX*dt
            const v1 = rotate_x(rotate_y(translate_y(translate_x(translate_z(rotate_x(rotate_y(vs[fc[i]], angle), 0), dz), dx), dy), mouseX*dt), -mouseY*dt)
            const v2 = rotate_x(rotate_y(translate_y(translate_x(translate_z(rotate_x(rotate_y(vs[fc[(i + 1) % fc.length]], angle), 0), dz), dx), dy), mouseX*dt), -mouseY*dt)

            if(v2.z <= 0 && v1.z <= 0){
                continue
            }
            if (v1.z <= 0 || v2.z <= 0) {
                let p1 = v1
                let p2 = v2

                if (v2.z <= 0) {
                    p1 = v2
                    p2 = v1
                }
                const t = (0.001 - p1.z) / (p2.z - p1.z)
                const v3 = addVector(p1, scalarVector(subVector(p2, p1), t))
                line(screen(project(p2)),screen(project((v3))))
            }
            else{
                line(screen(project(v1)),screen(project((v2))))
            }

            // if(i == 1){
            //     const mp = rotate_x(rotate_y(translate_y(translate_x(translate_z(rotate_x(rotate_y(midpoint(vs[fc[i-1]], vs[fc[i]], vs[fc[i+1]]), angle), 0), dz), dx), dy), mouseX*dt), -mouseY*dt)
            //     const n1 = rotate_x(rotate_y(translate_y(translate_x(translate_z(rotate_x(rotate_y(addVector(crossProduct(vs[fc[i]], vs[fc[i-1]], vs[fc[i+1]]), midpoint(vs[fc[i-1]], vs[fc[i]], vs[fc[i+1]])), angle), 0), dz), dx), dy), mouseX*dt), -mouseY*dt)
            //     if(n1.z >= 0 && mp.z >= 0){
            //         line(screen(project(n1)), screen(project(mp)))
            //         point(screen(project(n1)), n1.z)
            //         //console.log(n1.z)
            //     }
            // }
        }
    }
    console.log(speed)
    setTimeout(frame, 1000 / FPS)
}

const keys = {}
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true })
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false })

function mouseMovement(event){
    mouseX += event.movementX/5;
    mouseY += event.movementY/5;
}

document.addEventListener('pointerlockchange', () => {
    //research triple equal sign, what strict means
    if (document.pointerLockElement === canvas) {
        document.addEventListener('mousemove', mouseMovement);
    } else {
        document.removeEventListener('mousemove', mouseMovement);
    }
});

canvas.addEventListener('click', async () => {
    try {
        await canvas.requestPointerLock();
    } catch (err) {
        console.error(err);
    }
});
