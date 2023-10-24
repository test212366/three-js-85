import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
import grain from './download.jpg'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'

import quadSheader from './shaders/quad.glsl'
const createInputEvents = require('simple-input-events');

import model from './model.glb'
import modelTexture from './model.webp'
import test from './meow.png'

import VirtualScroll from 'virtual-scroll'

const scroller = new VirtualScroll()
import {} from 'simple-input-events'

export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom

		this.event = createInputEvents(window)
		this.target = new THREE.Vector2()
		this.mouse = new THREE.Vector2()

		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		// this.renderer.setClearColor(0xeeeeee, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 1000
		)
 
		this.camera.position.set(0, 0, 2) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true




		this.initFinalScene()
		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		// this.addLights()

 
 
	}

	mouseEvents() {
		this.event.on('move', (uv) => {
			console.log(uv);
			this.mouse.x  = uv[0] -.5
			this.mouse.y  = -uv[1] + .5

		})
	}
	initPostProcessing() {

	}

	initFinalScene() {
		this.finalScene = new THREE.Scene()
		this.finalCamera = new THREE.OrthographicCamera(-1 * this.camera.aspect, 1 * this.camera.aspect, 1, -1, -100, 100)

		this.materialQuad = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				resolution: {value: new THREE.Vector4()},
				uTexture: {value: new THREE.TextureLoader().load(modelTexture)},
				uGrain: {value: new THREE.TextureLoader().load(grain)}
			},
			vertexShader,
			fragmentShader: quadSheader
		})

		this.dummy = new THREE.Mesh(
			new THREE.PlaneGeometry(1,1),
			this.materialQuad
		)
		this.finalScene.add(this.dummy)

		this.blackGackground = new THREE.Mesh(
			new THREE.PlaneGeometry(4,4),
			new THREE.MeshBasicMaterial({color: 0x00000})
		)
		this.blackGackground.position.z = -1
		this.finalScene.add(this.blackGackground)
		// scroller.on(e => {
		// 	this.finalScene.position.y = e.y / 1000
		// }) 

	}
	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				resolution: {value: new THREE.Vector4()},
				uTexture: {value: new THREE.TextureLoader().load(modelTexture)},

			},
			vertexShader,
			fragmentShader
		})
		
		// this.geometry = new THREE.PlaneGeometry(1,1,1,1)
		// this.plane = new THREE.Mesh(this.geometry, this.material)
 
		// this.scene.add(this.plane)

		this.gltf.load(model, (gltf) => {
			
			let mesh = gltf.scene.children[0]
			mesh.position.set(0,0,0)
			mesh.scale.set(0.01, 0.01, 0.01)
			mesh.material = this.material
			let uv = mesh.geometry.attributes.uv.array

			for (let i = 0; i < uv.length; i+=4) {
				uv[i] = 0
				uv[i + 1] = 0
				uv[i + 2] = 1
				uv[i + 3] = 0

				
			}
			mesh.geometry.attributes.uv.needsUpdate = true


			this.scene.add(mesh)
		
		})
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		this.material.uniforms.time.value = this.time
		 
		//this.renderer.setRenderTarget(this.renderTarget)
		// this.renderer.render(this.scene, this.camera)

		this.renderer.setRenderTarget(this.renderTarget)
		this.materialQuad.uniforms.uTexture.value = this.renderTarget.texture
		this.renderer.render(this.scene, this.camera)
		this.renderer.setRenderTarget(null)
		this.renderer.render(this.finalScene, this.finalCamera)
			// this.renderer.render(this.finalScene, this.finalCamera)

		//this.renderer.setRenderTarget(null)
 
		requestAnimationFrame(this.render.bind(this))
 
		this.target.lerp(this.mouse, 0.1)
		this.finalScene.position.y = this.target.y / 5
		this.finalScene.position.x = this.target.x / 5

		this.scene.position.x = -this.target.x / 3
		this.scene.position.y = -this.target.y / 3


	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 