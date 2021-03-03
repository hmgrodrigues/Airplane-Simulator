//Vars

var canvas;
var gl;
var program;

var mViewLoc, mModelLoc, mProjectionLoc, drawTextureLoc, mView, mModel, mProjection;

var matrixStack = [];

var camera = "perspectiveView";

var filled = true;

var extraFloorX = 0;
var extraFloorZ = 0;

var texture;

var yawAirplane = 0;
var rollAirplane = 0;
var pitchAirplane = 0;

var rotatePropeller = 0;
var turnWheel = 0;
var rotateWheel = 0;
var rotateBackUpAileron = 0;
var rotateWingAileron = 0;
var rotateBackDownAileron = 0;

var yawMovement = "stopped";
var pitchMovement = "stopped";
var rollMovement = "stopped";

var speed = 0;
var speedMaxByLevel = 0;
var pos = [0,0,0];

// Stack related operations
function pushMatrix() {
    var m =  mat4(mModel[0], mModel[1],
        mModel[2], mModel[3]);
    matrixStack.push(m);
}
function popMatrix() {
    mModel = matrixStack.pop();
}
// Append transformations to mModel
function multMatrix(m) {
    mModel = mult(mModel, m);
}
function multTranslation(t) {
    mModel = mult(mModel, translate(t));
}
function multScale(s) { 
    mModel = mult(mModel, scalem(s));
}
function multRotationX(angle) {
    mModel = mult(mModel, rotateX(angle));
}
function multRotationY(angle) {
    mModel = mult(mModel, rotateY(angle));
}
function multRotationZ(angle) {
    mModel = mult(mModel, rotateZ(angle));
}

/**
	setups the texture
**/
function setupTexture() {
    // Create a texture.
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255]));
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = "https://i.imgur.com/uYvFl43.jpg";
    // Asynchronously load an image
    image.addEventListener('load', function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    });
}

/**
	generates floor for the plane depending on its position
**/
function floor(){
    var directionX;
    var directionZ;
    if(pos[0] <= 0) directionX = -1; else directionX = 1;
    if(pos[2] <= 0) directionZ = -1; else directionZ = 1;
    extraFloorX = Math.round(pos[0]/200 + directionX);
    extraFloorZ = Math.round(pos[2]/200 + directionZ);
    for(var i = 0; i <= Math.abs(extraFloorX); i++)
        for(var j = 0; j <= Math.abs(extraFloorZ); j++){
            pushMatrix();
            var auxI, auxJ;
            if(extraFloorX >= 0) auxI = i; else auxI = -i;
            if(extraFloorZ >= 0) auxJ = j; else auxJ = -j;
            multTranslation([auxI*200,-0.295,auxJ*200]);
            multScale([200,0.01,200]);
            draw("cube",1.0);
            popMatrix();
        }    
}

/**
	creates the airplane
**/
function airplane(){
    pushMatrix();
        tube();
    popMatrix();
    pushMatrix();
        front();
    popMatrix();
    pushMatrix();
        wing();
    popMatrix();
    pushMatrix();
        back();
    popMatrix();
    pushMatrix();
        wheels();
    popMatrix();
}

/**
	creates the body of the airplane
**/
function tube(){
    multRotationX(90);
    multScale([0.3, 0.8, 0.3]);
    draw("cylinder",0.0);
}

/**
	creates the front part of the plane
**/
function front(){
        multTranslation([0,0,-0.42]); //Center of front
    pushMatrix();
        cockpit();
    popMatrix();
        multTranslation([0,0,-0.18]); //Center of propellers
    pushMatrix();
        propeller(0);
    popMatrix();
        propeller(90);
}

/**
	creates the cockpit of the plane
**/
function cockpit(){
    multScale([0.3, 0.3, 0.35]);
    draw("sphere",0.0);
}

