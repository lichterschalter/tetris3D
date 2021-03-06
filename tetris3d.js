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
var showGridArray = false;
var showSpheres = false;
function handleKeys() {
    if ( currentlyPressedKeys[83] && currentlyPressedKeys[16] ) {
        //s key + shift
        zoom += 0.05;
    }
    if ( currentlyPressedKeys[83] && !currentlyPressedKeys[16] ) {
        //s key
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
    }//end if rotating
    if (currentlyPressedKeys[39] || currentlyPressedKeys[54]) {
        // Right key or 6
        //currentObject.moveObjectRight();
        positionZ_tetrimon += 1;
        currentlyPressedKeys[39] = false;
        currentlyPressedKeys[54] = false;
    }
    if (currentlyPressedKeys[37] || currentlyPressedKeys[52]) {
        // Left key or 4
        //currentObject.moveObjectLeft();
        positionZ_tetrimon -= 1;
        currentlyPressedKeys[37] = false;
        currentlyPressedKeys[52] = false;
    }
    if (currentlyPressedKeys[38] || currentlyPressedKeys[56]) {
        // Up key or 8
        //switchGravityOff();
        //falling = false;
        positionX_tetrimon -= 1;
        currentlyPressedKeys[38] = false;
        currentlyPressedKeys[56] = false;
    }
    if (currentlyPressedKeys[40] || currentlyPressedKeys[50]) {
        // Down key or 2
        //switchGravityOff();
        //falling = false;
        positionX_tetrimon += 1;
        currentlyPressedKeys[40] = false;
        currentlyPressedKeys[50] = false;
    }
    if ( currentlyPressedKeys[32] && !falling  ) {
        /*// Spacebar
        if( !gravityIsOn ){
            switchGravityOn();
            gravitySpeed = 0.0;
        }else{
            currentObject.dropTetrimon();
        }
        //positionY_tetrimon -= 1;
        currentlyPressedKeys[32] = false;*/
    }
    if ( currentlyPressedKeys[13] ) {
        //enter
        if( gravityIsOn ) switchGravityOff();
        else switchGravityOn();
        currentlyPressedKeys[13] = false;
    }
    if ( currentlyPressedKeys[71] ){
        //g key
        showGridArray = !showGridArray;
        currentlyPressedKeys[71] = false;
    }
    if ( currentlyPressedKeys[66] ){
        //b key
        showSpheres = !showSpheres;
        currentlyPressedKeys[66] = false;
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

      console.log( "--rotation-- |x: " + rotateX_tetrimon + "| |y: " + rotateY_tetrimon + "| |z: " + rotateZ_tetrimon + "|");
    }
}


var gravityIsOn = false;
function switchGravityOn() {
    gravityIsOn = true;
    setGravitySpeed();
    gravityTimeElapsed = ( new Date().getTime() / 1000 );
}


function switchGravityOff() {
    gravityIsOn = false;
}


var gravSpeed = 1.0;
function setGravitySpeed( speed ) {
    if( speed != undefined) gravitySpeed = speed;
    else gravitySpeed = gravSpeed;
}


var gravitySpeed;
var gravityTimeElapsed = ( new Date().getTime() / 1000 );
function gravity() {
  if( gravityIsOn ){
    var timeNow = ( new Date().getTime() / 1000 );
    gravitySpeed -= ( timeNow - gravityTimeElapsed );
    gravityTimeElapsed = timeNow;
    if ( gravitySpeed <= 0 ){
        /*if( currentObject.checkIfBottomOccupied() ){
            //console.log("collision");
            checkIfRowFull();
            makeNewTetrimon();
            setGravitySpeed();*/
        //}else{
            //currentObject.moveObjectGravity();
            positionY_tetrimon -= 1;
            setGravitySpeed();
            //grid.getInfoOccupation();
        //}
    }
  }
}


function gridArray() {
    //create grid array
    this.blocks = new Array(16); //y-axis; last row is bottom and always occupied, but invisible
    for ( var i = 0; i < this.blocks.length; ++i ){
        this.blocks[ i ] = new Array(10);
        for ( var j = 0; j < this.blocks[ i ].length; ++j ){ //x-axis
            this.blocks[ i ][ j ] = new Array(10);
            for ( var k = 0; k < this.blocks[ i ][ j ].length; ++k ){
                this.blocks[ i ][ j ][ k ] = [ redBg, greenBg, blueBg, 1.0, false ];
                //this.blocks[ i ][ j ] = false;
                //if( i == 3 && j == 2 ) this.blocks[ i ][ j ] = [ 1.0, 0.0, 0.0, 1.0, true ];
                //if( i == 1 && j == 1 ) this.blocks[ i ][ j ] = [ 0.0, 1.0, 0.0, 1.0, true ];
                //if( i == 7 && j == 4 ) this.blocks[ i ][ j ] = [ 0.0, 0.0, 1.0, 1.0, true ];
            }
        }
    }

    //make all bottom blocks true
    for ( var j = 0; j < this.blocks[ 15 ].length; ++j ){
        for ( var k = 0; k < this.blocks[ 15 ][ j ].length; ++k ){
            this.blocks[ 15 ][ j ][ k ] = [ 0.0, 0.0, 0.0, 1.0, true ];
        }
    }

    this.getInfo = function() {
        for ( var i = 0; i < this.blocks.length; ++i ){
            for ( var j = 0; j < this.blocks[ i ].length; ++j ){
                console.log(
                  i + ": " +
                  "|" +
                  this.blocks[ i ][ j ][ 0 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 1 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 2 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 3 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 4 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 5 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 6 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 7 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 8 ].toString() + " | " +
                  this.blocks[ i ][ j ][ 9 ].toString() + " | "
                );
            }
            console.log();
        }
    }

    this.getInfoOccupation = function( sliceFrom, sliceTo ) {
      if( sliceFrom >= sliceTo ){
          var x = sliceFrom;
          sliceFrom = sliceTo;
          sliceTo = x;
      }

      if( sliceFrom === undefined && sliceTo === undefined ){
          for ( var i = 0; i < this.blocks.length; ++i ){
              console.log( "Slice: " + i);
              for ( var j = 0; j < this.blocks[ i ].length; ++j ){
                  console.log(
                    j + ": " +
                    "|" +
                    this.blocks[ i ][ j ][ 0 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 1 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 2 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 3 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 4 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 5 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 6 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 7 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 8 ][ 4 ].toString() + " | " +
                    this.blocks[ i ][ j ][ 9 ][ 4 ].toString() + " | "
                  );
              }
              console.log();
          }
      }//end if

      if( sliceFrom !== undefined && sliceTo === undefined ){
          console.log( "Slice: " + sliceFrom );
          for ( var i = 0; i < this.blocks[ sliceFrom ].length; ++i ){
              console.log(
                i + ": " +
                "|" +
                this.blocks[ sliceFrom ][ i ][ 0 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 1 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 2 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 3 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 4 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 5 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 6 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 7 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 8 ][ 4 ].toString() + " | " +
                this.blocks[ sliceFrom ][ i ][ 9 ][ 4 ].toString() + " | "
              );
          }
          console.log();
      }//end if

      if( sliceFrom !== undefined && sliceTo !== undefined ){
          var amountOfSlices = sliceTo - sliceFrom;
          for ( ; amountOfSlices >= 0; --amountOfSlices ){
              console.log( "Slice: " + sliceFrom );
              for( var i = 0; i < 10; ++i ){
                  console.log(
                    i + ": " +
                    "|" +
                    this.blocks[ sliceFrom ][ i ][ 0 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 1 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 2 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 3 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 4 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 5 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 6 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 7 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 8 ][ 4 ].toString() + " | " +
                    this.blocks[ sliceFrom ][ i ][ 9 ][ 4 ].toString() + " | "
                  );
              }
              ++sliceFrom;
              console.log();
          }
      }//end if


    }

    this.setBlock = function( i, j, k, content ) {
        this.blocks[ i ][ j ][ k ] = content;
    }

    this.setBlockOccupied = function( i, j, k, occupied ){
        this.blocks[ i ][ j ][ k ][ 4 ] = occupied;
    }

    this.getBlock = function( x, y, z, color ){
        return this.blocks[ x ][ y ][ z ][ color ];
    }

    this.getSlice = function( slice ){
        return this.blocks[ slice ];
    }

    this.getRow = function( slice, row ){
        return this.blocks[ slice ][ row ];
    }

    this.setSlice = function( slice, content ){
        this.blocks[ slice ] = content;
    }

    this.setRow = function( slice, row, content ){
        this.blocks[ slice ][ row ] = content;
    }
}


