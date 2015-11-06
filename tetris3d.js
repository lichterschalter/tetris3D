var gl;

function initGL( canvas ){
    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;

    if (String.fromCharCode(event.keyCode) == "F") {
        filter += 1;
        if (filter == 3) {
            filter = 0;
        }
    }
}


function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}


function handleKeys() {
    if ( currentlyPressedKeys[83] ) {
        //s key
        zoom += 0.05;
    }
    if ( currentlyPressedKeys[65] ) {
        //a key
        if( zoom > 0 ){
          zoom -= 0.05;
        }else{
          zoom = 0;
        }
    }
    if ( currentlyPressedKeys[80] ) {
        //p key
        perspectiveView = !perspectiveView;
    }
}

var mouseRightDown = false;
var mouseLeftDown = false;
var lastMouseX = null;
var lastMouseY = null;

var cameraPositionMatrix = mat4.create();
mat4.identity(cameraPositionMatrix);
var cameraRotationMatrix = mat4.create();
mat4.identity(cameraRotationMatrix);

function handleMouseDown(event) {
    if (event.which === 1 || event.button === 1) {
        mouseLeftDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }
    if (event.which === 3 || event.button === 3) {
        mouseRightDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }
}

function handleMouseUp(event) {
    mouseRightDown = false;
    mouseLeftDown = false;
}

function handleMouseMove(event) {

    if (!mouseRightDown && !mouseLeftDown) {
        return;
    }

    if( mouseLeftDown){
        var newX = event.clientX;
        var newY = event.clientY;

        var moveX = newX - lastMouseX;
        var newPositionMatrix = mat4.create();
        mat4.identity(newPositionMatrix);
        mat4.translate(newPositionMatrix, [moveX / 25, 0, 0]);
        //mat4.rotate(newPositionMatrix, degToRad(deltaX / 10), [0, 1, 0]);

        var moveY = newY - lastMouseY;
        mat4.translate(newPositionMatrix, [0, -(moveY / 25), 0]);
        //mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

        mat4.multiply(newPositionMatrix, cameraPositionMatrix, cameraPositionMatrix);

        lastMouseX = newX
        lastMouseY = newY;
    }

    if( mouseRightDown){
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

        var deltaY = newY - lastMouseY;
        mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

        mat4.multiply(newRotationMatrix, cameraRotationMatrix, cameraRotationMatrix);

        lastMouseX = newX
        lastMouseY = newY;
    }
}


var redBg;
var greenBg;
var blueBg;