/**
	creates the propeller of the plane
**/
function propeller(initialAngle){
    multRotationZ(initialAngle + rotatePropeller);
    multScale([0.01,0.35,0.01]);
    draw("cube",0.0);
}

/**
	creates the wing of the plane
**/
function wing(){
        multTranslation([0,0,-0.15]);
    pushMatrix();
        multRotationX(-90);
        multScale([2,0.5,0.01]);
        draw("pyramid",0.0);
    popMatrix();
    pushMatrix();
        wingAileron("left");
    popMatrix();
        wingAileron("right");
}

/**
	creates a wing aileron
**/
function wingAileron(side){
    var auxAileronTranslation;
    var auxAileronRotateAngle;
    switch(side){
        case "left": auxAileronTranslation = vec3(-0.575,0,0.25); 
            auxAileronRotateAngle = -rotateWingAileron; break;
        case "right": auxAileronTranslation = vec3(0.575,0,0.25); 
            auxAileronRotateAngle = rotateWingAileron; break;
    }
    multTranslation(auxAileronTranslation);
    multRotationX(auxAileronRotateAngle);
    multTranslation([0,0,0.025]);
    multScale([0.85,0.01,0.05]);
    draw("cube",0.0);
}

/**
	creates the back of the airplane
**/
function back(){
        multTranslation([0,0,0.6]); //Center of back support
    pushMatrix();
        backSupport();
    popMatrix();
    pushMatrix();
        backAileron("top");
    popMatrix();
    pushMatrix();
        backAileron("left");
    popMatrix();
        backAileron("right");
}

/**
	creates the back support of the airplane
**/
function backSupport(){
    multRotationX(90);
    multScale([0.3, 0.4, 0.3]);
    draw("cone",0.0);
}

/**
	creates a back aileron
**/
function backAileron(side){
    var auxAileronTranslation;
    var auxAileronRotateAngle;
    var auxAileronScale;
    switch(side){
        case "top": auxAileronTranslation = vec3(0,0,0.1); auxAileronRotateAngle = rotateBackUpAileron; 
            auxAileronScale = vec3(0.25,0.01,0.05); multTranslation([0,0.125,0.1]); multRotationZ(-90);
            break;
        case "left": auxAileronTranslation = vec3(-0.025,0,0.1);
            auxAileronRotateAngle = rotateBackDownAileron; auxAileronScale = vec3(0.2,0.01,0.05);
            multTranslation([-0.125,0,0.1]); break;
        case "right": auxAileronTranslation = vec3(0.025,0,0.1); 
            auxAileronRotateAngle = rotateBackDownAileron; auxAileronScale = vec3(0.2,0.01,0.05);
            multTranslation([0.125,0,0.1]); break;
    }
    pushMatrix();
        multScale([0.25,0.01,0.2]);
        draw("cube",0.0);
    popMatrix();
        multTranslation(auxAileronTranslation);
        multRotationX(auxAileronRotateAngle);
        multTranslation([0,0,0.025]);
        multScale(auxAileronScale);
        draw("cube",0.0);
}

/**
	creates the wheels of the airplane
**/
function wheels(){
        wheel("front");
    popMatrix();
    pushMatrix();
        wheel("backleft");
    popMatrix();
    pushMatrix();
        wheel("backright");
}

/**
	creates a leg and a wheel
**/
function wheel(side){
    switch(side){
        case "front": multTranslation([0,-0.125,-0.35]); break;
        case "backleft": multTranslation([-0.1,-0.125,0.1]); break;
        case "backright": multTranslation([0.1,-0.125,0.1]); break;
    }
    pushMatrix();
        multScale([0.03,0.25,0.03]);
        draw("cube",0.0);
    popMatrix();
        multTranslation([0,-0.145,0]);
        multRotationY(turnWheel);
        multRotationX(rotateWheel);
        multRotationZ(90);
        multScale([0.04,0.035,0.04]);
        draw("cylinder",0.0);
}

