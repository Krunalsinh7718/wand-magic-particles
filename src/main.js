import * as THREE from 'three';
import { Timer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui'
import particlesVertexShader from './shaders/vertex.vert'
import particlesFragmentShader from './shaders/fragment.frag'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import gsap from 'gsap';
import { getMeshesByName } from './common-functions.js';

//gui
const gui = new GUI();
const debugObject = {}

//loaders
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/models/draco/')
const gltfLoader = new GLTFLoader()
// gltfLoader.setDRACOLoader(dracoLoader)

//sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () => {

    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    if (particles)
        particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
});

//scene setup
const scene = new THREE.Scene();

//camera setup
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2.0943, 0.3657, 1.0602)
scene.add(camera)

//renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

debugObject.clearColor = '#160920';
gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
renderer.setClearColor(debugObject.clearColor)

renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

//controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;


//wand group

const wandGroup = new THREE.Group(0, 0, 0);
scene.add(wandGroup)

const frogWorldPos = new THREE.Vector3(0, 0, 0);
const princeWorldPos = new THREE.Vector3(0, 0, 0);
//wand
const wandGeometry = new THREE.CylinderGeometry(0.008, 0.02, 0.5, 6);
const wandTexture = textureLoader.load('/images/wand-texture/crimson_handle.png');
wandTexture.colorSpace = THREE.SRGBColorSpace;
wandTexture.wrapS = THREE.RepeatWrapping;
wandTexture.wrapT = THREE.RepeatWrapping;
wandTexture.repeat.set(3, 1);
const wandMaterial = new THREE.MeshBasicMaterial({ map: wandTexture });
const wand = new THREE.Mesh(wandGeometry, wandMaterial);
wandGroup.add(wand);

const wandDummyPositionParticleWorldPosition = new THREE.Vector3();
const wandDummyPositionParticleGeo = new THREE.SphereGeometry(0.001);
const wandDummyPositionParticleMat = new THREE.MeshBasicMaterial({ color: "red" });
const wandDummyPositionParticle = new THREE.Mesh(wandDummyPositionParticleGeo, wandDummyPositionParticleMat);
wandGroup.add(wandDummyPositionParticle);
wandDummyPositionParticle.position.y = 0.24;

/**
 * Particles
 */
let particles = {};
particles.magicTarget = "frog";
particles.frogScale = 1;
particles.frogTranslate = { x: 0, y: 0, z: 0 };



