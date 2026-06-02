const bg = "black"
const fg = "white"
canvas.width = 1000
canvas.height = 1000
const ctx = canvas.getContext("2d")



const dropzone = document.querySelector('.dropzone');
const fovSlider = document.getElementById('fovSlider');
const fovValue = document.getElementById('fovValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const wireframeToggle = document.getElementById('wireframeToggle');
const transparencyToggle = document.getElementById('transparencyToggle');
const transparencyContainer = document.getElementById('transparencyContainer');
const fillObjToggle = document.getElementById('fillObjToggle');
const cullToggle = document.getElementById('cullToggle');
const viewNormalToggle = document.getElementById('viewNormalToggle');
const cwToggle = document.getElementById('cwToggle');
const cwContainer = document.getElementById('cwContainer');
const dirLightToggle = document.getElementById('dirLightToggle');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const colourRInput = document.getElementById('colourRInput');
const colourGInput = document.getElementById('colourGInput');
const colourBInput = document.getElementById('colourBInput');
const rotXInput = document.getElementById('rotXInput');
const rotYInput = document.getElementById('rotYInput');
const rotAnimToggle = document.getElementById('rotAnimToggle');
const lightDirXInput = document.getElementById('lightDirXInput');
const lightDirYInput = document.getElementById('lightDirYInput');
const lightDirZInput = document.getElementById('lightDirZInput');
const addLightDirButton = document.getElementById('addLightDirButton');
const lightDirDropdown = document.getElementById('lightDirDropdown');
const dirLightContainer = document.getElementById('dirLightContainer');
const exampleSelect = document.getElementById('exampleSelect');
const reader = new FileReader();
let vs = [];
let fcs = [];
let smallest = 0;
let biggest = 0;
let speed = 0;
let speedScale = 1;
let wireFramebool = true;
let transparency = false;
let fillObj = false;
let cullBool = true;
let dirLightBool = false;
let brightness = 0;
let lightDir = [];
let colour = [0,100,0];
let viewNormal = false;
let cw = true;
let rotAnim = 0;
let rotX = 0;
let rotY = 0;
let fov = Math.PI/1.7;



fovSlider.addEventListener('input', () => {
    const fovDegrees = Number(fovSlider.value);
    fov = fovDegrees * Math.PI / 180;
    fovValue.textContent = `FOV: ${fovDegrees.toFixed(0)}°`;
});

speedSlider.addEventListener('input', () => {
    speedScale = Number(speedSlider.value);
    speedValue.textContent = `Speed: ${Number(speedSlider.value).toFixed(2)}x`;
    speed = Math.sqrt(biggest**2 + smallest**2)*speedScale;
});

wireframeToggle.addEventListener('change', () => {
    wireFramebool = wireframeToggle.checked;
});

transparencyToggle.addEventListener('change', () => {
    transparency = transparencyToggle.checked;
});

fillObjToggle.addEventListener('change', () => {
    fillObj = fillObjToggle.checked;
        if (transparencyContainer) {
            transparencyContainer.style.visibility = fillObj ? 'visible' : 'hidden';
            transparencyContainer.style.opacity = fillObj ? '1' : '0';
            transparencyContainer.style.pointerEvents = fillObj ? 'auto' : 'none';
        }
    if (!fillObj) {
        transparencyToggle.checked = false;
        transparency = false;
    }
});

cullToggle.addEventListener('change', () => {
    cullBool = cullToggle.checked;
    if (cwContainer) {
        cwContainer.style.visibility = cullBool ? 'visible' : 'hidden';
        cwContainer.style.opacity = cullBool ? '1' : '0';
        cwContainer.style.pointerEvents = cullBool ? 'auto' : 'none';
    }
});

viewNormalToggle.addEventListener('change', () => {
    viewNormal = viewNormalToggle.checked;
});

cwToggle.addEventListener('change', () => {
    cw = cwToggle.checked;
});

dirLightToggle.addEventListener('change', () => {
    dirLightBool = dirLightToggle.checked;
    if (dirLightContainer) {
        dirLightContainer.style.visibility = dirLightBool ? 'visible' : 'hidden';
        dirLightContainer.style.opacity = dirLightBool ? '1' : '0';
        dirLightContainer.style.pointerEvents = dirLightBool ? 'auto' : 'none';
    }
    if (!dirLightBool) {
        lightDir = [];
        updateLightDirDropdown();
    }
});

brightnessSlider.addEventListener('input', () => {
    brightness = Number(brightnessSlider.value);
    brightnessValue.textContent = `Brightness: ${brightnessSlider.value}%`;
});


function clampChannel(value) {
    return Math.max(0, Math.min(255, Number(value) || 0));
}

function updateColourFromInputs() {
    const r = clampChannel(colourRInput.value);
    const g = clampChannel(colourGInput.value);
    const b = clampChannel(colourBInput.value);

    colour = [r, g, b];
    colourRInput.value = String(r);
    colourGInput.value = String(g);
    colourBInput.value = String(b);
}

colourRInput.addEventListener('input', updateColourFromInputs);
colourGInput.addEventListener('input', updateColourFromInputs);
colourBInput.addEventListener('input', updateColourFromInputs);

function updateRotationFromInputs() {
    rotX = Number(rotXInput.value) || 0;
    rotY = Number(rotYInput.value) || 0;

    rotXInput.value = String(rotX);
    rotYInput.value = String(rotY);
}

rotXInput.addEventListener('input', updateRotationFromInputs);
rotYInput.addEventListener('input', updateRotationFromInputs);

rotAnimToggle.addEventListener('change', () => {
    rotAnim = rotAnimToggle.checked ? 1 : 0;
});

function readLightDirectionInputs() {
    return {
        x: Number(lightDirXInput.value) || 0,
        y: Number(lightDirYInput.value) || 0,
        z: Number(lightDirZInput.value) || 0,
    };
}

function updateLightDirDropdown() {
    lightDirDropdown.innerHTML = '';

    if (lightDir.length === 0) {
        const emptyOption = document.createElement('option');
        emptyOption.textContent = 'lightDir is empty';
        emptyOption.value = '';
        lightDirDropdown.appendChild(emptyOption);
        return;
    }

    lightDir.forEach((direction, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = `${index}: x=${direction.x}, y=${direction.y}, z=${direction.z}`;
        lightDirDropdown.appendChild(option);
    });
}

addLightDirButton.addEventListener('click', () => {
    lightDir.push(readLightDirectionInputs());
    updateLightDirDropdown();
});


exampleSelect.addEventListener('change', async () => {
    const model = exampleSelect.value;
    if (!model) return;
    try {
        const response = await fetch(encodeURI(model));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        // prefer blob.text() to avoid reusing global FileReader
        const text = await blob.text();
        parseObjFile(text);
    } catch (error) {
        console.error('Failed to load example model', model, error);
    }
});


function parseObjFile(fileText) {
    vs = [];
    fcs = [];
    const lines = fileText.split(/\r?\n/);
    smallest = 0
    biggest = 0
    // track per-axis mins/maxs so we can centre the model
    let minX = 0, maxX = 0;
    let minY = 0, maxY = 0;
    let minZ = 0, maxZ = 0;
    let firstVertex = true;

    for (let line of lines) {
        line = line.trim();

        if (!line || line.startsWith('#')) {
            continue;
        }

        const parts = line.split(/\s+/);

        if (line.startsWith('v ')) {
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);

            smallest = Math.min(smallest, x, y, z);
            biggest = Math.max(biggest, x, y, z);


            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);

            vs.push({ x, y, z });
        }
        if (line.startsWith('f ')) {
                const parts = line.split(/\s+/);
                // We subtract one because obj files start from 1 for faces, not 0
                const a = parseInt(parts[1].split('/')[0], 10)-1;
                const b = parseInt(parts[2].split('/')[0], 10)-1;
                const c = parseInt(parts[3].split('/')[0], 10)-1;

                fcs.push([a,b,c]);
            }
    }
    const avgX = (minX + maxX) / 2;
    const avgY = (minY + maxY) / 2;
    const avgZ = (minZ + maxZ) / 2;

    // Resets the camera position so u don't have to go on a pilgramige to find the object
    dx = -avgX;
    dy = -avgY;
    speed = Math.sqrt(biggest**2 + smallest**2)*speedScale;
    dz = -avgZ+speed;
    
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
    return rotate_x(rotate_y(translate_y(translate_x(translate_z(rotate_x(rotate_y(v1, angle + rotY), angle+rotX), dz), dx), dy), mouseX*dt), -mouseY*dt)
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
                
                ctx.moveTo(screen(project((p2))).x, screen(project((p2))).y)
                line(screen(project((v3))))
            }
            else{
                ctx.lineTo(screen(project(v1)).x, screen(project(v1)).y)
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
                // I can't just use the camera as 0,0,0 because I need the light source to move with all objects, if I used the camera's origin, it would result in values that changes when I as the camera/player move, we don't want that, we want a vector that remains in the same direction that can be referred to when 1. calculating shading and 2. the player moves/rotates
                for (const lv of lightDir){
                    shade+=Math.min(1, Math.max(0, -dotProduct(normal, normVect(subVector(rotate_x(rotate_y(translate_y(translate_x(translate_z(lv, dz), dx), dy), mouseX*dt), -mouseY*dt),newVert({x:0, y:0, z:0}))))))
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