/**
	creates a polygon inputed in the parameter with a texture 
    or not depending on the other parameter

**/
function draw(polygon, drawTexture){
    var drawPolygon;
    switch(polygon){
        case "cylinder": drawPolygon = ({drawFilled: cylinderDrawFilled,
            drawWire: cylinderDrawWireFrame}); break;
        case "cone": drawPolygon = ({drawFilled: coneDrawFilled,
            drawWire: coneDrawWireFrame}); break;
        case "pyramid": drawPolygon = ({drawFilled: pyramidDrawFilled,
            drawWire: pyramidDrawWireFrame}); break;
        case "cube":  drawPolygon = ({drawFilled: cubeDrawFilled,
            drawWire: cubeDrawWireFrame}); break;
        case "sphere": drawPolygon = ({drawFilled: sphereDrawFilled, 
            drawWire: sphereDrawWireFrame}); break;
    }
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));
    gl.uniform1f(drawTextureLoc, drawTexture);
    if(!filled) drawPolygon.drawWire(gl,program);
    else drawPolygon.drawFilled(gl,program);
}

// ------------- Yaw -------------

/**
	yaw movement (airplane and ailerons)
**/
function yaw(){
    switch(yawMovement){
        case "left": if(rotateBackUpAileron < 45) rotateBackUpAileron++; break;
        case "right": if(rotateBackUpAileron > -45) rotateBackUpAileron--; break;
    }
    turnWheel = rotateBackUpAileron;
    yawAirplane += 0.005 * rotateBackUpAileron;
}

/**
	smoothly brakes the yaw movement
**/
function stopYaw(){
    if(rotateBackUpAileron == 0) yawMovement = "stopped";
    else if(rotateBackUpAileron > 0) {rotateBackUpAileron--; yawAirplane += 0.005 * rotateBackUpAileron;
        turnWheel = rotateBackUpAileron;} 
    else {rotateBackUpAileron++; yawAirplane += 0.005 * rotateBackUpAileron; 
        turnWheel = rotateBackUpAileron;}
}

// ------------- Pitch -------------

/**
	pitch movement (airplane and ailerons)
**/
function pitch(){
    switch(pitchMovement){
        case "down": if(rotateBackDownAileron < 45) rotateBackDownAileron++; 
            if(pitchAirplane > -30) pitchAirplane -= 0.005 * rotateBackDownAileron; break;
        case "up": if(rotateBackDownAileron > -45) rotateBackDownAileron--; 
            if(pitchAirplane < 30) pitchAirplane -= 0.005 * rotateBackDownAileron; break;
    }
}

/**
	pitch movement on the floor (ailerons)
**/
function floorPitch(){
    switch(pitchMovement){
        case "floorDown": if(rotateBackDownAileron < 45) rotateBackDownAileron++; break;
        case "floorUp": if(rotateBackDownAileron > -45) rotateBackDownAileron--; break;
    }
}

/**
	smoothly brakes the pitch movement (airplane and ailerons)
**/
function stopPitch(){
    if(Math.round(pitchAirplane) == 0 && rotateBackDownAileron == 0) {pitchAirplane = 0; pitchMovement = "stopped";}
    else if(rotateBackDownAileron < 0) {rotateBackDownAileron++; pitchAirplane -= 0.005 * rotateBackDownAileron;}
    else if(rotateBackDownAileron > 0) {rotateBackDownAileron--; pitchAirplane -= 0.005 * rotateBackDownAileron;}
    else pitchAirplane -= 0.005 * pitchAirplane;
}

/**
	smoothly brakes the pitch movement on the floor (ailerons)
**/
function stopFloorPitch(){
    if(rotateBackDownAileron == 0) pitchMovement = "stopped";
    else if(rotateBackDownAileron < 0) rotateBackDownAileron++;
    else if(rotateBackDownAileron > 0) rotateBackDownAileron--;
}

// ------------- Roll -------------