gltfLoader.load("/models/frog-prince/frog-prince.glb", gltf => {

    particles.index = 0;
    particles.translate = -1;

    particles.modelWorld = gltf.scene;
    scene.add(particles.modelWorld);
    particles.modelWorld.translateY(particles.translate);

    particles.frog = getMeshesByName(particles.modelWorld, 'frog')[0];
    // console.log(particles.frog);

    // particles.frog.scale.set(1.01, 1.01, 1.01);
    // particles.frog.position.set(-0.01,0,-0.01);
    // gui.add(particles,'frogScale').min(1).max(2).step(0.001).onChange(e => particles.frog.scale.set(particles.frogScale, particles.frogScale, particles.frogScale))
    // gui.add(particles.frogTranslate,'x').min(-2).max(2).step(0.001).onChange(e => particles.frog.position.x = particles.frogTranslate.x )
    // gui.add(particles.frogTranslate,'y').min(-2).max(2).step(0.001).onChange(e => particles.frog.position.y = particles.frogTranslate.y )
    // gui.add(particles.frogTranslate,'z').min(-2).max(2).step(0.001).onChange(e => particles.frog.position.z = particles.frogTranslate.z )

    particles.frogMaterial = particles.frog.material;
    particles.frogMaterial.transparent = true;
    particles.frogMaterial.opacity = 1;
    // console.log("frog", particles.frog);

    particles.frogPosition = particles.frog.geometry.attributes.position;
    particles.base = getMeshesByName(particles.modelWorld, 'base')[0];
    particles.prince = getMeshesByName(particles.modelWorld, 'prince')[0];
    particles.prince.visible = false;
    particles.princeMaterial = particles.prince.material;
    particles.princeMaterial.transparent = true;
    particles.princeMaterial.opacity = 0;
    // console.log("prince opacity", particles.prince.material.opacity);


    particles.princePosition = particles.prince.geometry.attributes.position;

    particles.maxCount = 0;

    for (const position of [particles.frogPosition, particles.princePosition]) {
        if (position.count > particles.maxCount) {
            particles.maxCount = position.count;
        }
    }
    particles.positions = [];
    for (const position of [particles.frogPosition, particles.princePosition]) {
        const originalArray = position.array;
        const newArray = new Float32Array(particles.maxCount * 3);

        for (let i = 0; i < particles.maxCount; i++) {
            const i3 = i * 3;

            if (i3 < originalArray.length) {
                newArray[i3 + 0] = originalArray[i3 + 0];
                newArray[i3 + 1] = originalArray[i3 + 1];
                newArray[i3 + 2] = originalArray[i3 + 2];
            } else {
                const randomIndex = Math.floor(position.count * Math.random()) * 3;
                newArray[i3 + 0] = originalArray[randomIndex + 0];
                newArray[i3 + 1] = originalArray[randomIndex + 1];
                newArray[i3 + 2] = originalArray[randomIndex + 2];
            }
        }
        particles.positions.push(new THREE.BufferAttribute(newArray, 3));
    }
    const sizesArray = new Float32Array(particles.maxCount);
    for (let i = 0; i < particles.maxCount; i++) {
        sizesArray[i] = Math.random();

    }
     particles.magicParticlePositions = new Float32Array(particles.maxCount * 3);

    const center = new THREE.Vector3(0, 0.03, 0);
    const radius = 0.03;

    for (let i = 0; i < particles.maxCount; i++) {

        const pos = new THREE.Vector3();

        pos.setFromSpherical(
            new THREE.Spherical(
                Math.min(Math.random(), Math.random()),
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            )
        );

        pos.add(center);

        const i3 = i * 3;

        particles.magicParticlePositions[i3 + 0] = pos.x;
        particles.magicParticlePositions[i3 + 1] = pos.y;
        particles.magicParticlePositions[i3 + 2] = pos.z;
    }
    particles.positions.push(new THREE.BufferAttribute(particles.magicParticlePositions, 3));
    // console.log("particle pos", particles.positions);


    particles.geometry = new THREE.BufferGeometry();
    particles.geometry.setAttribute('position', particles.positions[2]);
    particles.geometry.setAttribute('aPositionTarget', particles.positions[0]);
    particles.geometry.setAttribute('aPositionTarget1', particles.positions[1]);
    particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1));
    particles.geometry.setIndex(null);

    // Material
    particles.uColorA = "#ff7300";
    particles.uColorB = "#0091ff";
    particles.material = new THREE.ShaderMaterial({
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: particlesVertexShader,
        fragmentShader: particlesFragmentShader,
        uniforms:
        {
            uTime: new THREE.Uniform(0),
            uMinY: new THREE.Uniform(10),
            uMaxY: new THREE.Uniform(0),
            uSize: new THREE.Uniform(0.01),
            uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
            uProgress: new THREE.Uniform(0),
            uOpacity: new THREE.Uniform(1),
            uColorA: new THREE.Uniform(new THREE.Color(particles.uColorA)),
            uColorB: new THREE.Uniform(new THREE.Color(particles.uColorB)),
            uFrogWorldPos: new THREE.Uniform(new THREE.Vector3()),
            uWandWorldPos: new THREE.Uniform(new THREE.Vector3()),
            uPrinceWorldPos: new THREE.Uniform(new THREE.Vector3()),
        }
    })

    // Points
    particles.points = new THREE.Points(particles.geometry, particles.material)
    particles.points.translateY(particles.translate);
    particles.points.frustumCulled = false

    scene.add(particles.points)

    gui.add(particles.material.uniforms.uProgress, 'value').min(0).max(1).step(0.001).name('uProgress').listen();
    gui.add(particles.material.uniforms.uOpacity, 'value').min(0).max(1).step(0.001).name('uOpacity').listen();
})
const animaButton = document.querySelector("#animationButton");
animaButton.addEventListener('click', e => {
    animaButton.setAttribute('disabled', true);
    let tl = gsap.timeline({
        onComplete: () => {
            if (particles.magicTarget === "frog") {
                particles.geometry.setAttribute('aPositionTarget', particles.positions[1]);
                particles.geometry.setAttribute('aPositionTarget1', particles.positions[0]);
                
                particles.magicTarget = "prince";

            } else if (particles.magicTarget === "prince") {
                particles.geometry.setAttribute('aPositionTarget', particles.positions[0]);
                particles.geometry.setAttribute('aPositionTarget1', particles.positions[1]);
                particles.magicTarget = "frog";

            }
            // console.log(particles.magicTarget);
            animaButton.removeAttribute("disabled")

        }
    });
    if (particles.magicTarget === "frog") {
        // console.log("particles opacity",particles.material.uniforms.uOpacity.value);
        

        tl.to(
            particles.material.uniforms.uProgress,
            { value: 0.5, duration: 1, ease: 'linear' }
        ).to(
            particles.frogMaterial,
            { opacity: 0, duration: 1, ease: 'linear' },
            "<"
        ).set(
            particles.frog,
            { visible: false },
        ).to(
            particles.material.uniforms.uProgress,
            { value: 1, duration: 3, ease: 'linear' },
            "+=0.3"
        ).set(
            particles.prince,
            { visible: true },
        ).to(
            particles.princeMaterial,
            { opacity: 1, duration: 1, ease: 'linear' }
        ).to(
            particles.material.uniforms.uOpacity,
            { value: 0, duration: 1, ease: "linear" },
            "<"
        ).to(
            particles.material.uniforms.uProgress,
            { value: 0, duration: 1, ease: 'linear' }
        ).to(
            particles.material.uniforms.uOpacity,
            { value: 1, duration: 1, ease: 'linear' }
        )


    }
    if (particles.magicTarget === "prince") {

        tl.to(
            particles.material.uniforms.uProgress,
            { value: 0.5, duration: 1, ease: 'linear' }
        ).to(
            particles.princeMaterial,
            { opacity: 0, duration: 1, ease: 'linear' },
            "<"
        ).set(
            particles.prince,
            { visible: false },
        ).to(
            particles.material.uniforms.uProgress,
            { value: 1, duration: 3, ease: 'linear' },
             "+=0.3"
        ).set(
            particles.frog,
            { visible: true },
        ).to(
            particles.frogMaterial,
            { opacity: 1, duration: 1, ease: 'linear' }
        ).to(
            particles.material.uniforms.uOpacity,
            { value: 0, duration: 1, ease: "linear" },
            "<"
        ).to(
            particles.material.uniforms.uProgress,
            { value: 0, duration: 1, ease: 'linear' }
        ).to(
            particles.material.uniforms.uOpacity,
            { value: 1, duration: 1, ease: 'linear' }
        )
    }


})

