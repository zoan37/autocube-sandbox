import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadMixamoAnimation } from './loadMixamoAnimation.js';

const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);

  function init() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current!.appendChild(renderer.domElement);

    function onWindowResize() {

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize( window.innerWidth, window.innerHeight );

    }

    window.addEventListener( 'resize', onWindowResize );

    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    const scene = new THREE.Scene();
    // alice blue color
    // scene.background = new THREE.Color(0xF0F8FF);
    scene.background = new THREE.Color(0xe0e0e0);
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    // Add ambient light
    /*
    var ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);
    */

    // lights

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 1);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 20, 10);
    scene.add(dirLight);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    // Adding a grid to the scene
    // const gridColor = 0xD3D3D3;
    // const gridHelper = new THREE.GridHelper(10, 10, gridColor, gridColor);
    // scene.add(gridHelper);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    scene.add(mesh);

    const grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // Adding orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 50;

    camera.position.z = 5;
    camera.position.y = 2;

    const vrmList = [] as any[];
    const mixerList = [] as any[];

    const clock = new THREE.Clock();
    const animate = function () {
      requestAnimationFrame(animate);

      const deltaTime = clock.getDelta();

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      // loop through mixer list
      for (let i = 0; i < mixerList.length; i++) {
        const mixer = mixerList[i];

        mixer.update(deltaTime);
      }

      // loop through vrm list
      for (let i = 0; i < vrmList.length; i++) {
        const vrm = vrmList[i];

        vrm.update(deltaTime);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const helperRoot = new THREE.Group();
    helperRoot.renderOrder = 10000;
    scene.add(helperRoot);

    helperRoot.visible = false;

    const defaultModelUrl = 'https://w3s.link/ipfs/QmUmn19HHPVEdREmz46K8YToChNCh3eHb9XWJUT5PLoAsL/default_103.vrm';

    function loadUniqueVrm(modelUrl: string, callback: (vrm: any) => void) {

      const loader = new GLTFLoader();
      loader.crossOrigin = 'anonymous';

      helperRoot.clear();

      loader.register((parser) => {

        return new VRMLoaderPlugin(parser, { helperRoot: helperRoot, autoUpdateHumanBones: true });

      });

      loader.load(
        // URL of the VRM you want to load
        modelUrl,

        // called when the resource is loaded
        (gltf) => {

          const vrm = gltf.userData.vrm;

          vrmList.push(vrm);

          scene.add(vrm.scene);

          // Disable frustum culling
          vrm.scene.traverse((obj: THREE.Object3D) => {

            obj.frustumCulled = false;

          });

          // rotate if the VRM is VRM0.0
          VRMUtils.rotateVRM0(vrm);

          console.log('vrm', vrm);

          if (callback) {
            callback(vrm);
          }
        },

        // called while loading is progressing
        (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),

        // called when loading has errors
        (error) => console.error(error),
      );
    }

    function loadFBXForVRM(animationUrl: string, vrm: any) {
      // currentAnimationUrl = animationUrl;

      // create AnimationMixer for VRM
      const mixer = new THREE.AnimationMixer(vrm.scene);

      mixerList.push(mixer);

      // Load animation
      loadMixamoAnimation(animationUrl, vrm).then((clip) => {
        // Apply the loaded animation to mixer and play
        mixer.clipAction(clip).play();
        // mixer.timeScale = params.timeScale;
        mixer.timeScale = 1.0;
      });
    }

    loadUniqueVrm(defaultModelUrl, function (vrm) {
      // const idleAnimation = '/animations/Standard Idle.fbx';
      const idleAnimation = '/animations/Chicken Dance.fbx';
      // const idleAnimation = '/animations/Silly Dancing.fbx';

      loadFBXForVRM(idleAnimation, vrm);

      vrm.scene.traverse((child: THREE.Object3D) => {
        const name = child.name.trim(); // Exported bones don't have dots in their names

        // console.log(name, child);

        if (name == 'rightHand') {
          const rightHand = child;
        }
      });
    });
  }

  useEffect(() => {
    if (!rendererRef.current) {
      init();
    }
  }, []);

  return <div ref={containerRef} />;
};

export default Scene;

