const bg = "black"
const fg = "white"
canvas.width = 1000
canvas.height = 1000
const ctx = canvas.getContext("2d")



const dropzone = document.querySelector('.dropzone');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const reader = new FileReader();
let vs = [];
let fcs = [];
let smallest = 0;
let biggest = 0;
let speed = 0;
let wireFramebool = true;
let transparency = false;
let fillObj = false;
let cullBool = true;
let dirLightBool = false;
const brightness = 0;
let lightDir = [{x:1, y:0, z:0}, {x:-1, y:0, z:0}];
let colour = [0,100,0];
let viewNormal = false;
let cw = false;
let rotAnim = 1;
let rotX = 0;
let rotY = 0;

function updateSpeed() {
    speed = Number(speedSlider.value);
    if (speedValue) {
        speedValue.textContent = `${Number(speedSlider.value).toFixed(2)}x`;
    }
    console.log(speed);
}

if (speedSlider) {
    speedSlider.addEventListener('input', () => {
        updateSpeed();
    });
    updateSpeed();
}

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
    updateSpeed();
    
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

function line({ x, y }) {
    ctx.strokeStyle = fg
    ctx.lineWidth = 2
    ctx.lineTo(x, y)
}

function screen(p) {
    return {
        x: (p.x + 1) / 2 * canvas.width,
        y: (1 - (p.y + 1) / 2) * canvas.height
    }
}

const fov = Math.PI/1.7

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
    let v1 = []
    let v2 = []
    if(cw){
        v1 = subVector(p2, p1)
        v2 = subVector(p3, p1)
    }
    else{
        v1 = subVector(p3, p1)
        v2 = subVector(p2, p1)
    }
    
    

    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    }   
}

function dotProduct(v1, v2){
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
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

function newVert(v1){
    return rotate_x(rotate_y(translate_y(translate_x(translate_z(rotate_x(rotate_y(v1, angle + rotX), angle+rotY), dz), dx), dy), mouseX*dt), -mouseY*dt)
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
    angle += Math.PI * dt * rotAnim /4


    const sortedFaces = [...fcs].sort((a, b) => {
        const aAverageZ = a.reduce((sum, index) => sum + newVert(vs[index]).z, 0) / a.length
        const bAverageZ = b.reduce((sum, index) => sum + newVert(vs[index]).z, 0) / b.length
        return bAverageZ - aAverageZ
    })

    // Each face is to be a triangle
    for (const fc of sortedFaces) {

        //Cross product uses assumption of clockwise rotation of vertice assignment
        const preTransMidpoint = midpoint(vs[fc[0]], vs[fc[1]], vs[fc[2]])
        const mp = newVert(preTransMidpoint)
        const n1 = newVert(addVector(normVect(crossProduct(vs[fc[1]], vs[fc[2]], vs[fc[0]])), preTransMidpoint))
        
        const normal = normVect(subVector(n1, mp))
        const toCam = normVect(subVector(mp, {x:0,y:0,z:0}))
        const faceDir = dotProduct(normal, toCam)

        if(faceDir > 0 && cullBool){
            continue
        }

        


        //We do a for loop that takes the fc element length bcs some obj files do not only have triangles, some have quads and n-gons, so the code above me will only work if fc has at least 3 components (a triangle, can be anything more complex than a triangle though as long as it lies on one plane)
        ctx.beginPath()
        for (let i = 0; i < fc.length; i++) {
            //Research how the rotation matrix works and why mouseY has to be negative
            yaw = mouseX*dt
            const v1 = newVert(vs[fc[i]])
            const v2 = newVert(vs[fc[(i + 1) % fc.length]])

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
                line(screen(project((v3))))
            }
            else{
                line(screen(project((v2))))
            }
        }
        ctx.closePath()
        if(wireFramebool){
            ctx.stroke()
        }
        if(fillObj){
            let shade = 0
            if(dirLightBool){
                for (const lv of lightDir){
                    shade+=Math.min(1, Math.max(0, -dotProduct(normal, normVect(subVector(newVert(lv),newVert({x:0, y:0, z:0}))))))
                }
            }
            else{
                shade = Math.min(1, Math.max(0, -faceDir))
            }
            const alphaShade= Math.round(255*shade)*(1+(brightness/100))
            if(transparency){
                ctx.fillStyle = `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${shade*(1+(brightness/100))})`
            }
            else{
                // I can't just use the camera as 0,0,0 because I need the light source to move with all objects, if I used the camera's origin, it would result in values that changes when I as the camera/player move, we don't want that, we want a vector that remains in the same direction that can be referred to when 1. calculating shading and 2. the player moves/rotates
                ctx.fillStyle = `rgb(${alphaShade+colour[0]}, ${alphaShade+colour[1]}, ${alphaShade+colour[2]})`
            }
            ctx.fill()
        }
        if(n1.z >= 0 && mp.z >= 0 && viewNormal == true){
            ctx.beginPath()
            ctx.moveTo(screen(project(n1)).x, screen(project(n1)).y);
            line(screen(project(mp)))  
            point(screen(project(n1)), n1.z)
            ctx.closePath()
            ctx.stroke()
        }
    }
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
