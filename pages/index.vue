<script setup lang="ts">
import { onMounted, ref, computed } from "vue"
import type { Ref } from "vue"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js"
import { useWindowSize } from "@vueuse/core"

const { width, height } = useWindowSize()
const aspectRatio = computed(() => width.value / height.value)

const canvas3D: Ref<HTMLCanvasElement | null> = ref(null)
let isLocked = ref(false)

let controls: PointerLockControls
let renderer: THREE.WebGLRenderer
let eyeMesh: THREE.Mesh, floorMesh: THREE.Mesh
let eyeMeshes: THREE.Mesh[] = []
const clock = new THREE.Clock()
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, aspectRatio.value, 0.1, 1000)
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
const gltfLoader = new GLTFLoader()

let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()

// Eyes
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

// keyEvent
function pointerLock() {
  if (!canvas3D.value) return
  canvas3D.value.requestPointerLock()
  document.addEventListener("keydown", onKeyDown)
  document.addEventListener("keyup", onKeyUp)
  controls.lock()
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

function updateRenderer() {
  camera.aspect = aspectRatio.value
  camera.updateProjectionMatrix()
  renderer.setSize(width.value, height.value)
  renderer.render(scene, camera)
}

function setRenderer() {
  if (!canvas3D.value) return
  floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000, 10, 10),
    new THREE.MeshBasicMaterial({ color: "#fff", wireframe: true })
  )
  floorMesh.rotateX(-Math.PI / 2)
  floorMesh.position.set(0, -5, 0)
  scene.background = new THREE.Color(0x000000)
  directionalLight.position.set(0, 1, 5)
  scene.add(ambientLight, directionalLight, camera, floorMesh)

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
      // const random = Math.floor(Math.random() * 10) - 5
      // let x = mesh.position.x
      // let y = mesh.position.y
      // let z = mesh.position.z
      // x += Math.sin(Math.floor(time)) * speed
      // y += Math.sin(Math.floor(time)) * speed
      // z += Math.sin(Math.floor(time)) * speed

      // mesh.position.set(x, y, z)
      // mesh.rotation.x += 0.1 * random
      // mesh.rotation.y += 0.1 * random
      // mesh.rotation.z += 0.1 * random
      mesh.lookAt(camera.position)
    })

    controls.moveRight(-velocity.x * delta)
    controls.moveForward(-velocity.z * delta)
  }

  updateRenderer()
}
onMounted(() => {
  setEyeMeshes()
  setRenderer()
  loop()
})
</script>

<template>
  <div>
    <canvas @keypress="onKeyDown($event)" ref="canvas3D" />
    <div @click="pointerLock" v-show="!isLocked" class="game-doc">
      <p>Click to Play</p>
      <div class="doc">
        <p>Move: WASD</p>
        <p>View: Mouse</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
}
div.game-doc {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 228, 196, 0.503);
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  div,
  p {
    font-size: 24px;
    font-weight: bold;
    color: red;
  }
}
</style>
