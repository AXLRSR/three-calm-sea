import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

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
const sky = new Sky()
sky.scale.setScalar(45000)

const sun = new THREE.Vector3()

const skyUniforms = sky.material.uniforms
skyUniforms['turbidity'].value = 10
skyUniforms['mieCoefficient'].value = 0.005
skyUniforms['mieDirectionalG'].value = 0.6

const phi = 2 * Math.PI * (0.25 - 0.5)

sun.x = Math.cos(phi)

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
 * Sounds
 */
const listener = new THREE.AudioListener()
camera.add(listener)

const sound = new THREE.Audio(listener)

const audioLoader = new THREE.AudioLoader()
audioLoader.load('/sounds/sea/waves.mp3', function(buffer) {
    sound.setBuffer(buffer)
    sound.setLoop(true)
    sound.setVolume(0.08)
    sound.play()
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Command input
 */
const commandInput = document.querySelector('.command__input')
let commandInputNumber = null

window.addEventListener('keydown', (e) =>
{
    if(e.key === '/')
    {
        commandInput.style.display = 'block'
        commandInput.focus()
    }
})

commandInput.addEventListener('keydown', (e) =>
{
    if(e.key === 'Enter')
    {
        let commandInputValue = commandInput.value

        if(/^\/time set /.test(commandInputValue))
        {
            let commandInputArray = commandInputValue.split(' ')
            commandInputNumber = parseInt(commandInputArray[commandInputArray.length - 1])
        }

        commandInput.value = ''
        commandInput.style.display = 'none'
    }
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Animate water
    water.material.uniforms['time'].value = elapsedTime * 0.8

    // Update sky
    let time = null
    
    if(commandInputNumber !== null)
    {
        time = commandInputNumber / 1000
    } else {
        time = ((new Date().getTime() / 1000) % 86400) / 86400
    }
    
    let orientation = 0.5 + time * 2
    let rayleigh = Math.abs(Math.sin(time * Math.PI * 2) * 2)

    let skyUniforms = sky.material.uniforms
    skyUniforms['rayleigh'].value = rayleigh

    let theta = Math.PI * (orientation)

    sun.y = Math.sin(phi) * Math.sin(theta)
    sun.z = Math.sin(phi) * Math.cos(theta)

    skyUniforms['sunPosition'].value.copy(sun)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()