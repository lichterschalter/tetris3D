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

var rotate_clockwise = false;
var rotate_counterclock = false;

function handleKeys() {
    if (currentlyPressedKeys[49] && !rotate_clockwise) {
        // Number One
        rotate_counterclock = true;
        currentlyPressedKeys[49] = false;
    }
    if (currentlyPressedKeys[51] && !rotate_counterclock) {
        // Number Three
        rotate_clockwise = true;
        currentlyPressedKeys[51] = false;
    }
    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
        // Left cursor key or a
        positionX_four_x_four -= 1;
        currentlyPressedKeys[37] = false;
        currentlyPressedKeys[65] = false;
    }
    if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
        // Right cursor key or d
        positionX_four_x_four += 1;
        currentlyPressedKeys[39] = false;
        currentlyPressedKeys[68] = false;
    }
    if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
        // Up cursor key or w
        positionY_four_x_four += 1;
        currentlyPressedKeys[38] = false;
        currentlyPressedKeys[87] = false;
    }
    if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
        // Down cursor key or s
        positionY_four_x_four -= 1;
        currentlyPressedKeys[40] = false;
        currentlyPressedKeys[83] = false;
    }
}

var rotationTrace = 0;
function rotateObject() {
    var change = degToRad( 45 );
    if ( rotationTrace <= 90 ){
       if ( rotate_clockwise ){
         rotate_four_x_four += change;
         rotationTrace += change;
       }
       if ( rotate_counterclock ){
         rotate_four_x_four -= change;
         rotationTrace += change;
       }
    }else{
      rotate_clockwise = false;
      rotate_counterclock = false;
      rotationTrace = 0;
      rotate_four_x_four = Math.round( rotate_four_x_four);
    }
}

var one_x_fourVertexPositionBuffer;
var one_x_fourVertexColorBuffer;
var four_x_fourPositionBuffer;
var four_x_fourColorBuffer;


function initBuffers() {

    //ONE X FOUR OBJECT
    one_x_fourVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexPositionBuffer);
    var vertices = [
        0.5,  2.0,  0.0,
       -0.5,  2.0,  0.0,
        0.5, -2.0,  0.0,
       -0.5, -2.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    one_x_fourVertexPositionBuffer.itemSize = 3;
    one_x_fourVertexPositionBuffer.numItems = 4;

    one_x_fourVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexColorBuffer);
    var red = Math.random();
    var green = Math.random();
    var blue = Math.random();
    colors = []
    for (var i=0; i < 4; i++) {
        colors = colors.concat([red, green, blue, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    one_x_fourVertexColorBuffer.itemSize = 4;
    one_x_fourVertexColorBuffer.numItems = 4;


    //FOUR X FOUR OBJECT
    four_x_fourPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, four_x_fourPositionBuffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    four_x_fourPositionBuffer.itemSize = 3;
    four_x_fourPositionBuffer.numItems = 4;

    four_x_fourColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, four_x_fourColorBuffer);
    var red = Math.random();
    var green = Math.random();
    var blue = Math.random();
    colors = []
    for (var i=0; i < 4; i++) {
        colors = colors.concat([red, green, blue, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    four_x_fourColorBuffer.itemSize = 4;
    four_x_fourColorBuffer.numItems = 4;


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
    var red = Math.random();
    var green = Math.random();
    var blue = Math.random();
    colors = []
    for (var i=0; i < 4; i++) {
        colors = colors.concat([red, green, blue, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    bgColorBuffer.itemSize = 4;
    bgColorBuffer.numItems = 4;
}



var rotate_one_x_four = 0;
var rotate_four_x_four = 0;
var positionX_one_x_four = -1.0;
var positionY_one_x_four = 0.0;
var positionZ_one_x_four = -7.0;
var positionX_four_x_four = 2.5;
var positionY_four_x_four = 0.0;
var positionZ_four_x_four = 0.0;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    rotateObject();


    //DRAW ONE X FOUR
    mat4.translate(mvMatrix, [positionX_one_x_four, positionY_one_x_four, positionZ_one_x_four]);

    mvPushMatrix();
    mat4.rotate(mvMatrix, degToRad(rotate_one_x_four), [0, 0, 1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, one_x_fourVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, one_x_fourVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, one_x_fourVertexPositionBuffer.numItems);
    mvPopMatrix();


    //DRAW FOUR X FOUR
    mat4.translate(mvMatrix, [positionX_four_x_four, positionY_four_x_four, positionZ_four_x_four]);

    mvPushMatrix();
    mat4.rotate(mvMatrix, degToRad(rotate_four_x_four), [0, 0, 1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, four_x_fourPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, four_x_fourPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, four_x_fourColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, four_x_fourColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, four_x_fourPositionBuffer.numItems);

    mvPopMatrix();


    //DRAW BACKGROUND
    mat4.translate(mvMatrix, [0, 0, -10]);

    mvPushMatrix();

    gl.bindBuffer(gl.ARRAY_BUFFER, bgPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bgPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bgColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, bgColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, bgPositionBuffer.numItems);

    mvPopMatrix();
}


var lastTime = 0;

function animate() {
  /*
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        rotate_one_x_four += (90 * elapsed) / 1000.0;
        rotate_four_x_four += (75 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
  */
}


function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    animate();
}


function webGLStart() {
    var canvas = document.getElementById("lesson03-canvas");
    initGL(canvas);
    initShaders()
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}
