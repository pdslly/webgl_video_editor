import * as THREE from "../threejs/build/three.module.js";

var vertex =
  "\n        varying vec2 vUv;\n        void main() {\n          vUv = uv;\n          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n        }\n    ";
var fragment =
  "\n        \n        varying vec2 vUv;\n\n        uniform sampler2D currentImage;\n        uniform sampler2D nextImage;\n\n        uniform float dispFactor;\n\n        void main() {\n\n            vec2 uv = vUv;\n            vec4 _currentImage;\n            vec4 _nextImage;\n            float intensity = 0.3;\n\n            vec4 orig1 = texture2D(currentImage, uv);\n            vec4 orig2 = texture2D(nextImage, uv);\n            \n            _currentImage = texture2D(currentImage, vec2(uv.x, uv.y + dispFactor * (orig2 * intensity)));\n\n            _nextImage = texture2D(nextImage, vec2(uv.x, uv.y + (1.0 - dispFactor) * (orig1 * intensity)));\n\n            vec4 finalTexture = mix(_currentImage, _nextImage, dispFactor);\n\n            gl_FragColor = finalTexture;\n\n        }\n    ";

class App {
  constructor(container, video) {
    const { offsetWidth, offsetHeight } = (this.container = container);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(offsetWidth, offsetHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.OrthographicCamera(
      offsetWidth / -2,
      offsetWidth / 2,
      offsetHeight / 2,
      offsetHeight / -2,
      1,
      1000
    );

    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.tick = this.tick.bind(this);
    this.camera.position.z = 100;
    this.video = video;

    const canvas = document.createElement("canvas");
    canvas.width = offsetWidth;
    canvas.height = offsetHeight;

    this.texture = new THREE.CanvasTexture(canvas);
    this.canCtx = canvas.getContext("2d");
  }
  getVertexShader() {
    return `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`;
  }
  getFragmentShader() {
    return `
    varying vec2 vUv;
    uniform sampler2D u_image;
    uniform float u_colorFactor;

    void main() {
        vec2 uv = vUv;
        vec4 orig = texture2D(u_image, uv);
        float gray = 0.21 * orig.r + 0.71 * orig.g + 0.07 * orig.b;
        gl_FragColor = vec4(orig.rgb * (1.0 - u_colorFactor) + (gray * u_colorFactor), 1.0);
    }`;
  }
  init() {
    const { offsetWidth, offsetHeight } = this.container;
    let geometry = new THREE.PlaneBufferGeometry(offsetWidth, offsetHeight, 1);
    let material = new THREE.ShaderMaterial({
      fragmentShader: this.getFragmentShader(),
      vertexShader: this.getVertexShader(),
      transparent: true,
      opacity: 1.0,
      uniforms: {
        u_image: {
          type: "t",
          value: this.texture,
        },
        u_colorFactor: {
          type: "f",
          value: 1.0,
        },
      },
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    this.scene.add(mesh);
    this.tick();
  }
  update() {
    const {
      container: { offsetWidth, offsetHeight },
      video,
    } = this;
    this.canCtx.drawImage(video, 0, 0, offsetWidth, offsetHeight);
    this.texture.needsUpdate = true;
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  tick() {
    let delta = this.clock.getDelta();
    this.update();
    this.render(delta);
    requestAnimationFrame(this.tick);
  }
}

const video = document.getElementById("video");
const container = document.getElementById("container");

const app = new App(container, video);

app.init();
