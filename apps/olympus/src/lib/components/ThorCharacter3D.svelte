<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextLayout } from 'utils-layout';
	import { stateModal } from 'state-shared';

	import { BOARD_LAYOUT_BY_TYPE } from '../../game/constants';
	import { stateGame } from '../../game/stateGame.svelte';

	let container = $state<HTMLDivElement | null>(null);
	let modelReady = $state(false);

	const THOR_GLB_URL = '/models/thor.glb';

	// Match ThorHammer3D — only render once the loading/intro screen is gone.
	const { stateLayout, stateLayoutDerived } = getContextLayout();
	const sceneOverlayActive = $derived(
		stateGame.transitionActive || stateGame.freeSpinIntroActive || stateGame.freeSpinOutroActive,
	);
	const visible = $derived(!stateLayout.showLoadingScreen && modelReady);

	const layoutType = $derived(stateLayoutDerived.layoutType());
	const mainLayout = $derived(stateLayoutDerived.mainLayout());
	const canvasSizes = $derived(stateLayoutDerived.canvasSizes());

	type Placement =
		| { mode: 'side'; left: number; top: number; width: number; height: number }
		| { mode: 'hidden' };

	// Mirror of the hammer placement but anchored to the RIGHT edge of the
	// frame. On portrait/tablet there's no spare vertical room above the
	// frame (the hammer already lives there), so we hide Thor instead of
	// stacking two heroes on top of each other.
	const placement = $derived.by<Placement>(() => {
		const board = BOARD_LAYOUT_BY_TYPE[layoutType];
		const scale = mainLayout.scale;

		const frameW = mainLayout.width * board.fit.w * scale;
		const frameH = mainLayout.height * board.fit.h * scale;
		const frameCx =
			canvasSizes.width * 0.5 +
			(mainLayout.width * board.center.x - mainLayout.width * 0.5) * scale;
		const frameCy =
			canvasSizes.height * 0.5 +
			(mainLayout.height * board.center.y - mainLayout.height * 0.5) * scale;

		if (layoutType === 'portrait' || layoutType === 'tablet') {
			return { mode: 'hidden' };
		}

		// Desktop / landscape: touch the RIGHT edge of the reel frame.
		// Camera lookAt y=0.2 → head sits at ~22% from canvas top (was 9%), giving
		// enough room even during the strike animation (scaleY=1.07 + bobY=0.03).
		// Foot fraction raised to 0.90 to match the new camera framing.
		// Canvas aspect 0.65 widens the horizontal frustum so pauldrons don’t clip.
		const frameRight = frameCx + frameW / 2;
		const frameBottom = frameCy + frameH / 2;
		const h = frameH * 0.85;
		const w = h * 0.80;               // wider aspect → shoulders / arms safely in frame
		const left = Math.min(frameRight + 14, canvasSizes.width - w);
		const groundY = frameBottom + 55;
		const top = groundY - h * 0.87;   // 0.90 matches feet-fraction with lookAt y=0.2

		return { mode: 'side', left, top, width: w, height: h };
	});

	const hidden = $derived(placement.mode === 'hidden');
	const modalOpen = $derived(stateModal.modal !== null);
	const dimmed = $derived(stateGame.freeSpinOutroActive);
	const styleStr = $derived.by(() => {
		if (placement.mode === 'hidden') return '';
		return `left:${placement.left}px;top:${placement.top}px;width:${placement.width}px;height:${placement.height}px;`;
	});

	onMount(() => {
		if (!container) return;

		const canvas = document.createElement('canvas');
		const gl =
			canvas.getContext('webgl2') ||
			canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl');

		if (!gl) {
			stateGame.thor3DReady = true;
			return;
		}

		let disposed = false;
		let raf = 0;
		let cleanup: (() => void) | null = null;

		let renderer: import('three').WebGLRenderer | null = null;
		let scene: import('three').Scene | null = null;
		let camera: import('three').PerspectiveCamera | null = null;
		let thor: import('three').Object3D | null = null;
		let mixer: import('three').AnimationMixer | null = null;

		let baseY = 0;
		const startTime = performance.now();
		let lastTime = startTime;

		const init = async () => {
			const THREE = await import('three');
			const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
			const { RoomEnvironment } = await import(
				'three/examples/jsm/environments/RoomEnvironment.js'
			);

			if (disposed || !container) return;

			const width = container.clientWidth;
			const height = container.clientHeight;

			renderer = new THREE.WebGLRenderer({
				alpha: true,
				antialias: true,
				powerPreference: 'high-performance'
			});

			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(width, height);
			renderer.setClearColor(0x000000, 0);
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1.15;
			renderer.outputColorSpace = THREE.SRGBColorSpace;

			container.appendChild(renderer.domElement);

			renderer.domElement.style.width = '100%';
			renderer.domElement.style.height = '100%';
			renderer.domElement.style.display = 'block';
			renderer.domElement.style.pointerEvents = 'none';

			scene = new THREE.Scene();

			const pmrem = new THREE.PMREMGenerator(renderer);
			scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

			// Wide-ish FOV with enough z-distance to keep the full body in
			// frame from head to feet — was clipping the legs before.
			camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
			camera.position.set(-0.1, 0.0, 6.4);
			// lookAt y=0.2 (was -0.2) → head projects to ~22% from canvas top instead
			// of ~9%, preventing clipping even during the strike-animation scaleY peak.
			camera.lookAt(0, 0.33, 0);

			const ambient = new THREE.AmbientLight(0xfff4e6, 0.4);
			scene.add(ambient);

			// Key light from the LEFT (toward the frame) so Thor faces the reels
			// well-lit while his outer silhouette gets the cooler rim treatment.
			const keyWhite = new THREE.DirectionalLight(0xffffff, 2.8);
			keyWhite.position.set(-2.5, 4, 4);
			keyWhite.castShadow = true;
			keyWhite.shadow.mapSize.set(1024, 1024);
			keyWhite.shadow.camera.near = 0.5;
			keyWhite.shadow.camera.far = 20;
			keyWhite.shadow.bias = -0.0005;
			scene.add(keyWhite);

			// Cool blue rim from outer side (right) — storm-god vibe.
			const rimBlue = new THREE.DirectionalLight(0x9ed8ff, 1.4);
			rimBlue.position.set(-4, 2, -1);
			scene.add(rimBlue);

			// Warm gold fill from the reels side for cinematic skin tone.
			const fillGold = new THREE.DirectionalLight(0xffb060, 1.0);
			fillGold.position.set(3.5, 1.5, 2);
			scene.add(fillGold);

			const kicker = new THREE.PointLight(0xfff3e0, 0.7, 8);
			kicker.position.set(0, -1.4, 2);
			scene.add(kicker);

			// Pulsing blue hum near the chest / hammer hand.
			const lightningGlow = new THREE.PointLight(0x66ccff, 1.8, 5);
			lightningGlow.position.set(0.4, 0.4, 1.5);
			scene.add(lightningGlow);

			const shadowGeo = new THREE.PlaneGeometry(6, 6);
			const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
			const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
			shadowPlane.rotation.x = -Math.PI / 2;
			shadowPlane.position.y = -1.1;
			shadowPlane.receiveShadow = true;
			scene.add(shadowPlane);

			try {
				const loader = new GLTFLoader();
				const gltf = await loader.loadAsync(THOR_GLB_URL);

				if (disposed) return;

				thor = gltf.scene;

				// Hide the hammer meshes that ship inside the GLB. The Marvel
				// Rivals export bundles the hammer as skinned meshes that use
				// the 'Hammer_Weapon' material — nuke them so the character
				// reads cleanly next to the standalone ThorHammer3D prop.
				thor.traverse((obj) => {
					const mesh = obj as import('three').Mesh;
					if (!(mesh as any).isMesh) return;

					const getName = (m: import('three').Material) =>
						((m as any).name || '').toLowerCase();

					const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
					const isHammer = materials.some(
						(m) => m && getName(m).includes('hammer')
					);

					if (isHammer) {
						mesh.visible = false;
						// Belt and braces — also skip from shadow / raycasts.
						mesh.castShadow = false;
						mesh.receiveShadow = false;
					}
				});

				// Compute bounds AFTER hiding the hammer so the character scales
				// based on his own silhouette, not the oversized weapon prop.
				const box = new THREE.Box3();
				thor.traverse((obj) => {
					const mesh = obj as import('three').Mesh;
					if (!(mesh as any).isMesh || mesh.visible === false) return;
					box.expandByObject(mesh);
				});
				const size = new THREE.Vector3();
				const center = new THREE.Vector3();

				box.getSize(size);
				box.getCenter(center);

				// Match the hammer's authored target height so the two heroes
				// flanking the frame visually align.
				const targetHeight = 2.2;
				const scale = targetHeight / (size.y || 1);

				thor.scale.setScalar(scale);

				// Center horizontally / depth-wise, but anchor FEET to the shadow
				// plane so his weight reads as planted, not floating.
				const FLOOR_Y = -1.1;
				thor.position.x = -center.x * scale;
				thor.position.z = -center.z * scale;
				thor.position.y = FLOOR_Y - box.min.y * scale;

				thor.traverse((obj) => {
					const mesh = obj as import('three').Mesh;
					if (!(mesh as any).isMesh) return;

					if (mesh.visible === false) return;

					mesh.castShadow = true;
					mesh.receiveShadow = true;

					const tweak = (m: import('three').Material) => {
						const std = m as import('three').MeshStandardMaterial;
						if ('envMapIntensity' in std) std.envMapIntensity = 1.2;
						std.needsUpdate = true;
					};

					if (Array.isArray(mesh.material)) mesh.material.forEach(tweak);
					else if (mesh.material) tweak(mesh.material);
				});

				// Face the camera directly so the player meets his eyes — a
				// micro-rotation toward the reels keeps him from looking static.
				thor.rotation.y = -0.08;

				baseY = thor.position.y;

				// Play any baked-in animations so he feels alive (idle / breathing).
				if (gltf.animations && gltf.animations.length > 0) {
					mixer = new THREE.AnimationMixer(thor);
					// Play every clip at half weight blended — for most rigged Thor
					// exports there's a single idle clip; the loop still works fine
					// when multiple are present.
					for (const clip of gltf.animations) {
						const action = mixer.clipAction(clip);
						action.play();
					}
				}

				scene.add(thor);
				modelReady = true;
				stateGame.thor3DReady = true;
			} catch (err) {
				console.warn('[ThorCharacter3D] failed to load GLB:', err);
				stateGame.thor3DReady = true;
			}

			const onResize = () => {
				if (!container || !renderer || !camera) return;

				const w = container.clientWidth;
				const h = container.clientHeight;

				if (w <= 0 || h <= 0) return;

				renderer.setSize(w, h);
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
			};

			const ro = new ResizeObserver(onResize);
			ro.observe(container);

			const animate = () => {
				if (disposed) return;

				raf = requestAnimationFrame(animate);

				const now = performance.now();
				const dt = (now - lastTime) / 1000;
				lastTime = now;
				const t = (now - startTime) / 1000;

				if (mixer) mixer.update(dt);

				if (thor) {
					// Gentle walk cycle — head bob + shoulder sway, nothing else
					const WALK = 2.2; // rad/s → ~1 stride every 2.9 s (majestic pace)
					const bobY = Math.sin(t * WALK * 2) * 0.009; // bobs twice per stride
					const rotY = -0.08 + Math.sin(t * WALK) * 0.022; // shoulder sway
					const rotX = Math.sin(t * WALK * 2) * 0.005; // subtle forward/back nod

					thor.position.y = baseY + bobY;
					thor.rotation.y = rotY;
					thor.rotation.x = rotX;
					thor.scale.set(1, 1, 1);
				}

				lightningGlow.intensity = 1.4 + Math.sin(t * 5) * 0.6;

				if (renderer && scene && camera) {
					renderer.render(scene, camera);
				}
			};

			animate();

			cleanup = () => {
				disposed = true;
				cancelAnimationFrame(raf);
				ro.disconnect();

				mixer?.stopAllAction();
				mixer = null;

				scene?.traverse((obj) => {
					const mesh = obj as import('three').Mesh;

					if ((mesh as any).isMesh) {
						mesh.geometry?.dispose();

						const mat = mesh.material;

						if (Array.isArray(mat)) {
							mat.forEach((m) => m.dispose());
						} else {
							mat?.dispose();
						}
					}
				});

				pmrem.dispose();

				if (renderer) {
					renderer.dispose();
					renderer.forceContextLoss?.();

					if (renderer.domElement.parentNode) {
						renderer.domElement.parentNode.removeChild(renderer.domElement);
					}
				}

				renderer = null;
				scene = null;
				camera = null;
				thor = null;
			};
		};

		init().catch((err) => {
			console.warn('[ThorCharacter3D] disabled:', err);
			stateGame.thor3DReady = true;
		});

		return () => {
			disposed = true;
			cleanup?.();
		};
	});