var redBg;
var greenBg;
var blueBg;
var redTwo_x_two;
var blueTwo_x_two;
var greenTwo_x_two;
var redOne_x_four;
var blueOne_x_four;
var greenOne_x_four;
var redlTetrimon;
var bluelTetrimon;
var greenlTetrimon;
var redthreeSideTetrimon;
var bluethreeSideTetrimon;
var greenthreeSideTetrimon;
var redzTetrimon;
var bluezTetrimon;
var greenzTetrimon;
var redTowerLeft;
var bluezTowerLeft;
var greenzTowerLeft;
var redTowerRight;
var blueTowerRight;
var greenTowerRight;
var redzTripod;
var bluezTripod;
var greenzTripod;
function initBuffers() {

  //COLOR OF THE TETRIMONS
  redTwo_x_two = Math.random();
  greenTwo_x_two = Math.random();
  blueTwo_x_two = Math.random();
  redOne_x_four = Math.random();
  greenOne_x_four = Math.random();
  blueOne_x_four = Math.random();
  redlTetrimon = Math.random();
  bluelTetrimon = Math.random();
  greenlTetrimon = Math.random();
  redthreeSideTetrimon = Math.random();
  bluethreeSideTetrimon = Math.random();
  greenthreeSideTetrimon = Math.random();
  redzTetrimon = Math.random();
  bluezTetrimon = Math.random();
  greenzTetrimon = Math.random();
  redTowerLeft = Math.random();
  blueTowerLeft = Math.random();
  greenTowerLeft = Math.random();
  redTowerRight = Math.random();
  blueTowerRight = Math.random();
  greenTowerRight = Math.random();
  redTripod = Math.random();
  blueTripod = Math.random();
  greenTripod = Math.random();

  //SPHERE
  var latitudeBands = 30;
  var longitudeBands = 30;
  var radius = 0.5;

  var vertexPositionData = [];
  for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
          var phi = longNumber * 2 * Math.PI / longitudeBands;
          var sinPhi = Math.sin(phi);
          var cosPhi = Math.cos(phi);

          var x = cosPhi * sinTheta;
          var y = cosTheta;
          var z = sinPhi * sinTheta;

          vertexPositionData.push(radius * x);
          vertexPositionData.push(radius * y);
          vertexPositionData.push(radius * z);
      }
  }

  var indexData = [];
  for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
          var first = (latNumber * (longitudeBands + 1)) + longNumber;
          var second = first + longitudeBands + 1;
          indexData.push(first);
          indexData.push(second);
          indexData.push(first + 1);

          indexData.push(second);
          indexData.push(second + 1);
          indexData.push(first + 1);
      }
  }

  moonVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  moonVertexPositionBuffer.itemSize = 3;
  moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

  moonVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
  moonVertexIndexBuffer.itemSize = 1;
  moonVertexIndexBuffer.numItems = indexData.length;

  if( tetrimonType === "two_x_two" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redTwo_x_two, greenTwo_x_two, blueTwo_x_two, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }
  if( tetrimonType === "one_x_four" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redOne_x_four, greenOne_x_four, blueOne_x_four, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }
  if( tetrimonType === "lTetrimon" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redlTetrimon, greenlTetrimon, bluelTetrimon, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }
  if( tetrimonType === "threeSideTetrimon" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redthreeSideTetrimon, greenthreeSideTetrimon, bluethreeSideTetrimon, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }
  if( tetrimonType === "zTetrimon" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redzTetrimon, greenzTetrimon, bluezTetrimon, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }
  if( tetrimonType === "TowerLeft" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redTowerLeft, greenTowerLeft, blueTowerLeft, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }
  if( tetrimonType === "TowerRight" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redTowerRight, greenTowerRight, blueTowerRight, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }
  if( tetrimonType === "Tripod" ){
      moonColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
      colors = []
      for ( var i = 0; i < (vertexPositionData.length / 3); i++ ) {
          colors = colors.concat([redTripod, greenTripod, blueTripod, 1.0]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      moonColorBuffer.itemSize = 4;
      moonColorBuffer.numItems = vertexPositionData.length / 3;
  }


  //TWO X TWO

  two_x_twoVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexPositionBuffer);
  var vertices = [];
  for( var i = 0; i < 4; ++i ){
    if( i === 0 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 1 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 2 ){
      var tetBlockX =  1.0;
      var tetBlockY = -1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 3 ){
      var tetBlockX = -1.0;
      var tetBlockY = -1.0;
      var tetBlockZ =  1.0;
    }
    vertices = vertices.concat([
        // Front face
         0.0,        0.0,        tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,

        // Back face
         0.0,        0.0,        0.0,
         0.0,        tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  0.0,        0.0,

        // Top face
         0.0,        tetBlockY,  0.0,
         0.0,        tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  0.0,

        // Bottom face
         0.0,        0.0,        0.0,
         tetBlockX,  0.0,        0.0,
         tetBlockX,  0.0,        tetBlockZ,
         0.0,        0.0,        tetBlockZ,

        // Right face
         tetBlockX,  0.0,        0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,

        // Left face
         0.0,        0.0,        0.0,
         0.0,        0.0,        tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  0.0,
    ]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  two_x_twoVertexPositionBuffer.itemSize = 3;
  two_x_twoVertexPositionBuffer.numItems = 96;

  two_x_twoVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexColorBuffer);
  colors = [
      [redTwo_x_two, greenTwo_x_two, blueTwo_x_two, 1.0], // Front face
      [redTwo_x_two, greenTwo_x_two, blueTwo_x_two, 1.0], // Back face
      [redTwo_x_two, greenTwo_x_two, blueTwo_x_two, 1.0], // Top face
      [redTwo_x_two, greenTwo_x_two, blueTwo_x_two, 1.0], // Bottom face
      [redTwo_x_two, greenTwo_x_two, blueTwo_x_two, 1.0], // Right face
      [redTwo_x_two, greenTwo_x_two, blueTwo_x_two, 1.0]  // Left face
  ];

  var unpackedColors = [];
  for ( var k = 0; k < 4; ++k ){
    for ( var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  two_x_twoVertexColorBuffer.itemSize = 4;
  two_x_twoVertexColorBuffer.numItems = 96;

  two_x_twoVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, two_x_twoVertexIndexBuffer);
  var two_x_twoVertexIndices = [];
  for( var i = 0; i < 96; i += 24){
    two_x_twoVertexIndices = two_x_twoVertexIndices.concat([
        (0+i), (1+i), (2+i),      (0+i),  (2+i), (3+i),    // Front face
        (4+i), (5+i), (6+i),      (4+i),  (6+i), (7+i),    // Back face
        (8+i), (9+i), (10+i),     (8+i), (10+i), (11+i),   // Top face
        (12+i), (13+i), (14+i),   (12+i), (14+i), (15+i),  // Bottom face
        (16+i), (17+i), (18+i),   (16+i), (18+i), (19+i),  // Right face
        (20+i), (21+i), (22+i),   (20+i), (22+i), (23+i)   // Left face
    ]);
  }
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(two_x_twoVertexIndices), gl.STATIC_DRAW);
  two_x_twoVertexIndexBuffer.itemSize = 1;
  two_x_twoVertexIndexBuffer.numItems = 144;


  //L-TETRIMON

  lTetrimonVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lTetrimonVertexPositionBuffer);
  var vertices = [];
  for( var i = 0; i < 4; ++i ){
    if( i === 0 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 1 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 2 ){
      var tetBlockX = -2.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 3 ){
      var tetBlockX =  1.0;
      var tetBlockY = -1.0;
      var tetBlockZ =  1.0;
    }
    vertices = vertices.concat([
        // Front face
         0.0,        0.0,        tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,

        // Back face
         0.0,        0.0,        0.0,
         0.0,        tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  0.0,        0.0,

        // Top face
         0.0,        tetBlockY,  0.0,
         0.0,        tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  0.0,

        // Bottom face
         0.0,        0.0,        0.0,
         tetBlockX,  0.0,        0.0,
         tetBlockX,  0.0,        tetBlockZ,
         0.0,        0.0,        tetBlockZ,

        // Right face
         tetBlockX,  0.0,        0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,

        // Left face
         0.0,        0.0,        0.0,
         0.0,        0.0,        tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  0.0,
    ]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  lTetrimonVertexPositionBuffer.itemSize = 3;
  lTetrimonVertexPositionBuffer.numItems = 96;

  lTetrimonVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lTetrimonVertexColorBuffer);
  colors = [
      [redlTetrimon, greenlTetrimon, bluelTetrimon, 1.0], // Front face
      [redlTetrimon, greenlTetrimon, bluelTetrimon, 1.0], // Back face
      [redlTetrimon, greenlTetrimon, bluelTetrimon, 1.0], // Top face
      [redlTetrimon, greenlTetrimon, bluelTetrimon, 1.0], // Bottom face
      [redlTetrimon, greenlTetrimon, bluelTetrimon, 1.0], // Right face
      [redlTetrimon, greenlTetrimon, bluelTetrimon, 1.0]  // Left face
  ];

  var unpackedColors = [];
  for ( var k = 0; k < 4; ++k ){
    for ( var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  lTetrimonVertexColorBuffer.itemSize = 4;
  lTetrimonVertexColorBuffer.numItems = 96;

  lTetrimonVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lTetrimonVertexIndexBuffer);
  var lTetrimonVertexIndices = [];
  for( var i = 0; i < 96; i += 24){
    lTetrimonVertexIndices = lTetrimonVertexIndices.concat([
        (0+i), (1+i), (2+i),      (0+i),  (2+i), (3+i),    // Front face
        (4+i), (5+i), (6+i),      (4+i),  (6+i), (7+i),    // Back face
        (8+i), (9+i), (10+i),     (8+i), (10+i), (11+i),   // Top face
        (12+i), (13+i), (14+i),   (12+i), (14+i), (15+i),  // Bottom face
        (16+i), (17+i), (18+i),   (16+i), (18+i), (19+i),  // Right face
        (20+i), (21+i), (22+i),   (20+i), (22+i), (23+i)   // Left face
    ]);
  }
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lTetrimonVertexIndices), gl.STATIC_DRAW);
  lTetrimonVertexIndexBuffer.itemSize = 1;
  lTetrimonVertexIndexBuffer.numItems = 144;


  //Z-TETRIMON

  zTetrimonVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, zTetrimonVertexPositionBuffer);
  var vertices = [];
  for( var i = 0; i < 4; ++i ){
    if( i === 0 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 1 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 2 ){
      var tetBlockX = -1.0;
      var tetBlockY = -1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 3 ){
      var tetBlockX = -2.0;
      var tetBlockY = -1.0;
      var tetBlockZ =  1.0;
    }
    vertices = vertices.concat([
        // Front face
         0.0,        0.0,        tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,

        // Back face
         0.0,        0.0,        0.0,
         0.0,        tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  0.0,        0.0,

        // Top face
         0.0,        tetBlockY,  0.0,
         0.0,        tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  0.0,

        // Bottom face
         0.0,        0.0,        0.0,
         tetBlockX,  0.0,        0.0,
         tetBlockX,  0.0,        tetBlockZ,
         0.0,        0.0,        tetBlockZ,

        // Right face
         tetBlockX,  0.0,        0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,

        // Left face
         0.0,        0.0,        0.0,
         0.0,        0.0,        tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  0.0,
    ]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  zTetrimonVertexPositionBuffer.itemSize = 3;
  zTetrimonVertexPositionBuffer.numItems = 96;

  zTetrimonVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, zTetrimonVertexColorBuffer);
  colors = [
      [redzTetrimon, greenzTetrimon, bluezTetrimon, 1.0], // Front face
      [redzTetrimon, greenzTetrimon, bluezTetrimon, 1.0], // Back face
      [redzTetrimon, greenzTetrimon, bluezTetrimon, 1.0], // Top face
      [redzTetrimon, greenzTetrimon, bluezTetrimon, 1.0], // Bottom face
      [redzTetrimon, greenzTetrimon, bluezTetrimon, 1.0], // Right face
      [redzTetrimon, greenzTetrimon, bluezTetrimon, 1.0]  // Left face
  ];

  var unpackedColors = [];
  for ( var k = 0; k < 4; ++k ){
    for ( var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  zTetrimonVertexColorBuffer.itemSize = 4;
  zTetrimonVertexColorBuffer.numItems = 96;

  zTetrimonVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, zTetrimonVertexIndexBuffer);
  var zTetrimonVertexIndices = [];
  for( var i = 0; i < 96; i += 24){
    zTetrimonVertexIndices = zTetrimonVertexIndices.concat([
        (0+i), (1+i), (2+i),      (0+i),  (2+i), (3+i),    // Front face
        (4+i), (5+i), (6+i),      (4+i),  (6+i), (7+i),    // Back face
        (8+i), (9+i), (10+i),     (8+i), (10+i), (11+i),   // Top face
        (12+i), (13+i), (14+i),   (12+i), (14+i), (15+i),  // Bottom face
        (16+i), (17+i), (18+i),   (16+i), (18+i), (19+i),  // Right face
        (20+i), (21+i), (22+i),   (20+i), (22+i), (23+i)   // Left face
    ]);
  }
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(zTetrimonVertexIndices), gl.STATIC_DRAW);
  zTetrimonVertexIndexBuffer.itemSize = 1;
  zTetrimonVertexIndexBuffer.numItems = 144;


  //THREE SIDE - TETRIMON

  threeSideTetrimonVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, threeSideTetrimonVertexPositionBuffer);
  var vertices = [];
  for( var i = 0; i < 4; ++i ){
    if( i === 0 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 1 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 2 ){
      var tetBlockX = -2.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 3 ){
      var tetBlockX = -1.0;
      var tetBlockY = -1.0;
      var tetBlockZ =  1.0;
    }
    vertices = vertices.concat([
        // Front face
         0.0,        0.0,        tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,

        // Back face
         0.0,        0.0,        0.0,
         0.0,        tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  0.0,        0.0,

        // Top face
         0.0,        tetBlockY,  0.0,
         0.0,        tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  0.0,

        // Bottom face
         0.0,        0.0,        0.0,
         tetBlockX,  0.0,        0.0,
         tetBlockX,  0.0,        tetBlockZ,
         0.0,        0.0,        tetBlockZ,

        // Right face
         tetBlockX,  0.0,        0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,

        // Left face
         0.0,        0.0,        0.0,
         0.0,        0.0,        tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  0.0,
    ]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  threeSideTetrimonVertexPositionBuffer.itemSize = 3;
  threeSideTetrimonVertexPositionBuffer.numItems = 96;

  threeSideTetrimonVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, threeSideTetrimonVertexColorBuffer);
  colors = [
      [redthreeSideTetrimon, greenthreeSideTetrimon, bluethreeSideTetrimon, 1.0], // Front face
      [redthreeSideTetrimon, greenthreeSideTetrimon, bluethreeSideTetrimon, 1.0], // Back face
      [redthreeSideTetrimon, greenthreeSideTetrimon, bluethreeSideTetrimon, 1.0], // Top face
      [redthreeSideTetrimon, greenthreeSideTetrimon, bluethreeSideTetrimon, 1.0], // Bottom face
      [redthreeSideTetrimon, greenthreeSideTetrimon, bluethreeSideTetrimon, 1.0], // Right face
      [redthreeSideTetrimon, greenthreeSideTetrimon, bluethreeSideTetrimon, 1.0]  // Left face
  ];

  var unpackedColors = [];
  for ( var k = 0; k < 4; ++k ){
    for ( var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  threeSideTetrimonVertexColorBuffer.itemSize = 4;
  threeSideTetrimonVertexColorBuffer.numItems = 96;

  threeSideTetrimonVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, threeSideTetrimonVertexIndexBuffer);
  var threeSideTetrimonVertexIndices = [];
  for( var i = 0; i < 96; i += 24){
    threeSideTetrimonVertexIndices = threeSideTetrimonVertexIndices.concat([
        (0+i), (1+i), (2+i),      (0+i),  (2+i), (3+i),    // Front face
        (4+i), (5+i), (6+i),      (4+i),  (6+i), (7+i),    // Back face
        (8+i), (9+i), (10+i),     (8+i), (10+i), (11+i),   // Top face
        (12+i), (13+i), (14+i),   (12+i), (14+i), (15+i),  // Bottom face
        (16+i), (17+i), (18+i),   (16+i), (18+i), (19+i),  // Right face
        (20+i), (21+i), (22+i),   (20+i), (22+i), (23+i)   // Left face
    ]);
  }
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(threeSideTetrimonVertexIndices), gl.STATIC_DRAW);
  threeSideTetrimonVertexIndexBuffer.itemSize = 1;
  threeSideTetrimonVertexIndexBuffer.numItems = 144;


  //TOWER LEFT - TETRIMON

  TowerLeftVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TowerLeftVertexPositionBuffer);
  var vertices = [];
  for( var i = 0; i < 4; ++i ){
    if( i === 0 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 1 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 2 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ = -1.0;
    }
    if( i === 3 ){
      var tetBlockX = -1.0;
      var tetBlockY = -1.0;
      var tetBlockZ = -1.0;
    }
    vertices = vertices.concat([
        // Front face
         0.0,        0.0,        tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,

        // Back face
         0.0,        0.0,        0.0,
         0.0,        tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  0.0,        0.0,

        // Top face
         0.0,        tetBlockY,  0.0,
         0.0,        tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  0.0,

        // Bottom face
         0.0,        0.0,        0.0,
         tetBlockX,  0.0,        0.0,
         tetBlockX,  0.0,        tetBlockZ,
         0.0,        0.0,        tetBlockZ,

        // Right face
         tetBlockX,  0.0,        0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,

        // Left face
         0.0,        0.0,        0.0,
         0.0,        0.0,        tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  0.0,
    ]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  TowerLeftVertexPositionBuffer.itemSize = 3;
  TowerLeftVertexPositionBuffer.numItems = 96;

  TowerLeftVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TowerLeftVertexColorBuffer);
  colors = [
      [redTowerLeft, greenTowerLeft, blueTowerLeft, 1.0], // Front face
      [redTowerLeft, greenTowerLeft, blueTowerLeft, 1.0], // Back face
      [redTowerLeft, greenTowerLeft, blueTowerLeft, 1.0], // Top face
      [redTowerLeft, greenTowerLeft, blueTowerLeft, 1.0], // Bottom face
      [redTowerLeft, greenTowerLeft, blueTowerLeft, 1.0], // Right face
      [redTowerLeft, greenTowerLeft, blueTowerLeft, 1.0]  // Left face
  ];

  var unpackedColors = [];
  for ( var k = 0; k < 4; ++k ){
    for ( var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  TowerLeftVertexColorBuffer.itemSize = 4;
  TowerLeftVertexColorBuffer.numItems = 96;

  TowerLeftVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TowerLeftVertexIndexBuffer);
  var TowerLeftVertexIndices = [];
  for( var i = 0; i < 96; i += 24){
    TowerLeftVertexIndices = TowerLeftVertexIndices.concat([
        (0+i), (1+i), (2+i),      (0+i),  (2+i), (3+i),    // Front face
        (4+i), (5+i), (6+i),      (4+i),  (6+i), (7+i),    // Back face
        (8+i), (9+i), (10+i),     (8+i), (10+i), (11+i),   // Top face
        (12+i), (13+i), (14+i),   (12+i), (14+i), (15+i),  // Bottom face
        (16+i), (17+i), (18+i),   (16+i), (18+i), (19+i),  // Right face
        (20+i), (21+i), (22+i),   (20+i), (22+i), (23+i)   // Left face
    ]);
  }
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(TowerLeftVertexIndices), gl.STATIC_DRAW);
  TowerLeftVertexIndexBuffer.itemSize = 1;
  TowerLeftVertexIndexBuffer.numItems = 144;


  //TOWER RIGHT - TETRIMON

  TowerRightVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TowerRightVertexPositionBuffer);
  var vertices = [];
  for( var i = 0; i < 4; ++i ){
    if( i === 0 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 1 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 2 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ = -1.0;
    }
    if( i === 3 ){
      var tetBlockX =  1.0;
      var tetBlockY = -1.0;
      var tetBlockZ = -1.0;
    }
    vertices = vertices.concat([
        // Front face
         0.0,        0.0,        tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,

        // Back face
         0.0,        0.0,        0.0,
         0.0,        tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  0.0,        0.0,

        // Top face
         0.0,        tetBlockY,  0.0,
         0.0,        tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  0.0,

        // Bottom face
         0.0,        0.0,        0.0,
         tetBlockX,  0.0,        0.0,
         tetBlockX,  0.0,        tetBlockZ,
         0.0,        0.0,        tetBlockZ,

        // Right face
         tetBlockX,  0.0,        0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,

        // Left face
         0.0,        0.0,        0.0,
         0.0,        0.0,        tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  0.0,
    ]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  TowerRightVertexPositionBuffer.itemSize = 3;
  TowerRightVertexPositionBuffer.numItems = 96;

  TowerRightVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TowerRightVertexColorBuffer);
  colors = [
      [redTowerRight, greenTowerRight, blueTowerRight, 1.0], // Front face
      [redTowerRight, greenTowerRight, blueTowerRight, 1.0], // Back face
      [redTowerRight, greenTowerRight, blueTowerRight, 1.0], // Top face
      [redTowerRight, greenTowerRight, blueTowerRight, 1.0], // Bottom face
      [redTowerRight, greenTowerRight, blueTowerRight, 1.0], // Right face
      [redTowerRight, greenTowerRight, blueTowerRight, 1.0]  // Left face
  ];

  var unpackedColors = [];
  for ( var k = 0; k < 4; ++k ){
    for ( var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  TowerRightVertexColorBuffer.itemSize = 4;
  TowerRightVertexColorBuffer.numItems = 96;

  TowerRightVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TowerRightVertexIndexBuffer);
  var TowerRightVertexIndices = [];
  for( var i = 0; i < 96; i += 24){
    TowerRightVertexIndices = TowerRightVertexIndices.concat([
        (0+i), (1+i), (2+i),      (0+i),  (2+i), (3+i),    // Front face
        (4+i), (5+i), (6+i),      (4+i),  (6+i), (7+i),    // Back face
        (8+i), (9+i), (10+i),     (8+i), (10+i), (11+i),   // Top face
        (12+i), (13+i), (14+i),   (12+i), (14+i), (15+i),  // Bottom face
        (16+i), (17+i), (18+i),   (16+i), (18+i), (19+i),  // Right face
        (20+i), (21+i), (22+i),   (20+i), (22+i), (23+i)   // Left face
    ]);
  }
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(TowerRightVertexIndices), gl.STATIC_DRAW);
  TowerRightVertexIndexBuffer.itemSize = 1;
  TowerRightVertexIndexBuffer.numItems = 144;


  //TRIPOD - TETRIMON

  TripodVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TripodVertexPositionBuffer);
  var vertices = [];
  for( var i = 0; i < 4; ++i ){
    if( i === 0 ){
      var tetBlockX =  1.0;
      var tetBlockY =  1.0;
      var tetBlockZ = -1.0;
    }
    if( i === 1 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ =  1.0;
    }
    if( i === 2 ){
      var tetBlockX = -1.0;
      var tetBlockY =  1.0;
      var tetBlockZ = -1.0;
    }
    if( i === 3 ){
      var tetBlockX = -1.0;
      var tetBlockY = -1.0;
      var tetBlockZ = -1.0;
    }
    vertices = vertices.concat([
        // Front face
         0.0,        0.0,        tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,

        // Back face
         0.0,        0.0,        0.0,
         0.0,        tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  0.0,        0.0,

        // Top face
         0.0,        tetBlockY,  0.0,
         0.0,        tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  tetBlockY,  0.0,

        // Bottom face
         0.0,        0.0,        0.0,
         tetBlockX,  0.0,        0.0,
         tetBlockX,  0.0,        tetBlockZ,
         0.0,        0.0,        tetBlockZ,

        // Right face
         tetBlockX,  0.0,        0.0,
         tetBlockX,  tetBlockY,  0.0,
         tetBlockX,  tetBlockY,  tetBlockZ,
         tetBlockX,  0.0,        tetBlockZ,

        // Left face
         0.0,        0.0,        0.0,
         0.0,        0.0,        tetBlockZ,
         0.0,        tetBlockY,  tetBlockZ,
         0.0,        tetBlockY,  0.0,
    ]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  TripodVertexPositionBuffer.itemSize = 3;
  TripodVertexPositionBuffer.numItems = 96;

  TripodVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TripodVertexColorBuffer);
  colors = [
      [redTripod, greenTripod, blueTripod, 1.0], // Front face
      [redTripod, greenTripod, blueTripod, 1.0], // Back face
      [redTripod, greenTripod, blueTripod, 1.0], // Top face
      [redTripod, greenTripod, blueTripod, 1.0], // Bottom face
      [redTripod, greenTripod, blueTripod, 1.0], // Right face
      [redTripod, greenTripod, blueTripod, 1.0]  // Left face
  ];

  var unpackedColors = [];
  for ( var k = 0; k < 4; ++k ){
    for ( var i in colors) {
        var color = colors[i];
        for (var j = 0; j < 4; j++) {
            unpackedColors = unpackedColors.concat(color);
        }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  TripodVertexColorBuffer.itemSize = 4;
  TripodVertexColorBuffer.numItems = 96;

  TripodVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TripodVertexIndexBuffer);
  var TripodVertexIndices = [];
  for( var i = 0; i < 96; i += 24){
    TripodVertexIndices = TripodVertexIndices.concat([
        (0+i), (1+i), (2+i),      (0+i),  (2+i), (3+i),    // Front face
        (4+i), (5+i), (6+i),      (4+i),  (6+i), (7+i),    // Back face
        (8+i), (9+i), (10+i),     (8+i), (10+i), (11+i),   // Top face
        (12+i), (13+i), (14+i),   (12+i), (14+i), (15+i),  // Bottom face
        (16+i), (17+i), (18+i),   (16+i), (18+i), (19+i),  // Right face
        (20+i), (21+i), (22+i),   (20+i), (22+i), (23+i)   // Left face
    ]);
  }
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(TripodVertexIndices), gl.STATIC_DRAW);
  TripodVertexIndexBuffer.itemSize = 1;
  TripodVertexIndexBuffer.numItems = 144;


    //ONE X FOUR

    one_x_fourVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexPositionBuffer);
    vertices = [
        // Front face
        -1.5, -0.5,  0.5,
         2.5, -0.5,  0.5,
         2.5,  0.5,  0.5,
        -1.5,  0.5,  0.5,

        // Back face
        -1.5, -0.5, -0.5,
        -1.5,  0.5, -0.5,
         2.5,  0.5, -0.5,
         2.5, -0.5, -0.5,

        // Top face
        -1.5,  0.5, -0.5,
        -1.5,  0.5,  0.5,
         2.5,  0.5,  0.5,
         2.5,  0.5, -0.5,

        // Bottom face
        -1.5, -0.5, -0.5,
         2.5, -0.5, -0.5,
         2.5, -0.5,  0.5,
        -1.5, -0.5,  0.5,

        // Right face
         2.5, -0.5, -0.5,
         2.5,  0.5, -0.5,
         2.5,  0.5,  0.5,
         2.5, -0.5,  0.5,

        // Left face
        -1.5, -0.5, -0.5,
        -1.5, -0.5,  0.5,
        -1.5,  0.5,  0.5,
        -1.5,  0.5, -0.5
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    one_x_fourVertexPositionBuffer.itemSize = 3;
    one_x_fourVertexPositionBuffer.numItems = 24;

    one_x_fourVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexColorBuffer);
    colors = [
        [redOne_x_four, greenOne_x_four, blueOne_x_four, 1.0], // Front face
        [redOne_x_four, greenOne_x_four, blueOne_x_four, 1.0], // Back face
        [redOne_x_four, greenOne_x_four, blueOne_x_four, 1.0], // Top face
        [redOne_x_four, greenOne_x_four, blueOne_x_four, 1.0], // Bottom face
        [redOne_x_four, greenOne_x_four, blueOne_x_four, 1.0], // Right face
        [redOne_x_four, greenOne_x_four, blueOne_x_four, 1.0]  // Left face
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


    //GRID BACK (WIREFRAME)

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


var perspectiveView;
var zoom = 0.5;
var rotateX_tetrimon = 0;
var rotateY_tetrimon = 0;
var rotateZ_tetrimon = 0;
var positionX_tetrimon = 0;
var positionY_tetrimon = 0;
var positionZ_tetrimon = 0;
var side1,side2,side3,side4,bottomZ,topZ;
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

    if( showSpheres ){
        //DRAW SPHERES

        //DRAW ONE X FOUR SPHERE
        if( tetrimonType === "one_x_four" ){
            for( var i = 0; i < 4; ++i ){
              mvPushMatrix();
              mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
              mat4.translate(mvMatrix, [i+1.5, 3.5, -4.5]);

              mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

              mat4.translate(mvMatrix, [-i+1, 0, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
              mat4.translate(mvMatrix, [i-1, 0, 0]);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
              setMatrixUniforms();
              gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

              mvPopMatrix();
            }
        }

        //DRAW TWO X TWO SPHERE
        if( tetrimonType === "two_x_two" ){
            for( var i = 0; i < 2; ++i ){
              mvPushMatrix();
              mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
              mat4.translate(mvMatrix, [i-0.5, 6.5, -4.5]);

              mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

              mat4.translate(mvMatrix, [-i+0.5, -0.5, -0.5]);
              mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
              mat4.translate(mvMatrix, [i-0.5, +0.5, +0.5]);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
              setMatrixUniforms();
              gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

              mvPopMatrix();
            }
            for( var i = 0; i < 2; ++i ){
              mvPushMatrix();
              mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
              mat4.translate(mvMatrix, [i-0.5, 5.5, -4.5]);

              mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

              mat4.translate(mvMatrix, [-i+0.5, +0.5, -0.5]);
              mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
              mat4.translate(mvMatrix, [i-0.5, -0.5, +0.5]);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
              setMatrixUniforms();
              gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

              mvPopMatrix();
            }

          }

          //DRAW L-TETRIMON SPHERE
          if( tetrimonType === "lTetrimon" ){
              for( var i = 0; i < 3; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [i-1.5, 6.5, -4.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [-i+1.5, -0.5, -0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [i-1.5, 0.5, 0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }

              mvPushMatrix();
              mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
              mat4.translate(mvMatrix, [0.5, 5.5, -4.5]);

              mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

              mat4.translate(mvMatrix, [-0.5, 0.5, -0.5]);
              mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
              mat4.translate(mvMatrix, [0.5, -0.5, 0.5]);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
              setMatrixUniforms();
              gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

              mvPopMatrix();
          }

          //DRAW THREE SIDE SPHERE
          if( tetrimonType === "threeSideTetrimon" ){
              for( var i = 0; i < 3; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [i-1.5, 6.5, -4.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [-i+1.5, -0.5, -0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [i-1.5, 0.5, 0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }

              mvPushMatrix();
              mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
              mat4.translate(mvMatrix, [-0.5, 5.5, -4.5]);

              mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

              mat4.translate(mvMatrix, [0.5, 0.5, -0.5]);
              mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
              mat4.translate(mvMatrix, [-0.5, -0.5, 0.5]);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
              setMatrixUniforms();
              gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

              mvPopMatrix();
          }

          //DRAW Z-TETRIMON SPHERE
          if( tetrimonType === "zTetrimon" ){
              for( var i = 0; i < 2; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [i-0.5, 6.5, -4.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [-i+0.5, -0.5, -0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [i-0.5, 0.5, 0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }

            for( var i = 0; i < 2; ++i ){
              mvPushMatrix();
              mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
              mat4.translate(mvMatrix, [i-1.5, 5.5, -4.5]);

              mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

              mat4.translate(mvMatrix, [-i+1.5, 0.5, -0.5]);
              mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
              mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
              mat4.translate(mvMatrix, [i-1.5, -0.5, 0.5]);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
              gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
              setMatrixUniforms();
              gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

              mvPopMatrix();
            }
          }

          //DRAW TOWER LEFT SPHERE
          if( tetrimonType === "TowerLeft" ){
              for( var i = 0; i < 2; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [i-0.5, 6.5, -3.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [-i+0.5, -0.5, -0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [i-0.5, 0.5, 0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }
              for( var i = 0; i < 2; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [-0.5, i+5.5, -4.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [0.5, +0.5-i, 0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [-0.5, -0.5+i, -0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }
          }

          //DRAW TOWER RIGHT SPHERE
          if( tetrimonType === "TowerRight" ){
              for( var i = 0; i < 2; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [i-0.5, 6.5, -3.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [-i+0.5, -0.5, -0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [i-0.5, 0.5, 0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }
              for( var i = 0; i < 2; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [0.5, i+5.5, -4.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [-0.5, +0.5-i, 0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [+0.5, -0.5+i, -0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }
          }

          //DRAW TRIPOD SPHERE
          if( tetrimonType === "Tripod" ){

                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [-0.5, 6.5, -3.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [0.5, -0.5, -0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [-0.5, 0.5, 0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();


                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [0.5, 6.5, -4.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [-0.5, -0.5, 0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [0.5, 0.5, -0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();


              for( var i = 0; i < 2; ++i ){
                mvPushMatrix();
                mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
                mat4.translate(mvMatrix, [-0.5, i+5.5, -4.5]);

                mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

                mat4.translate(mvMatrix, [0.5, +0.5-i, 0.5]);
                mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
                mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);
                mat4.translate(mvMatrix, [-0.5, -0.5+i, -0.5]);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, moonColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

                mvPopMatrix();
              }
          }

    }else{

      //DRAW CUBES

      //DRAW TWO X TWO
      if( tetrimonType === "two_x_two" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 6, -5]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          /*x-axis
          if( (0 >= rotateX_tetrimon && rotateX_tetrimon > -90) || (270 < rotateX_tetrimon && rotateX_tetrimon <= 360) ){
            mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
            mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          }
          if( -90 >= rotateX_tetrimon && rotateX_tetrimon > -180 || 180 < rotateX_tetrimon && rotateX_tetrimon <= 270 ){
            mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
            mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          }
          if( -180 >= rotateX_tetrimon && rotateX_tetrimon > -270 || 90 < rotateX_tetrimon && rotateX_tetrimon <= 180 ){
            mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
            mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          }
          if( -270 >= rotateX_tetrimon && rotateX_tetrimon > -360 || 0 < rotateX_tetrimon && rotateX_tetrimon <= 90 ){
            mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
            mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          }*/

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);


          gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, two_x_twoVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, two_x_twoVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, two_x_twoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, two_x_twoVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, two_x_twoVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }


      //DRAW L-Tetrimon
      if( tetrimonType === "lTetrimon" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 6, -5]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);


          gl.bindBuffer(gl.ARRAY_BUFFER, lTetrimonVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, lTetrimonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, lTetrimonVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, lTetrimonVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lTetrimonVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, lTetrimonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }


      //DRAW L-Tetrimon
      if( tetrimonType === "threeSideTetrimon" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 6, -5]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);


          gl.bindBuffer(gl.ARRAY_BUFFER, threeSideTetrimonVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, threeSideTetrimonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, threeSideTetrimonVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, threeSideTetrimonVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, threeSideTetrimonVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, threeSideTetrimonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }


      //DRAW Z-Tetrimon
      if( tetrimonType === "zTetrimon" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 6, -5]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);


          gl.bindBuffer(gl.ARRAY_BUFFER, zTetrimonVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, zTetrimonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, zTetrimonVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, zTetrimonVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, zTetrimonVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, zTetrimonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }


      //DRAW TOWER LEFT-Tetrimon
      if( tetrimonType === "TowerLeft" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 6, -4]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);


          gl.bindBuffer(gl.ARRAY_BUFFER, TowerLeftVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, TowerLeftVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, TowerLeftVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, TowerLeftVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TowerLeftVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, TowerLeftVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }


      //DRAW TOWER RIGHT-Tetrimon
      if( tetrimonType === "TowerRight" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 6, -4]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);


          gl.bindBuffer(gl.ARRAY_BUFFER, TowerRightVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, TowerRightVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, TowerRightVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, TowerRightVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TowerRightVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, TowerRightVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }


      //DRAW TRIPOD-Tetrimon
      if( tetrimonType === "Tripod" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 6, -4]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon),  [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon),  [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon),  [0, 0, 1]);


          gl.bindBuffer(gl.ARRAY_BUFFER, TripodVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, TripodVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, TripodVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, TripodVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TripodVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, TripodVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }


      //DRAW ONE X FOUR
      if( tetrimonType === "one_x_four" ){
          mvPushMatrix();
          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.translate(mvMatrix, [2.5, 3.5, -4.5]);

          mat4.translate(mvMatrix, [positionX_tetrimon, positionY_tetrimon, positionZ_tetrimon]);

          mat4.rotate(mvMatrix, degToRad(rotateZ_tetrimon), [1, 0, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateY_tetrimon), [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(rotateX_tetrimon), [0, 0, 1]);

          gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, one_x_fourVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, one_x_fourVertexColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, one_x_fourVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, one_x_fourVertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, one_x_fourVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

          mvPopMatrix();
      }
    }//end else showSpheres


    //DRAW GRID BACK

    mat4.translate(mvMatrix, [0, 0, -7]);

    //--side I horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    side1 = mvMatrix[14];
    if( side1 <= side3 ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--side I vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    if( side1 <= side3 ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--side II horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    side2 = mvMatrix[14];
    if( side2 <= side4 ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--side II vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 0]);

    if( side2 <= side4 ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--side III horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, -10]);

    side3 = mvMatrix[14];
    if( side3 < side1 ){

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);

    }

    mvPopMatrix();

    //--side III vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-135), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, -10]);

    if( side3 < side1 ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--side IV horizontal lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 10]);

    side4 = mvMatrix[14];
    if( side4 < side2 ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackHorizontalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackHorizontalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackHorizontalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackHorizontalPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--side IV vertical lines--
    mvPushMatrix();

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.translate(mvMatrix, [0, 7, 10]);

    if( side4 < side2 ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--bottom vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, -8, 0]);

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    bottomZ = mvMatrix[14];
    if( bottomZ <= topZ ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--bottom vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [-7, -8, 7]);

    mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    if( bottomZ <= topZ ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--top vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [0, 7, 0]);

    mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

    topZ = mvMatrix[14];
    if( topZ < bottomZ ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);
    }
    mvPopMatrix();

    //--top vertical lines--
    mvPushMatrix();

    mat4.translate(mvMatrix, [-7, 7, 7]);

    mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);
    if( topZ < bottomZ ){
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);
    }
    mvPopMatrix();


    //GRID ARRAY

    if( showGridArray ){
      for( var i = 0; i <= 15; ++i ){
          mvPushMatrix();

          mat4.translate(mvMatrix, [0, -8 + i, 0]);

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

          mat4.translate(mvMatrix, [-7, -8 + i, 7]);

          mat4.rotate(mvMatrix, degToRad(45), [0, 1, 0]);
          mat4.rotate(mvMatrix, degToRad(-90), [1, 0, 0]);

          gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackBottomPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, gridBackBottomColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackBottomColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          setMatrixUniforms();
          gl.drawArrays(gl.LINES, 0, gridBackBottomPositionBuffer.numItems);

          mvPopMatrix();
      }
      for( var i = 0; i <= 10; ++i ){
          //--side II horizontal lines--
          mvPushMatrix();

          mat4.rotate(mvMatrix, degToRad(-45), [0, 1, 0]);
          mat4.translate(mvMatrix, [0, 7, i]);

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
          mat4.translate(mvMatrix, [0, 7, i]);

          gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridBackVerticalPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, gridBackVerticalColorBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridBackVerticalColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

          setMatrixUniforms();
          gl.drawArrays(gl.LINES, 0, gridBackVerticalPositionBuffer.numItems);

          mvPopMatrix();
      }
    }

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
    type = getRandomNumber(0,7);
    type = 7;

    if( type === 0){
        //currentObject = new two_x_two();
        tetrimonType = "two_x_two";
    }

    if( type === 1){
        //currentObject = new one_x_four();
        tetrimonType = "one_x_four";
    }

    if( type === 2){
        tetrimonType = "lTetrimon";
    }

    if( type === 3){
        tetrimonType = "threeSideTetrimon";
    }

    if( type === 4){
        tetrimonType = "zTetrimon";
    }

    if( type === 5){
        tetrimonType = "TowerLeft";
    }

    if( type === 6){
        tetrimonType = "TowerRight";
    }

    if( type === 7){
        tetrimonType = "Tripod";
    }
}

var rotYStart = mat4.create();
var rotXStart = mat4.create();
function initGame() {
    redBg = Math.random();
    greenBg = Math.random();
    blueBg = Math.random();

    setGravitySpeed();
    grid = new gridArray();
    //grid.getInfoOccupation();

    typeOfCurrentTetrimon();

    //Rotation at the beginning of the game
    mat4.identity(rotXStart);
    mat4.identity(rotYStart);
    mat4.rotate(rotXStart, degToRad(0), [1, 0, 0]);
    mat4.rotate(rotYStart, degToRad(0), [0, 1, 0]);

    perspectiveView = true;

}



var lastTime = 0;
function animate() {

  gravity();

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
