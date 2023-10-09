import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadMixamoAnimation } from './loadMixamoAnimation.js';
import ChatBox from './chatbox';

const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  
  const [playAnimationHandler, setPlayAnimationHandler] = React.useState<(animation: string) => void>(() => {});
  /*
  let playAnimationHandler = function(animation: string) {
    console.log('placeholder playAnimationHandler: ' + animation);
  }
  */

  function init() {
    const avatarMap = {} as any;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current!.appendChild(renderer.domElement);

    function onWindowResize() {

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

    }

    window.addEventListener('resize', onWindowResize);

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

    const AVATAR_ID_1 = 'avatar1';
    const AVATAR_ID_2 = 'avatar2';

    const animations = [
      'Idle',
      'Jumping',
      'Chicken Dance',
      'Gangnam Style',
      'Samba Dancing',
      'Silly Dancing',
      'Snake Hip Hop Dance',
      'Twist Dance',
      'Wave Hip Hop Dance',

      // 'Running',
      // 'Walking',
    ];

    function getAnimationUrl(name: string) {
      return `./animations/${name}.fbx`;
    }

    const clock = new THREE.Clock();
    const animate = function () {
      requestAnimationFrame(animate);

      const deltaTime = clock.getDelta();

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      /*
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
      */

      // loop through avatarMap
      for (var id in avatarMap) {
        const avatar = avatarMap[id];

        if (avatar.mixer) {
          avatar.mixer.update(deltaTime);
        }

        if (avatar.vrm) {
          avatar.vrm.update(deltaTime);
        }
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
    // const model2Url = 'https://w3s.link/ipfs/QmQcV1m51AXNdZUsQNoPeEyVFWbnWgzdWKASdxEuaT3VEd/default_1802.vrm';
    const model3Url = 'https://w3s.link/ipfs/QmZiCnsyNaTvazx5b38zHZJGxQpMZHFWs1n4veoiAdLcoN/default_877.vrm';
    const model4Url = 'https://w3s.link/ipfs/QmRZG25uNX1RHWnpZpx4DkAf7J8a1ZMhDUAZFXpzMCzxUS/default_1699.vrm';
    const model5Url = 'https://w3s.link/ipfs/QmVPHNjZoX9JgFZWU9o2EczpyQZXSqnooV5pZumBx8jLAS/default_1904.vrm'

    const model1Url = defaultModelUrl;
    const model2Url = model3Url;

    function loadUniqueVrm(modelUrl: string, callback: (err: any, data: any) => void) {

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
            callback(null, {
              gltf: gltf,
              vrm: vrm
            });
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

    /*
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
    */

    async function createAvatar(id: string, modelUrl: string) {
      const avatar = {
        id: id as string,
        modelUrl: modelUrl as string,
        gltf: undefined as any,
        vrm: undefined as any,
        mixer: undefined as any,
        animationActions: {} as any,
        currentAnimationAction: null
      };

      avatarMap[id] = avatar;

      const data: any = await (function () {
        return new Promise((resolve, reject) => {
          loadUniqueVrm(modelUrl, (err: any, data: any) => {
            resolve(data);
          });
        })
      })();

      avatar.gltf = data.gltf;
      avatar.vrm = data.vrm;
      avatar.mixer = new THREE.AnimationMixer(data.vrm.scene);
      avatar.mixer.timeScale = 1.0;

      // load animations
      for (var i = 0; i < animations.length; i++) {
        const animation = animations[i];
        const animationUrl = getAnimationUrl(animation);

        console.log('Loading animation: ' + animationUrl);

        const clip = await (function () {
          return new Promise((resolve, reject) => {
            loadMixamoAnimation(animationUrl, avatar.vrm).then((clip) => {
              resolve(clip);
            });
          })
        })();

        avatar.animationActions[animation] = avatar.mixer.clipAction(clip);
      }

      return avatar;
    }

    function playAnimation(id: string, inputAnimation: string) {
      // get correct case animation from input animation (which is lowercase)
      const animationList = Object.keys(avatarMap[id].animationActions);

      console.log('animationList', animationList);

      const animationIndex = animationList.findIndex((item) => {
        return item.toLowerCase() == inputAnimation.toLowerCase();
      });

      if (animationIndex == -1) {
        console.error('Animation not found: ' + inputAnimation);
        return;
      }

      const animation = animationList[animationIndex];

      const avatar = avatarMap[id];

      if (!avatar) {
        console.error('Avatar not found: ' + id);
        return;
      }

      const animationAction = avatar.animationActions[animation];

      if (!animationAction) {
        console.error('Animation action not found: ' + animation);
        return;
      }

      if (avatar.currentAnimationAction == animationAction) {
        return;
      }

      // fade out current animation
      const DURATION = 0.5;

      if (avatar.currentAnimationAction) {
        animationAction.reset();
        avatar.currentAnimationAction
          .crossFadeTo(animationAction, DURATION, true)
          .play();
      } else {
        animationAction.reset();
        animationAction.play();
      }

      avatar.currentAnimationAction = animationAction;

      // animationAction.reset();
      // animationAction.play();

      /*
      avatar.currentAnimationAction.reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(DURATION)
          .play();
      */
    }

    async function initializeAvatars() {
      const avatar1 = await createAvatar(AVATAR_ID_1, model1Url);

      scene.add(avatar1.vrm.scene);
      avatar1.vrm.scene.position.set(0.8, 0, 0);
      avatar1.vrm.scene.rotation.y = Math.PI / 2;

      const initialAnimation = 'Standard Idle';
      

      const avatar2 = await createAvatar(AVATAR_ID_2, model2Url);
      scene.add(avatar2.vrm.scene);
      avatar2.vrm.scene.position.set(-0.8, 0, 0);
      avatar2.vrm.scene.rotation.y = -Math.PI / 2;

      playAnimation(AVATAR_ID_1, initialAnimation);
      playAnimation(AVATAR_ID_2, initialAnimation);

      /*
      'Jumping',
      'Chicken Dance',
      'Gangnam Style',
      'Samba Dancing',
      'Silly Dancing',
      'Snake Hip Hop Dance',
      'Twist Dance',
      'Wave Hip Hop Dance',
      */

      /*
      setTimeout(() => {
        playAnimation(AVATAR_ID_1, 'Jumping');
        playAnimation(AVATAR_ID_2, 'Jumping');

        setTimeout(() => {
          playAnimation(AVATAR_ID_1, 'Chicken Dance');
          playAnimation(AVATAR_ID_2, 'Chicken Dance');

          setTimeout(() => {
            playAnimation(AVATAR_ID_1, 'Gangnam Style');
            playAnimation(AVATAR_ID_2, 'Gangnam Style');

            setTimeout(() => {
              playAnimation(AVATAR_ID_1, 'Samba Dancing');
              playAnimation(AVATAR_ID_2, 'Samba Dancing');

              setTimeout(() => {
                playAnimation(AVATAR_ID_1, 'Silly Dancing');
                playAnimation(AVATAR_ID_2, 'Silly Dancing');

                setTimeout(() => {
                  playAnimation(AVATAR_ID_1, 'Snake Hip Hop Dance');
                  playAnimation(AVATAR_ID_2, 'Snake Hip Hop Dance');

                  setTimeout(() => {
                    playAnimation(AVATAR_ID_1, 'Twist Dance');
                    playAnimation(AVATAR_ID_2, 'Twist Dance');

                    setTimeout(() => {
                      playAnimation(AVATAR_ID_1, 'Wave Hip Hop Dance');
                      playAnimation(AVATAR_ID_2, 'Wave Hip Hop Dance');
                    }, 2000);
                  }, 2000);
                }, 2000);
              }, 2000);
            }, 2000);
          }, 2000);
        }, 2000);
      }, 2000);
      */
    }

    initializeAvatars();

    const playAnimationHandlerLocal = (role: string, animation: string) => {
      console.log('playAnimationHandler: ' + animation);

      const avatarId = role == 'user' ? AVATAR_ID_1 : AVATAR_ID_2;

      playAnimation(avatarId, animation);
    }

    console.log('previous playAnimationHandler: ' + playAnimationHandler);
    console.log('new playAnimationHandler: ', playAnimationHandlerLocal);

    setPlayAnimationHandler(() => {
      return playAnimationHandlerLocal;
    });
  }

  useEffect(() => {
    if (!rendererRef.current) {
      init();
    }
  }, [playAnimationHandler]);

  useEffect(() => {
    console.log('current playAnimationHandler', playAnimationHandler);
  }, [playAnimationHandler]);

  return (
    <div>
      <style type="text/css">
        {`
            .chatbox_container {
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              width: 300px;
              background-color: gray;
              overflow-y: scroll;
            }
        `}
      </style>
      <div ref={containerRef} />
      <div className="chatbox_container">
        <ChatBox 
          playAnimationHandler={playAnimationHandler}
        />
      </div>
    </div>
  );
};

export default Scene;