/**
	roll movement (airplane and ailerons)
**/
function roll(){
    switch(rollMovement){
        case "left": if(rotateWingAileron < 45) rotateWingAileron++; 
            if(rollAirplane < 30) rollAirplane += 0.005 * rotateWingAileron; break;
        case "right": if(rotateWingAileron > -45) rotateWingAileron--; 
            if(rollAirplane > -30) rollAirplane += 0.005 * rotateWingAileron; break;
    }
}

/**
	roll movement on the floor (ailerons)
**/
function floorRoll(){
    switch(rollMovement){
        case "floorLeft": if(rotateWingAileron < 45) rotateWingAileron++; break;
        case "floorRight": if(rotateWingAileron > -45) rotateWingAileron--; break;
    }
}

/**
	smoothly brakes the roll movement (airplane and ailerons)
**/
function stopRoll(){
    if(Math.round(rollAirplane) == 0 && rotateWingAileron == 0) {rollAirplane = 0; rollMovement = "stopped";}
    else if(rotateWingAileron < 0) {rotateWingAileron++; rollAirplane += 0.005 * rotateWingAileron;}
    else if(rotateWingAileron > 0) {rotateWingAileron--; rollAirplane += 0.005 * rotateWingAileron;}
    else rollAirplane -= 0.005 * rollAirplane;
}

/**
    smoothly brakes the roll movement on the floor (ailerons)
**/
function stopFloorRoll(){
    if(rotateWingAileron == 0) rollMovement = "stopped";
    if(rotateWingAileron < 0) rotateWingAileron++;
    else if(rotateWingAileron > 0) rotateWingAileron--;
}

// ------------- Propulsion -------------

/**
	speeds up or brakes the plane
**/
function propulsion(){
    if(speedMaxByLevel - speed > 0.1) speed += 0.05;
    else {speed -= 0.05; if(Math.round(speed) == 0) speed = 0;}
    rotatePropeller += speed;
    rotateWheel -= speed;
}

/**
	updates the position of the plane
**/
function updateAirplanePos(){
    pos[0] -= Math.sin(radians(yawAirplane)) * 0.005 * speed;
    pos[1] += Math.sin(radians(pitchAirplane)) * 0.005 * speed;
    pos[2] -= Math.cos(radians(yawAirplane)) * 0.005 * speed;
}

// ----------- Cameras -------------

function topView(){
    mView = lookAt([0,1,0], [0,0,0], [0,0,-1]);
    orthogonalProjection();
}

function rightSideView(){  
    mView = lookAt([1,0,0], [0,0,0], [0,1,0]);
    orthogonalProjection();
}

function frontView(){
    mView = lookAt([0,0,-1], [0,0,0], [0,1,0]);
    orthogonalProjection();
}

function perspectiveView(){
    mView = lookAt([0,2,3.5], [0,0,-2], [0,1,0]);
    perspectiveProjection();
}

function orthogonalProjection(){
    var ratio = canvas.width/canvas.height;
    if(window.width <= window.height)
        mProjection = ortho(-1, 1, -ratio, ratio, -10, 10);
    else mProjection = ortho(-ratio, ratio, -1, 1, -10, 10);
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));
}

function perspectiveProjection(){
    var ratio = canvas.width/canvas.height;
    mProjection = perspective(45, ratio, 1, -10);
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));  
}

