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

var rotateX_clockwise = false;
var rotateX_counterclock = false;
var rotateY_clockwise = false;
var rotateY_counterclock = false;
var rotateZ_clockwise = false;
var rotateZ_counterclock = false;
var falling = false;
var rotating = false;
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
        currentlyPressedKeys[80] = false;
        perspectiveView = !perspectiveView;
    }
    if ( currentlyPressedKeys[74] && !currentlyPressedKeys[16] ) {
        //j key
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(1), [1, 0, 0]);
        mat4.multiply(newRotationMatrix, cameraPositionMatrix, cameraPositionMatrix);
    }
    if ( currentlyPressedKeys[74] && currentlyPressedKeys[16] ) {
        //j key + shift
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(-1), [1, 0, 0]);
        mat4.multiply(newRotationMatrix, cameraPositionMatrix, cameraPositionMatrix);
    }
    if ( currentlyPressedKeys[75] && !currentlyPressedKeys[16] ) {
        //k key
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(1), [0, 1, 0]);
        mat4.multiply(newRotationMatrix, cameraPositionMatrix, cameraPositionMatrix);
    }
    if ( currentlyPressedKeys[75] && currentlyPressedKeys[16] ) {
        //k key + shift
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(-1), [0, 1, 0]);
        mat4.multiply(newRotationMatrix, cameraPositionMatrix, cameraPositionMatrix);
    }
    if ( currentlyPressedKeys[76] && !currentlyPressedKeys[16] ) {
        //l key
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(1), [0, 0, 1]);
        mat4.multiply(newRotationMatrix, cameraPositionMatrix, cameraPositionMatrix);
    }
    if ( currentlyPressedKeys[76] && currentlyPressedKeys[16] ) {
        //l key + shift
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(-1), [0, 0, 1]);
        mat4.multiply(newRotationMatrix, cameraPositionMatrix, cameraPositionMatrix);
    }
    if( !rotating ){
        if ( currentlyPressedKeys[88] && !currentlyPressedKeys[16] ){
            //x key
            rotateX_counterclock = true;
            rotating = true;
            currentlyPressedKeys[88] = false;
        }
        if ( currentlyPressedKeys[88] && currentlyPressedKeys[16] ){
            //x key + shift
            rotateX_clockwise = true;
            rotating = true;
            currentlyPressedKeys[88] = false;
        }
        if ( currentlyPressedKeys[89] && !currentlyPressedKeys[16] ){
            //y key
            rotateY_counterclock = true;
            rotating = true;
            currentlyPressedKeys[89] = false;
        }
        if ( currentlyPressedKeys[89] && currentlyPressedKeys[16] ){
            //y key + shift
            rotateY_clockwise = true;
            rotating = true;
            currentlyPressedKeys[89] = false;
        }
        if ( currentlyPressedKeys[90] && !currentlyPressedKeys[16] ){
            //z key
            rotateZ_counterclock = true;
            rotating = true;
            currentlyPressedKeys[90] = false;
        }
        if ( currentlyPressedKeys[90] && currentlyPressedKeys[16] ){
            //z key + shift
            rotateZ_clockwise = true;
            rotating = true;
            currentlyPressedKeys[90] = false;
        }
    }
}