function initBuffers() {

    //GRID BACK

    //horizontal lines side
    gridBackHorizontalPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
    vertices = []
      for( var y = 0.0; y > -16; --y ){
        var x = 0.0;
        var z = 0.0;
        vertices = vertices.concat([
          x,        y,        z,
          (x + 10), y,        z,
        ]);
        }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gridBackHorizontalPositionBuffer.itemSize = 3;
    gridBackHorizontalPositionBuffer.numItems = 32; //plus one for every new row, for triangle hiding

    gridBackHorizontalColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
    colors = []
    for( var y = 0; y < 16; ++y ){
        colors = colors.concat([
          1.0, 1.0, 1.0, 1.0,
          1.0, 1.0, 1.0, 1.0,
          ]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gridBackHorizontalColorBuffer.itemSize = 4;
    gridBackHorizontalColorBuffer.numItems = 32;

    //vertical lines side
    gridBackVerticalPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
    vertices = []
      for( var x = 0.0; x < 11; ++x ){
        var y = 0.0;
        var z = 0.0;
        vertices = vertices.concat([
          x,        y,        z,
          x, (y - 15),        z,
        ]);
        }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gridBackVerticalPositionBuffer.itemSize = 3;
    gridBackVerticalPositionBuffer.numItems = 22; //plus one for every new row, for triangle hiding

    gridBackVerticalColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
    colors = []
    for( var x = 0; x < 11; ++x ){
        colors = colors.concat([
          1.0, 1.0, 1.0, 1.0,
          1.0, 1.0, 1.0, 1.0,
          ]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gridBackVerticalColorBuffer.itemSize = 4;
    gridBackVerticalColorBuffer.numItems = 22;

    //lines bottom
    gridBackBottomPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
    vertices = []
      for( var y = 0.0; y > -11; --y ){
        var x = 0.0;
        var z = 0.0;
        vertices = vertices.concat([
          x,        y,        z,
          (x + 10), y,        z,
        ]);
        }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gridBackBottomPositionBuffer.itemSize = 3;
    gridBackBottomPositionBuffer.numItems = 22; //plus one for every new row, for triangle hiding

    gridBackBottomColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
    colors = []
    for( var y = 0; y < 11; ++y ){
        colors = colors.concat([
          1.0, 1.0, 1.0, 1.0,
          1.0, 1.0, 1.0, 1.0,
          ]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gridBackBottomColorBuffer.itemSize = 4;
    gridBackBottomColorBuffer.numItems = 22;


    //BACKGROUND
    bgPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgPositionBuffer);
    vertices = [
         100.0,  100.0,  0.0,
        -100.0,  100.0,  0.0,
         100.0, -100.0,  0.0,
        -100.0, -100.0,  0.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    bgPositionBuffer.itemSize = 3;
    bgPositionBuffer.numItems = 4;

    bgColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgColorBuffer);
    colors = []
    for (var i = 0; i < 4; ++i) {
        colors = colors.concat([redBg, greenBg, blueBg, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    bgColorBuffer.itemSize = 4;
    bgColorBuffer.numItems = 4;

}


var perspectiveView = true;
var zoom = 1;
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if( perspectiveView ){
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    }else{
        mat4.ortho(pMatrix, -1.0, 1.0, -1.0, 1.0, 0.1, 100);
        console.log("orhto");
    }

    mat4.identity(mvMatrix);
    mat4.lookAt(mvMatrix, [20,0,0], [0, 0, 0], [0, 1, 0]);

    mvPushMatrix();

    mat4.translate(mvMatrix, [0, 0, -40]);

    //CAMERA (inverse world)
    mat4.scale(mvMatrix, [1/zoom,1/zoom,1/zoom]);
    mat4.multiply(mvMatrix, cameraPositionMatrix);
    mat4.multiply(mvMatrix, cameraRotationMatrix);

    //DRAW GRID BACK
    mat4.translate(mvMatrix, [0, 0, -5]);

    //--side I horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);

    mvPopMatrix();

    //--side I vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);

    mvPopMatrix();

    //--side II horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);

    mvPopMatrix();

    //--side II vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);

    mvPopMatrix();

    //--side III horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, -10]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);

    mvPopMatrix();

    //--side III vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, -10]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);

    mvPopMatrix();

    //--side IV horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 10]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);

    mvPopMatrix();

    //--side IV vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 10]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);

    mvPopMatrix();

    //--bottom vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, -8, 0]);

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);

    mvPopMatrix();

    //--bottom vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [-7, -8, 7]);

    mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);

    mvPopMatrix();

    //--top vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, 7, 0]);

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);

    mvPopMatrix();

    //--top vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [-7, 7, 7]);

    mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);

    mvPopMatrix();


    //pop general grid mvMatrix
    mvPopMatrix();


    //DRAW BACKGROUND
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, 0, -99]);

    gl.bindBuffer(gl.ARRAY_BUFFER, bgPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bgPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bgColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, bgColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, bgPositionBuffer.numItems);

    mvPopMatrix();


}


function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}




var tetrimonType;
//var tetrimonType = "one_x_four";
function typeOfCurrentTetrimon() {
    type = getRandomNumber(0,1);

    if( type == 0){
    //currentObject = new two_x_two();
    tetrimonType = "two_x_two";
    }

    if( type == 1){
    //currentObject = new one_x_four();
    tetrimonType = "one_x_four";
    }
}


function initGame() {
    redBg = Math.random();
    greenBg = Math.random();
    blueBg = Math.random();

    typeOfCurrentTetrimon();

}



var lastTime = 0;
function animate() {

  //gravity();

  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;

    //rotateObject( elapsed );

  }
  lastTime = timeNow;

}


var gameOver = false;
function tick() {
    if( !gameOver ){
        requestAnimFrame(tick);
        handleKeys();
        drawScene();
        animate();
    }else{
        window.alert("Game Over!");
    }
}


function webGLStart() {
    var canvas = document.getElementById("lesson03-canvas");
    initGL(canvas);
    initShaders();
    initGame();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}
