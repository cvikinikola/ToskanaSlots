<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextLayout } from 'utils-layout';
	import { stateModal } from 'state-shared';

	import { BOARD_LAYOUT_BY_TYPE } from '../../game/constants';
	import { stateGame } from '../../game/stateGame.svelte';

	let container = $state<HTMLDivElement | null>(null);
	let modelReady = $state(false);

	const HAMMER_GLB_URL = '/models/thor-hammer.glb';

	// Only show the 3D hammer once the player has dismissed the
	// “PRESS ANYWHERE TO START” intro — i.e. when the game frame and
	// reels are already on screen. Before that we render nothing so
	// the loading screen stays clean.
	const { stateLayout, stateLayoutDerived } = getContextLayout();
	const sceneOverlayActive = $derived(
		stateGame.transitionActive || stateGame.freeSpinIntroActive || stateGame.freeSpinOutroActive,
	);
	const visible = $derived(!stateLayout.showLoadingScreen && modelReady);

	// Anchor the hammer to the right edge of the reel frame so it scales
	// and re-positions together with the board on every device size.
	const layoutType = $derived(stateLayoutDerived.layoutType());
	const mainLayout = $derived(stateLayoutDerived.mainLayout());
	const canvasSizes = $derived(stateLayoutDerived.canvasSizes());

	type Placement =
		| { mode: 'side'; left: number; top: number; width: number; height: number }
		| { mode: 'hidden' };

	const placement = $derived.by<Placement>(() => {
		const board = BOARD_LAYOUT_BY_TYPE[layoutType];
		const scale = mainLayout.scale;

		// Frame box in real pixels, relative to the canvas (= viewport here
		// since the pixi canvas fills the window).
		const frameW = mainLayout.width * board.fit.w * scale;
		const frameH = mainLayout.height * board.fit.h * scale;
		const frameCx =
			canvasSizes.width * 0.5 +
			(mainLayout.width * board.center.x - mainLayout.width * 0.5) * scale;
		const frameCy =
			canvasSizes.height * 0.5 +
			(mainLayout.height * board.center.y - mainLayout.height * 0.5) * scale;

		if (layoutType === 'portrait' || layoutType === 'tablet') {
			   const TOP_PAD = 2;
			   const GAP = 0;
			const frameTop = frameCy - frameH / 2;
			const availableH = Math.max(70, frameTop - TOP_PAD - GAP);
			const h = Math.min(availableH * 0.92, canvasSizes.height * 0.19);
			const w = h * 0.72;
			   // Centriraj čekić iznad frame-a
			   const left = frameCx - w / 2;
			   // Spusti čekić da mu donji deo bude tik iznad frame-a
			   const OVERLAP = 0.18 * h; // veće preklapanje
			   const top = frameTop - h + OVERLAP;

			   return { mode: 'side', left, top, width: w, height: h };
		}

		// Desktop / landscape: touch the LEFT edge of the reel frame.
		// Bottom of model aligns with frame bottom.
		const frameLeft = frameCx - frameW / 2;
		const frameBottom = frameCy + frameH / 2;
		const h = frameH * 0.60;
		const w = h * 0.80;
		const left = Math.max(0, frameLeft - w);
		const top = frameBottom - h + 90;

		return { mode: 'side', left, top, width: w, height: h };
	});

	const hidden = $derived(placement.mode === 'hidden');
	const modalOpen = $derived(stateModal.modal !== null);
	const dimmed = $derived(stateGame.freeSpinOutroActive);
	// During free spins the FREE SPINS panel is drawn on the Pixi canvas.
	// Drop z-index to 0 so the hammer renders behind the Pixi canvas.
	const inFreeSpins = $derived(stateGame.gameType === 'freeSpins');
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
			stateGame.hammer3DReady = true;
			return;
		}

		let disposed = false;
		let raf = 0;
		let cleanup: (() => void) | null = null;

		let renderer: import('three').WebGLRenderer | null = null;
		let scene: import('three').Scene | null = null;
		let camera: import('three').PerspectiveCamera | null = null;
		let hammer: import('three').Object3D | null = null;

		const startTime = performance.now();

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
			renderer.toneMappingExposure = 1.1;
			renderer.outputColorSpace = THREE.SRGBColorSpace;

			container.appendChild(renderer.domElement);

			renderer.domElement.style.width = '100%';
			renderer.domElement.style.height = '100%';
			renderer.domElement.style.display = 'block';
			renderer.domElement.style.pointerEvents = 'none';

			scene = new THREE.Scene();

			// Image-based environment lighting so the metal head reflects
			// something realistic instead of looking flat-shaded.
			const pmrem = new THREE.PMREMGenerator(renderer);
			scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

			// Vertical hammer → portrait framing. Telephoto FOV so perspective
			// distortion stays minimal and the hammer reads as a vertical hero prop.
			camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 100);
			camera.position.set(1.4, 0.4, 5.2);
			camera.lookAt(0, 0, 0);

			// Soft fill so shadow side isn't pure black.
			const ambient = new THREE.AmbientLight(0xfff4e6, 0.35);
			scene.add(ambient);

			// Main key — neutral, casts shadow, frames the head.
			const keyWhite = new THREE.DirectionalLight(0xffffff, 2.6);
			keyWhite.position.set(2.5, 4, 4);
			keyWhite.castShadow = true;
			keyWhite.shadow.mapSize.set(1024, 1024);
			keyWhite.shadow.camera.near = 0.5;
			keyWhite.shadow.camera.far = 20;
			keyWhite.shadow.bias = -0.0005;
			scene.add(keyWhite);

			// Cool blue rim from the right — Mjolnir / lightning vibe.
			const rimBlue = new THREE.DirectionalLight(0x9ed8ff, 1.2);
			rimBlue.position.set(4, 2, -1);
			scene.add(rimBlue);

			// Warm gold fill from left for cinematic skin tone on the leather.
			const fillGold = new THREE.DirectionalLight(0xffb060, 0.9);
			fillGold.position.set(-3.5, 1.5, 2);
			scene.add(fillGold);

			// Subtle bottom kicker so the leather grip isn't lost in shadow.
			const kicker = new THREE.PointLight(0xfff3e0, 0.7, 8);
			kicker.position.set(0, -1.4, 2);
			scene.add(kicker);

			// Pulsing blue “hum” in front of the head.
			const lightningGlow = new THREE.PointLight(0x66ccff, 1.8, 5);
			lightningGlow.position.set(0, 0.6, 1.5);
			scene.add(lightningGlow);

			const shadowGeo = new THREE.PlaneGeometry(6, 6);
			const shadowMat = new THREE.ShadowMaterial({ opacity: 0.22 });
			const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
			shadowPlane.rotation.x = -Math.PI / 2;
			shadowPlane.position.y = -1.25;
			shadowPlane.receiveShadow = true;
			scene.add(shadowPlane);

			try {
				const loader = new GLTFLoader();
				const gltf = await loader.loadAsync(HAMMER_GLB_URL);

				if (disposed) return;

				hammer = gltf.scene;

				const box = new THREE.Box3().setFromObject(hammer);
				const size = new THREE.Vector3();
				const center = new THREE.Vector3();

				box.getSize(size);
				box.getCenter(center);

				// Use the HEIGHT of the model (Y axis) for scaling, not the longest
				// axis — the hammer is tall+narrow, so scaling by maxDim under-fills
				// the viewport vertically and lets the head/tail get clipped.
				const targetHeight = 2.0; // leaves a small breathing margin top/bottom
				const scale = targetHeight / (size.y || 1);

				hammer.scale.setScalar(scale);
				hammer.position.sub(center.multiplyScalar(scale));

				// Keep the GLB's authored PBR materials — they carry the diffuse,
				// normal and roughness textures baked from the Blender shader.
				// Material names from gltfjsx: 'grip', 'handel', 'lather', 'cap',
				// 'body.001', 'new ', 'line'. We only tweak envMapIntensity / a
				// touch of emissive on the metal head — NEVER replace material.
				hammer.traverse((obj) => {
					const mesh = obj as import('three').Mesh;
					if (!(mesh as any).isMesh) return;

					mesh.castShadow = true;
					mesh.receiveShadow = true;

					const tweak = (m: import('three').Material) => {
						const std = m as import('three').MeshStandardMaterial;
						const matName = (std.name || '').toLowerCase().trim();

						// Stone / metal head: 'body.001', 'new', 'line', 'cap'
						const isHead =
							matName === 'body.001' ||
							matName === 'new' ||
							matName === 'line' ||
							matName === 'cap';

						// Leather wraps: 'grip', 'handel', 'lather'
						const isLeather =
							matName === 'grip' || matName === 'handel' || matName === 'lather';

						if ('envMapIntensity' in std) {
							std.envMapIntensity = isHead ? 1.4 : isLeather ? 0.9 : 1.1;
						}

						if (isHead && 'emissive' in std && std.emissive) {
							std.emissiveIntensity = Math.max(std.emissiveIntensity ?? 0, 0.06);
						}

						std.needsUpdate = true;
					};

					if (Array.isArray(mesh.material)) mesh.material.forEach(tweak);
					else if (mesh.material) tweak(mesh.material);
				});

				// Pose: stand vertical, very subtle lean towards camera.
				hammer.rotation.x = -0.05;
				hammer.rotation.z = 0;

				scene.add(hammer);
				modelReady = true;
				stateGame.hammer3DReady = true;
			} catch (err) {
				console.warn('[ThorHammer3D] failed to load GLB:', err);
				stateGame.hammer3DReady = true;
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

				const t = (performance.now() - startTime) / 1000;

				if (hammer) {
					hammer.rotation.y += 0.020;
					hammer.rotation.x = -0.05 + Math.sin(t * 0.7) * 0.03;
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
				hammer = null;
			};
		};

		init().catch((err) => {
			console.warn('[ThorHammer3D] disabled:', err);
			stateGame.hammer3DReady = true;
		});

		return () => {
			disposed = true;
			cleanup?.();
		};
	});
</script>

<div
	bind:this={container}
	class="thor-hammer-3d"
	class:visible
	class:hidden
	class:behind-modal={modalOpen}
	class:behind-game-overlay={sceneOverlayActive}
	class:during-free-spins={inFreeSpins}
	class:dimmed
	style={styleStr}
	aria-hidden="true"
></div>

<style lang="scss">
	.thor-hammer-3d {
		position: fixed;
		pointer-events: none;
		z-index: 10;
		user-select: none;

		// Hidden until the intro is dismissed, then fade + drift into place
		// so it feels like the hammer materializes alongside the reels.
		opacity: 0;
		transform: translate3d(16px, 8px, 0) scale(0.96);
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

		&.during-free-spins {
			z-index: 0;
		}

		&.dimmed {
			filter: brightness(0.25);
			transition: filter 400ms ease;
		}
	}
</style>