/**
	detects camera and movements of the plane
**/
function detectCameraAndMovements(){
    switch(camera){
        case "perspectiveView": perspectiveView(); break;
        case "topView": topView(); break;
        case "rightSideView": rightSideView(); break;
        case "frontView": frontView(); break;
    }
    
    switch(yawMovement){
        case "center": stopYaw(); break;
        case "left": yaw(); break; 
        case "right": yaw(); break;
        case "stopped": break; //do nothing
    }

    switch(pitchMovement){
        case "center": stopPitch(); break;
        case "centerFloor": stopFloorPitch(); break;
        case "floorUp": floorPitch(); break;
        case "floorDown": floorPitch(); break;
        case "up": pitch(); break;
        case "down": pitch(); break;
        case "stopped": break; //do nothing
    }

    switch(rollMovement){
        case "center": stopRoll(); break;
        case "centerFloor": stopFloorRoll(); break;
        case "floorLeft": floorRoll(); break;
        case "floorRight": floorRoll(); break;
        case "left": roll(); break;
        case "right": roll(); break;
        case "stopped": break; //do nothing
    }
    
    if(speedMaxByLevel > 0 || speed > 0)
        propulsion();
}

/**
    key down event
**/
function keyDownEvent(ev){
    switch(ev.keyCode){
        case 48: camera = "perspectiveView"; break;
        case 49: camera = "topView"; break;
        case 50: camera = "rightSideView"; break;
        case 51: camera = "frontView"; break;
        case 79: if(!filled) filled = true; else filled = false; break;
        case 81: yawMovement = "left"; break; //Q - yaw left
        case 69: yawMovement = "right"; break; //E - yaw right
        case 87: if(speed >= 10) pitchMovement = "up"; else pitchMovement = "floorUp"; break; //W - pitch up
        case 83: if(speed >= 10) pitchMovement = "down"; else pitchMovement = "floorDown"; break; //S - pitch down
        case 65: if(pos[1] > 0) rollMovement = "left"; else rollMovement = "floorLeft"; break; //A - roll left
        case 68: if(pos[1] > 0) rollMovement = "right"; else rollMovement = "floorRight"; break; //D - roll right
        case 82: if(speedMaxByLevel != 100) speedMaxByLevel += 20; break; //R - move with higher speed
        case 70: if(speedMaxByLevel != 0) speedMaxByLevel -= 20; break; //F - move with lower speed
    }
}

/**
    key up event
**/
function keyUpEvent(ev){
    switch(ev.keyCode){
        case 81: yawMovement = "center"; break; //Q - stabilize back up aileron
        case 69: yawMovement = "center"; break; //E - stabilize back up aileron
        case 87: if(pitchMovement == "up") pitchMovement = "center"; 
                    else pitchMovement = "centerFloor"; break; //W - stabilize back down aileron 
        case 83: if(pitchMovement == "down") pitchMovement = "center"; 
                    else pitchMovement = "centerFloor"; break; //S - stabilize back down aileron
        case 65: if(rollMovement == "left") rollMovement = "center"; else rollMovement = "centerFloor"; break; //A - stabilize wing aileron
        case 68: if(rollMovement == "right") rollMovement = "center"; else rollMovement = "centerFloor"; break; //D - stabilize wing aileron
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    fit_canvas_to_window();

    //Keydown and Keyup event
    window.addEventListener("keydown", keyDownEvent);
    window.addEventListener("keyup", keyUpEvent);
    
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    mModelLoc = gl.getUniformLocation(program, "mModel");    
    mViewLoc = gl.getUniformLocation(program, "mView");
    drawTextureLoc = gl.getUniformLocation(program,"drawTexture");

    cubeInit(gl);
    cylinderInit(gl);
    coneInit(gl);
    pyramidInit(gl);
    sphereInit(gl);

    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
    
    setupTexture();
                    
    render();
}

function fit_canvas_to_window()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

window.onresize = function () {
    fit_canvas_to_window();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    detectCameraAndMovements();
    
    updateAirplanePos();
    mView = mult(mView, rotateY(-yawAirplane));
    mView = mult(mView, translate(-pos[0],-pos[1],-pos[2]));

    mModel = mat4();
    floor();
    multTranslation([pos[0],pos[1],pos[2]]);
    multRotationY(yawAirplane);
    multRotationX(pitchAirplane);
    multRotationZ(rollAirplane);
    airplane();
    
    window.requestAnimFrame(render);
}