var rotationTrace = 0;
var rotationSpeed = 5000;
var rotationXFixed = 0;
var rotationYFixed = 0;
var rotationZFixed = 0;
function rotateObject( timeElapsed ) {
    var change = degToRad( rotationSpeed );
    if ( rotationTrace <= 90 ){
       if ( rotateX_clockwise ){
         rotateX_tetrimon -= ( change * timeElapsed ) / 1000.0;
         rotationTrace += ( change * timeElapsed ) / 1000.0;
       }
       if ( rotateX_counterclock ){
         rotateX_tetrimon += ( change * timeElapsed ) / 1000.0;
         rotationTrace += ( change * timeElapsed ) / 1000.0;
       }
       if ( rotateY_clockwise ){
         rotateY_tetrimon -= ( change * timeElapsed ) / 1000.0;
         rotationTrace += ( change * timeElapsed ) / 1000.0;
       }
       if ( rotateY_counterclock ){
         rotateY_tetrimon += ( change * timeElapsed ) / 1000.0;
         rotationTrace += ( change * timeElapsed ) / 1000.0;
       }
       if ( rotateZ_clockwise ){
         rotateZ_tetrimon -= ( change * timeElapsed ) / 1000.0;
         rotationTrace += ( change * timeElapsed ) / 1000.0;
       }
       if ( rotateZ_counterclock ){
         rotateZ_tetrimon += ( change * timeElapsed ) / 1000.0;
         rotationTrace += ( change * timeElapsed ) / 1000.0;
       }
    }else{

      /*round
      if( rotate_tetrimon > 80 && rotate_tetrimon < 110 ) rotate_tetrimon = 90;
      if( rotate_tetrimon > 170 && rotate_tetrimon < 190 ) rotate_tetrimon = 180;
      if( rotate_tetrimon > 260 && rotate_tetrimon < 280 ) rotate_tetrimon = 270;
      if( rotate_tetrimon > 350 ) rotate_tetrimon = 0;
      if( rotate_tetrimon < -80 && rotate_tetrimon > -110 ) rotate_tetrimon = -90;
      if( rotate_tetrimon < -170 && rotate_tetrimon > -190 ) rotate_tetrimon = -180;
      if( rotate_tetrimon < -260 && rotate_tetrimon > -280 ) rotate_tetrimon = -270;
      if( rotate_tetrimon < -350 ) rotate_tetrimon = 0;
      if( rotate_tetrimon > -10 && rotate_tetrimon < 10 ) rotate_tetrimon = 0;
      */

      if( rotateX_clockwise ){
          if( rotationXFixed - 90 == -360 ) rotationXFixed = 0;
          else rotationXFixed -= 90;
      }
      if( rotateX_counterclock ) {
          if( rotationXFixed + 90 == 360 ) rotationXFixed = 0;
          else rotationXFixed += 90;
      }
      if( rotateY_clockwise ){
          if( rotationYFixed - 90 == -360 ) rotationYFixed = 0;
          else rotationYFixed -= 90;
      }
      if( rotateY_counterclock ) {
          if( rotationYFixed + 90 == 360 ) rotationYFixed = 0;
          else rotationYFixed += 90;
      }
      if( rotateZ_clockwise ){
          if( rotationZFixed - 90 == -360 ) rotationZFixed = 0;
          else rotationZFixed -= 90;
      }
      if( rotateZ_counterclock ) {
          if( rotationZFixed + 90 == 360 ) rotationZFixed = 0;
          else rotationZFixed += 90;
      }
      //console.log("rotation");
      //console.log( rotationFixed );
      //console.log( rotate_tetrimon );
      rotateX_tetrimon = rotationXFixed;
      rotateY_tetrimon = rotationYFixed;
      rotateZ_tetrimon = rotationZFixed;


      //currentObject.posRotateToGrid();
      //tetrimon_beforeRotation = rotateX_tetrimon;
      rotateX_clockwise = false;
      rotateX_counterclock = false;
      rotateY_clockwise = false;
      rotateY_counterclock = false;
      rotateZ_clockwise = false;
      rotateZ_counterclock = false;
      rotating = false;
      rotationTrace = 0;

      //console.log( "rotation: ", rotate_tetrimon );
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


var rotXTrace = 0;
var rotYTrace = 0;
function handleMouseMove(event) {

    if (!mouseRightDown && !mouseLeftDown) {
        return;
    }

    if( mouseRightDown){
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

    if( mouseLeftDown){
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);
        rotYTrace += (deltaX / 10);
        if( rotYTrace > 360 ) rotYTrace = 0;
        if( rotYTrace < 0 )rotYTrace = 360;

        var deltaY = newY - lastMouseY;
        mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);
        rotXTrace += (deltaY / 10);
        if( rotXTrace > 360 ) rotXTrace = 0;
        if( rotXTrace < 0 )rotXTrace = 360;

        mat4.multiply(newRotationMatrix, cameraRotationMatrix, cameraRotationMatrix);

        lastMouseX = newX
        lastMouseY = newY;

        //console.log( rotXTrace, rotYTrace );
    }
}


var redBg;
var greenBg;
var blueBg;

function initBuffers() {

    //TWO X TWO

    two_x_twoVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexPositionBuffer);
    vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    two_x_twoVertexPositionBuffer.itemSize = 3;
    two_x_twoVertexPositionBuffer.numItems = 24;

    two_x_twoVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexColorBuffer);
    var red = Math.random();
    var green = Math.random();
    var blue = Math.random();
    colors = [
        [red, green, blue, 1.0], // Front face
        [red, green, blue, 1.0], // Back face
        [red, green, blue, 1.0], // Top face
        [red, green, blue, 1.0], // Bottom face
        [red, green, blue, 1.0], // Right face
        [red, green, blue, 1.0]  // Left face
    ];

    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    two_x_twoVertexColorBuffer.itemSize = 4;
    two_x_twoVertexColorBuffer.numItems = 24;

    two_x_twoVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, two_x_twoVertexIndexBuffer);
    var two_x_twoVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(two_x_twoVertexIndices), gl.STATIC_DRAW);
    two_x_twoVertexIndexBuffer.itemSize = 1;
    two_x_twoVertexIndexBuffer.numItems = 36;


    //ONE X FOUR

    one_x_fourVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexPositionBuffer);
    vertices = [
        // Front face
        -2.0, -0.5,  0.5,
         2.0, -0.5,  0.5,
         2.0,  0.5,  0.5,
        -2.0,  0.5,  0.5,

        // Back face
        -2.0, -0.5, -0.5,
        -2.0,  0.5, -0.5,
         2.0,  0.5, -0.5,
         2.0, -0.5, -0.5,

        // Top face
        -2.0,  0.5, -0.5,
        -2.0,  0.5,  0.5,
         2.0,  0.5,  0.5,
         2.0,  0.5, -0.5,

        // Bottom face
        -2.0, -0.5, -0.5,
         2.0, -0.5, -0.5,
         2.0, -0.5,  0.5,
        -2.0, -0.5,  0.5,

        // Right face
         2.0, -0.5, -0.5,
         2.0,  0.5, -0.5,
         2.0,  0.5,  0.5,
         2.0, -0.5,  0.5,

        // Left face
        -2.0, -0.5, -0.5,
        -2.0, -0.5,  0.5,
        -2.0,  0.5,  0.5,
        -2.0,  0.5, -0.5
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    one_x_fourVertexPositionBuffer.itemSize = 3;
    one_x_fourVertexPositionBuffer.numItems = 24;

    one_x_fourVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexColorBuffer);
    var red = Math.random();
    var green = Math.random();
    var blue = Math.random();
    colors = [
        [red, green, blue, 1.0], // Front face
        [red, green, blue, 1.0], // Back face
        [red, green, blue, 1.0], // Top face
        [red, green, blue, 1.0], // Bottom face
        [red, green, blue, 1.0], // Right face
        [red, green, blue, 1.0]  // Left face
    ];

    var unpackedColors = [];
    for (var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    one_x_fourVertexColorBuffer.itemSize = 4;
    one_x_fourVertexColorBuffer.numItems = 24;

    one_x_fourVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, one_x_fourVertexIndexBuffer);
    var one_x_fourVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(one_x_fourVertexIndices), gl.STATIC_DRAW);
    one_x_fourVertexIndexBuffer.itemSize = 1;
    one_x_fourVertexIndexBuffer.numItems = 36;


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
         200.0,  200.0,  0.0,
        -200.0,  200.0,  0.0,
         200.0, -200.0,  0.0,
        -200.0, -200.0,  0.0
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
var rotateX_tetrimon = 0;
var rotateY_tetrimon = 0;
var rotateZ_tetrimon = 0;
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



    if( perspectiveView ){
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    }else{
                    //left, right, bottom, top
        mat4.ortho( -(gl.viewportWidth/50), (gl.viewportWidth/50), -(gl.viewportHeight/50), (gl.viewportHeight/50), 0.1, 100, pMatrix);
    }

    mat4.identity(mvMatrix);
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, -0.5, -40]);

    //CAMERA (inverse world)
    mat4.scale(mvMatrix, [1/zoom,1/zoom,1/zoom]);
    mat4.multiply(mvMatrix, cameraPositionMatrix);
    mat4.multiply(mvMatrix, cameraRotationMatrix);

    //START ROTATION
    mat4.multiply(mvMatrix, rotYStart);
    mat4.multiply(mvMatrix, rotXStart);


    //DRAW TWO X TWO
    if( tetrimonType === "two_x_two" ){
        mvPushMatrix();
        mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
        mat4.translate(mvMatrix, [0, 6, -3.9]);

        gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, two_x_twoVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, two_x_twoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, two_x_twoVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, two_x_twoVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        mvPopMatrix();
    }


    //DRAW ONE X FOUR
    if( tetrimonType === "one_x_four" ){
        mvPushMatrix();
        mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
        mat4.translate(mvMatrix, [0, 3, -5]);

        mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon), [1, 0, 0]);
        mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon), [0, 1, 0]);
        mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon), [0, 0, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, one_x_fourVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, one_x_fourVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, one_x_fourVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, one_x_fourVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        mvPopMatrix();
    }


    //DRAW GRID BACK
    mat4.translate(mvMatrix, [0, 0, -7]);
