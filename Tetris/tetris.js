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
    if (currentlyPressedKeys[49] && !rotate_counterclock) {
        // Number One
        rotate_clockwise = true;
        currentlyPressedKeys[49] = false;
    }
    if (currentlyPressedKeys[51] && !rotate_clockwise) {
        // Number Three
        rotate_counterclock = true;
        currentlyPressedKeys[51] = false;
    }
    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
        // Left cursor key or a
        positionX_tetrimon -= 1;
        currentlyPressedKeys[37] = false;
        currentlyPressedKeys[65] = false;
    }
    if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
        // Right cursor key or d
        positionX_tetrimon += 1;
        currentlyPressedKeys[39] = false;
        currentlyPressedKeys[68] = false;
    }
    if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
        // Up cursor key or w
        gravityIsOn = false;
        //positionY_tetrimon += 1;
        currentlyPressedKeys[38] = false;
        currentlyPressedKeys[87] = false;
    }
    if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
        // Down cursor key or s
        gravityIsOn = true;
        //positionY_tetrimon -= 1;
        timeElapsed = new Date().getSeconds();
        currentlyPressedKeys[40] = false;
        currentlyPressedKeys[83] = false;
    }
}


var rotationTrace = 0;
var rotationSpeed = 85;
function rotateObject() {
    var change = degToRad( rotationSpeed );
    if ( rotationTrace <= 90 ){
       if ( rotate_clockwise ){
         rotate_tetrimon += change;
         rotationTrace += change;
       }
       if ( rotate_counterclock ){
         rotate_tetrimon -= change;
         rotationTrace += change;
       }
    }else{
      rotate_clockwise = false;
      rotate_counterclock = false;
      rotationTrace = 0;
      rotate_tetrimon = Math.round( rotate_tetrimon );
    }
}


var gravityIsOn = false;
var gravitySpeed = 0.5;
var timeElapsed = new Date().getSeconds();

function gravity() {
  if( gravityIsOn ){
    var timeNow = new Date().getSeconds();
    gravitySpeed -= ( timeNow - timeElapsed );
    timeElapsed = timeNow;
    //console.log( timeElapsed, timeNow, gravitySpeed );
    if ( gravitySpeed <= 0 || gravitySpeed > 0.5){
        if( currentObject.checkIfBottomOccupied() ){
            //implement handle collision here
            console.log("collision");
            makeNewTetrimon();
        }else{
          currentObject.moveObjectGravity();
          positionY_tetrimon -= 1;
          gravitySpeed = 0.5;
        }
    }
  }
}


function gridArray() {
    //create grid array
    this.blocks = new Array(16); //y-axis; last row is bottom and always occupied, but invisible
    for ( var i = 0; i < this.blocks.length; ++i ){
        this.blocks[ i ] = new Array(10);
        for ( var j = 0; j < this.blocks[ i ].length; ++j ){ //x-axis
            this.blocks[ i ][ j ] = [ 0.0, 0.0, 0.0, 1.0, false ];
            //this.blocks[ i ][ j ] = false;
            if( i == 0 && j == 1 ) this.blocks[ i ][ j ] = [ 1.0, 0.0, 0.0, 1.0, false ];
            if( i == 0 && j == 2 ) this.blocks[ i ][ j ] = [ 0.0, 1.0, 0.0, 1.0, false ];
            if( i == 7 && j == 4 ) this.blocks[ i ][ j ] = [ 0.0, 0.0, 1.0, 1.0, false ];

        }
    }

    //make all bottom blocks true
    for ( var j = 0; j < this.blocks[ 15 ].length; ++j ){
        this.blocks[ 15 ][ j ] = [ 0.0, 0.0, 1.0, 1.0, true ];
    }

    this.getInfo = function() {
        for ( var i = 0; i < this.blocks.length; ++i ){
            console.log(
              i + ": " +
              "|" +
              this.blocks[ i ][ 0 ].toString() + " | " +
              this.blocks[ i ][ 1 ].toString() + " | " +
              this.blocks[ i ][ 2 ].toString() + " | " +
              this.blocks[ i ][ 3 ].toString() + " | " +
              this.blocks[ i ][ 4 ].toString() + " | " +
              this.blocks[ i ][ 5 ].toString() + " | " +
              this.blocks[ i ][ 6 ].toString() + " | " +
              this.blocks[ i ][ 7 ].toString() + " | " +
              this.blocks[ i ][ 8 ].toString() + " | " +
              this.blocks[ i ][ 9 ].toString() + " | "
            );
        }
        console.log();
    }

    this.setBlock = function( i, j, content ) {
        this.blocks[ i ][ j ] = content;
    }

    this.setBlockOccupied = function( i, j, occupied ){
        this.blocks[ i ][ j ][ 4 ] = occupied;
    }

    this.getBlock = function( x, y, color ){
        return this.blocks[ x ][ y ][ color ];
    }
}


function makeNewTetrimon() {
    gravityIsOn = false;
}


