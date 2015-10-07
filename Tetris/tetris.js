function main() {
  gl = WebGLUtils.setupWebGL( document.getElementById( 'WebGL_Canvas' ) );
  gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
  gl.clear( gl.COLOR_BUFFER_BIT );
}