/*
    if(

      //x-axis between -90 and 90
      ( rotXTrace >= 0 && rotXTrace <= 90 || rotXTrace >= 270 && rotXTrace <= 360 )
      &&
      ( rotYTrace >= 0 && rotYTrace <= 45 || rotYTrace >= 225 && rotYTrace <= 360 )
      ||

      //x-axis not between -90 and 90, so hiding the side for y-axis rot works inverse
      ( rotXTrace >= 90 && rotXTrace <= 270 )
      &&
      ( rotYTrace >= 0 && rotYTrace <= 135 || rotYTrace >= 315 && rotYTrace <= 360 )

    ){*/

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
    //}// end if

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
/*
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
*/
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
/*
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
*/

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
//var tetrimonType = "two_x_two";
function typeOfCurrentTetrimon() {
    type = getRandomNumber(0,1);
    type = 1;

    if( type === 0){
    //currentObject = new two_x_two();
    tetrimonType = "two_x_two";
    }

    if( type === 1){
    //currentObject = new one_x_four();
    tetrimonType = "one_x_four";
    }
}

var rotYStart = mat4.create();
var rotXStart = mat4.create();
function initGame() {
    redBg = Math.random();
    greenBg = Math.random();
    blueBg = Math.random();

    typeOfCurrentTetrimon();

    //Rotation at the beginning of the game
    mat4.identity(rotXStart);
    mat4.identity(rotYStart);
    mat4.rotate(rotXStart, degToRad(0), [1, 0, 0]);
    mat4.rotate(rotYStart, degToRad(0), [0, 1, 0]);

}



var lastTime = 0;
function animate() {

  //gravity();

  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;

    rotateObject( elapsed );

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
        //window.alert("Game Over!");
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