//skybox
textureLoader.load(
    '/images/magic-world-skymap/magic-world.png',
    (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping =
            THREE.EquirectangularReflectionMapping;

        scene.background = texture;
        scene.environment = texture;
    }
);

//floor
const textureColor = textureLoader.load("/images/floor/cracked_concrete_diff_1k.png");
textureColor.colorSpace = THREE.SRGBColorSpace;
const textureARM = textureLoader.load("/images/floor/cracked_concrete_arm_1k.png");
const textureDisplace = textureLoader.load("/images/floor/cracked_concrete_disp_1k.png");
const textureNormal = textureLoader.load("/images/floor/cracked_concrete_nor_gl_1k.png");

const floorGeometry = new THREE.CircleGeometry(5, 32);
const floorMaterial = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    map: textureColor,
    displacementMap: textureDisplace,
    displacementScale: 0.08,
    displacementBias: -0.04,
    normalMap: textureNormal,
    metalnessMap: textureARM,
    roughnessMap: textureARM,
})
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -1.03;
floor.rotation.x = - Math.PI * 0.5;
scene.add(floor);



const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
const raycaster = new THREE.Raycaster();
const intersection = new THREE.Vector3();

//lights
const ambient = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambient);



//animation loop
const timer = new Timer();
function animate() {
    //timer
    timer.update();
    const elapsedTime = timer.getElapsed();

    //update magic particle material
    if (particles.magic)
        particles.magicParticleMaterial.uniforms.uTime.value = elapsedTime;

    if(particles.points)
        particles.material.uniforms.uTime.value = elapsedTime;


    //get magic particle position
    wandDummyPositionParticle.getWorldPosition(wandDummyPositionParticleWorldPosition);

    //wand movement
    raycaster.setFromCamera(mouse, camera);

    const intersection = raycaster.intersectObject(floor);
    if (intersection.length) {
        const distOffsetX = wandGroup.position.x - intersection[0].point.x;
        const distOffsetZ = wandGroup.position.z - intersection[0].point.z;
        wandGroup.position.x -= distOffsetX * 0.05;
        wandGroup.position.z -= distOffsetZ * 0.05;
    }


    //magic particle movement
    if (particles.prince) {
        particles.prince.getWorldPosition(princeWorldPos);
    }
    if (particles.frog) {
        particles.frog.getWorldPosition(frogWorldPos);
    }
     if (particles.points) {
        particles.material.uniforms.uFrogWorldPos.value.copy(
            frogWorldPos
        );

        particles.material.uniforms.uWandWorldPos.value.copy(
            particles.points.position
        );

        particles.material.uniforms.uPrinceWorldPos.value.copy(
            princeWorldPos
        );
    }
    


    if(particles.points){
        particles.points.position.copy(
            {
                x: wandDummyPositionParticleWorldPosition.x,
                y: wandDummyPositionParticleWorldPosition.y,
                z: wandDummyPositionParticleWorldPosition.z
            }
        );
    }
    if (particles.frog && particles.magicTarget === "frog") {

        wandGroup.lookAt(frogWorldPos);
    }
    if (particles.prince && particles.magicTarget === "prince") {
        wandGroup.lookAt(princeWorldPos);
    }

    // const rotateAngle = elapsedTime * 0.01;
    floor.rotation.z = elapsedTime * 0.02


    //update controls
    controls.update();

    //render
    renderer.render(scene, camera);
}