function one_x_four() {
    this.objectGridPosition = [
        0, 3,
        0, 4,
        0, 5,
        0, 6
      ];

    this.initObject = function() {
        for ( var i = 0; i < 8; ++i ){
            grid.setBlockOccupied( this.objectGridPosition[ i ], this.objectGridPosition[ i + 1 ], true );
            ++i;
        }
        grid.getInfo();
    }

    this.checkIfBottomOccupied = function() {
        var occupied = false;
        for ( var i = 0; i < 8; ++i ){
            occupiedOneBlock = grid.getBlock( ( this.objectGridPosition[ i ] + 1 ), this.objectGridPosition[ i + 1 ], 4 );
            //console.log( (this.objectGridPosition[ i ] + 1), this.objectGridPosition[ i + 1], "!!!!");
            ++i;
            if( occupiedOneBlock == true ) occupied = true;
        }
        console.log(occupied);
        return occupied;
    }

    this.moveObjectGravity = function() {
      for ( var i = 0; i < 8; ++i ){
          grid.setBlockOccupied( ( this.objectGridPosition[ i ] ), this.objectGridPosition[ i + 1 ], false );
          oldGridPos = this.objectGridPosition[ i ];
          this.objectGridPosition[ i ] = oldGridPos + 1;
          grid.setBlockOccupied( ( this.objectGridPosition[ i ] ), this.objectGridPosition[ i + 1 ], true );
          grid.getInfo();
          ++i;
      }
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
        0.0, -2.0,  0.0,
        1.0, -2.0,  0.0,
        0.0,  2.0,  0.0,
        1.0,  2.0,  0.0
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
    red = Math.random();
    green = Math.random();
    blue = Math.random();
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
    red = Math.random();
    green = Math.random();
    blue = Math.random();
    colors = []
    for (var i = 0; i < 4; ++i) {
        colors = colors.concat([red, green, blue, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    bgColorBuffer.itemSize = 4;
    bgColorBuffer.numItems = 4;


    //GRID BLOCKS one (from top to bottom)
    gridBlocksOnePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBlocksOnePositionBuffer);
    vertices = []
      for( var y = 0.0; y > -15; --y ){
        var z = 0.0;
        for( var x = 0.0; x < 10; ++x ){
            vertices = vertices.concat([
              x,        y,        z,
              x,        (y + 1),  z,
              (x + 1),  y,        z,
              (x + 1),  (y + 1),  z,
            ]);
            //the next if-statement prevents drawing a triangle from the end of the row
            //to the beginning of the next row by drawing it behind the current row
            if( x == 9 ) vertices = vertices.concat([ x - 9, y + 1, z - 0.1,]);
          }
        }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gridBlocksOnePositionBuffer.itemSize = 3;
    gridBlocksOnePositionBuffer.numItems = 614; //plus one for every new row, for triangle hiding

    gridBlocksOneColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBlocksOneColorBuffer);
    colors = []
    for( var y = 0; y < 15; ++y ){
      for( var x = 0; x < 10; ++x ){
        for( var fourVertices = 0; fourVertices < 4; ++fourVertices){
          colors = colors.concat([
          grid.getBlock(y,x,0),
          grid.getBlock(y,x,1),
          grid.getBlock(y,x,2),
          grid.getBlock(y,x,3),
          ]);
        }
        //the next if-statement prevents drawing a triangle from the end of the row
        //to the beginning of the next row by drawing it behind the current row
        if( x == 9 ) {
          colors = colors.concat([
          grid.getBlock(y,x,0),
          grid.getBlock(y,x,1),
          grid.getBlock(y,x,2),
          grid.getBlock(y,x,3),
          ]);
        }
      }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gridBlocksOneColorBuffer.itemSize = 4;
    gridBlocksOneColorBuffer.numItems = 120;
}


var rotate_tetrimon = 90;
var positionX_tetrimon = 5.0;
var positionY_tetrimon = 6.5;
var positionZ_tetrimon = -20.0;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    //not shure if this is a good part for this code snippet
    rotateObject();
    gravity();


    //DRAW ONE X FOUR
    if ( tetrimonType == "one_x_four"){
        mvPushMatrix();

        mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

        mat4.rotate(mvMatrix, degToRad(rotate_tetrimon), [0, 0, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, one_x_fourVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, one_x_fourVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, one_x_fourVertexPositionBuffer.numItems);

        mvPopMatrix();
    }


    //DRAW FOUR X FOUR
    if ( tetrimonType == "four_x_four"){
        mvPushMatrix();

        mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

        mat4.rotate(mvMatrix, degToRad(rotate_tetrimon), [0, 0, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, four_x_fourPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, four_x_fourPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, four_x_fourColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, four_x_fourColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, four_x_fourPositionBuffer.numItems);

        mvPopMatrix();
    }


    //DRAW BACKGROUND
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, 0, -30.1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, bgPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bgPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bgColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, bgColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, bgPositionBuffer.numItems);

    mvPopMatrix();


    //DRAW GRID ARRAY Part one (top down)

    mvPushMatrix();

    mat4.translate(mvMatrix, [ 0.0, 6.5, -20.01]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBlocksOnePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBlocksOnePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gridBlocksOneColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBlocksOneColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, gridBlocksOnePositionBuffer.numItems);

    mvPopMatrix();

}


var tetrimonType = "one_x_four";
function typeOfCurrentTetrimon() {
    //implement random finding of the type
    return tetrimonType;
}


function initGame() {
    grid = new gridArray();
    grid.getInfo();

    currentObject = new one_x_four();
    currentObject.initObject();
}


/*
var lastTime = 0;
function animate( notTimeSensitiveAnim ) {

  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;
    return ( (notTimeSensitiveAnim * elapsed) / 1000.0 );
  }
  lastTime = timeNow;
  return notTimeSensitiveAnim;

}
*/

function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    //animate();
}


function webGLStart() {
    var canvas = document.getElementById("lesson03-canvas");
    initGL(canvas);
    initShaders();
    initGame();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}
