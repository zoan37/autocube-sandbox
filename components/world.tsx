import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);

  function init() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    rendererRef.current = renderer;

    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current!.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    // Add ambient light
    var ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    // Adding a grid to the scene
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Adding orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    camera.position.z = 5;
    camera.position.y = 2;

    const animate = function () {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const vrmList = [];

    const helperRoot = new THREE.Group();
    helperRoot.renderOrder = 10000;
    scene.add(helperRoot);

    helperRoot.visible = true;

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

    loadUniqueVrm(defaultModelUrl, function (vrm) {
      const idleAnimation = '/animations/Great Sword Idle.fbx'
      // const idleAnimation = '/animations/Great Sword Slash.fbx'
      // const idleAnimation = '/animations/Draw A Great Sword.fbx'
      // const idleAnimation = '/animations/Great Sword Crouching.fbx'

      // loadFBX(idleAnimation)

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

