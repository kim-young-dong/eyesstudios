<script setup lang="ts">
import { onMounted, ref, computed } from "vue"
import type { Ref } from "vue"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js"
import { useWindowSize } from "@vueuse/core"

// 윈도우 크기와 캔버스 관련 설정
const { width, height } = useWindowSize()
const aspectRatio = computed(() => width.value / height.value)

// 3D 캔버스와 컨트롤러 관련 설정
const canvas3D: Ref<HTMLCanvasElement | null> = ref(null)
let isLocked = ref(false)

// Three.js 관련 변수
let controls: PointerLockControls
let renderer: THREE.WebGLRenderer
let eyeMesh: THREE.Mesh
let eyeMeshes: THREE.Mesh[] = []
const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000, 10, 10),
  new THREE.MeshBasicMaterial({ color: "#fff", wireframe: true })
)
const clock = new THREE.Clock()
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, aspectRatio.value, 0.1, 1000)
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
const gltfLoader = new GLTFLoader()
const raycaster = new THREE.Raycaster()
let intersects: THREE.Intersection[] = []

// Player Movement 관련 변수
let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()

// Score & Time
let score = ref(0)
let time = ref(100)

// Eyes Mesh Setting
async function setEyeMeshes() {
  await new Promise((resolve, reject) => {
    gltfLoader.load(
      "https://ksenia-k.com/models/eye-realistic.glb",
      (gltf: any) => {
        const eyeMesh = gltf.scene.children[2]
        eyeMesh.scale.set(300, 300, 300)
        eyeMesh.rotateY(Math.PI)
        resolve(eyeMesh)
      },
      undefined,
      (error: any) => {
        console.error(error)
        reject(error)
      }
    )
  }).then((mesh: any) => {
    eyeMesh = mesh
  })

  for (let i = 0; i < 1000; i++) {
    const mesh = eyeMesh.clone()

    mesh.position.set(
      Math.floor(Math.random() * 1000 - 500),
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 1000 - 500)
    )
    scene.add(mesh)
    eyeMeshes.push(mesh)
  }
}

// 게임 플레이 관련 함수
function gameTimer() {
  if (time.value === 0) {
    alert(`Game Over! Your Score: ${score.value}`)
    time.value = 100
    score.value = 0
    return
  }
  if (isLocked.value) {
    setTimeout(gameTimer, 1000)
    time.value -= 1
  }
}
function targetHit() {
  eyeMeshes = eyeMeshes.filter((mesh) => mesh !== intersects[0].object)
  scene.remove(intersects[0].object)
  score.value += 100

  if (time.value >= 97) {
    time.value = 100
    return
  }
  time.value += 3
}
function setIntersect() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
  intersects = raycaster.intersectObjects(eyeMeshes)
  if (intersects.length > 0) {
    targetHit()
  }
}

// keyEvent
function pointerLock() {
  if (!canvas3D.value) return
  canvas3D.value.requestPointerLock()
  document.addEventListener("keydown", onKeyDown)
  document.addEventListener("keyup", onKeyUp)
  document.addEventListener("click", setIntersect)
  controls.lock()
  setTimeout(gameTimer, 1000)
}

function onKeyDown(event: KeyboardEvent) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = true
      break

    case "ArrowLeft":
    case "KeyA":
      moveLeft = true
      break

    case "ArrowDown":
    case "KeyS":
      moveBackward = true
      break

    case "ArrowRight":
    case "KeyD":
      moveRight = true
      break
  }
}
function onKeyUp(event: KeyboardEvent) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = false
      break

    case "ArrowLeft":
    case "KeyA":
      moveLeft = false
      break

    case "ArrowDown":
    case "KeyS":
      moveBackward = false
      break

    case "ArrowRight":
    case "KeyD":
      moveRight = false
      break
  }
}

// 씬 초기화
function initScene() {
  directionalLight.position.set(0, 1, 5)
  floorMesh.rotateX(-Math.PI / 2)
  floorMesh.position.set(0, -5, 0)
  camera.rotation.x = 0.5
  scene.background = new THREE.Color(0x000000)
  scene.add(ambientLight, directionalLight, camera, floorMesh)
}

// 렌더러 업데이트
function updateRenderer() {
  camera.aspect = aspectRatio.value
  camera.updateProjectionMatrix()
  renderer.setSize(width.value, height.value)
  renderer.render(scene, camera)
}
// 렌더러 초기화
function setRenderer() {
  if (!canvas3D.value) return
  renderer = new THREE.WebGLRenderer({ canvas: canvas3D.value, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio))

  controls = new PointerLockControls(camera, renderer.domElement)
  controls.addEventListener("lock", () => {
    isLocked.value = true
  })
  controls.addEventListener("unlock", () => {
    isLocked.value = false
  })
  updateRenderer()
}

// 렌더링 루프
const loop = () => {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()

  if (controls && controls.isLocked === true) {
    velocity.x -= velocity.x * 10.0 * delta
    velocity.z -= velocity.z * 10.0 * delta

    direction.x = Number(moveRight) - Number(moveLeft)
    direction.z = Number(moveForward) - Number(moveBackward)
    direction.normalize()

    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta
    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta

    eyeMeshes.forEach((mesh) => {
      mesh.lookAt(camera.position)
    })

    controls.moveRight(-velocity.x * delta)
    controls.moveForward(-velocity.z * delta)
  }

  updateRenderer()
}
onMounted(() => {
  initScene()
  setEyeMeshes()
  setRenderer()
  loop()
})
</script>

<template>
  <div class="container">
    <div v-show="isLocked" class="crose-scope">+</div>
    <div class="score-board">
      <div>Time: {{ time }}</div>
      <div>Score: {{ score }}</div>
    </div>
    <canvas class="game-board" @keypress="onKeyDown($event)" ref="canvas3D" />
    <div @click="pointerLock" v-show="!isLocked" class="game-rules">
      <p>Click to Play</p>
      <div class="rules">
        <p>Move: WASD</p>
        <p>Control: Mouse</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  // width: 100%;
  // height: 100%;
  position: relative;
}
.score-board {
  position: fixed;
  top: 20px;
  left: 20px;
  font-size: 24px;
  font-weight: bold;
  color: red;
  z-index: 1;
}
.game-board {
  position: fixed;
  top: 0;
  left: 0;
}
.crose-scope {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  color: hotpink;
  z-index: 1;
}
.game-rules {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.503);
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  div,
  p {
    font-size: 24px;
    font-weight: bold;
    color: rgb(255, 0, 0);
    text-align: center;
  }
}
</style>
