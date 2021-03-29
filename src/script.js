import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import * as dat from 'dat.gui'

/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Helpers
// const axesHelper = new THREE.AxesHelper()
// scene.add(axesHelper)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const waterNormalTexture = textureLoader.load('/textures/water/normal.jpg')

waterNormalTexture.wrapS = waterNormalTexture.wrapT = THREE.RepeatWrapping

/**
 * Meshes
 */
// Sky
const time = ((new Date().getTime() / 1000) % 86400) / 86400 // 0 -> 1
// const time = 0.747 // 0 -> 1
const orientation = 0.5 + time * 2 // 0.5 -> 2.5
const rayleigh = Math.abs(Math.sin(time * Math.PI * 2) * 2) // 0 -> 2 -> 0 -> 2 -> 0

const sky = new Sky()
sky.scale.setScalar(45000)

const sun = new THREE.Vector3()

const skyUniforms = sky.material.uniforms
skyUniforms['turbidity'].value = 10
skyUniforms['rayleigh'].value = rayleigh
skyUniforms['mieCoefficient'].value = 0.005
skyUniforms['mieDirectionalG'].value = 0.6

const theta = Math.PI * (orientation)
const phi = 2 * Math.PI * (0.25 - 0.5)

sun.x = Math.cos(phi)
sun.y = Math.sin(phi) * Math.sin(theta)
sun.z = Math.sin(phi) * Math.cos(theta)

skyUniforms['sunPosition'].value.copy(sun)

scene.add(sky)

// Water
const waterGeometry = new THREE.PlaneGeometry(1000, 1000)
const waterOptions = {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormalTexture,
    alpha: 1,
    sunDirection: sun,
    sunColor: 0xffffff,
    waterColor: 0x001122,
    distortionScale: 3,
    fog: scene.fog !== undefined
}

const water = new Water(waterGeometry, waterOptions)
water.rotation.x = - Math.PI * 0.5

const waterUniforms = water.material.uniforms
waterUniforms['size'].value = 10

scene.add(water)

/**
 * Lights
 */
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
// scene.add(ambientLight)

// const pointLight = new THREE.PointLight(0xffffff, 10)
// pointLight.position.y = 3
// scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(3, 2.5, 20)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true
// renderer.outputEncoding = THREE.sRGBEncoding
// renderer.toneMapping = THREE.ReinhardToneMapping
renderer.outputEncoding = THREE.LinearEncoding
renderer.toneMapping = THREE.NoToneMapping
renderer.toneMappingExposure = 1.5
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Animate water
    water.material.uniforms['time'].value = elapsedTime * 0.5
    console.log(orientation)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()