</script>

<div
	bind:this={container}
	class="thor-character-3d"
	class:visible
	class:hidden
	class:behind-modal={modalOpen}
	class:behind-game-overlay={sceneOverlayActive}
	class:dimmed
	style={styleStr}
	aria-hidden="true"
></div>

<style lang="scss">
	.thor-character-3d {
		position: fixed;
		pointer-events: none;
		z-index: 10;
		user-select: none;

		// Mirror of the hammer's intro: drift in from the OPPOSITE side so the
		// two heroes meet symmetrically as the loading screen fades out.
		opacity: 0;
		transform: translate3d(-16px, 8px, 0) scale(0.96);
		transition:
			opacity 600ms ease-out,
			transform 800ms cubic-bezier(0.16, 0.84, 0.32, 1),
			left 250ms ease,
			top 250ms ease,
			width 250ms ease,
			height 250ms ease;
		will-change: opacity, transform;

		&.visible {
			opacity: 1;
			transform: translate3d(0, 0, 0) scale(1);
		}

		&.hidden {
			display: none;
		}

		&.behind-modal {
			z-index: 0;
		}

		&.behind-game-overlay {
			z-index: 0;
			opacity: 0;
			transform: translate3d(0, 0, 0) scale(1);
		}

		&.dimmed {
			filter: brightness(0.25);
			transition: filter 400ms ease;
		}
	}
</style>
