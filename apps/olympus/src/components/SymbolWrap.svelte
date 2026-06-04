<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { BOARD_SIZES } from '../game/constants';

	type Props = {
		x: number;
		y: number;
		animating: boolean;
		/**
		 * Padding symbol (top/bottom reservoir slot). Never visible to the player.
		 * Visible 5×6 symbols pass `isPadding=false` and get culled only at the
		 * mask edge so the `backOut` landing bounce can still show.
		 */
		isPadding: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();

	/**
	 * Each symbol renders in exactly one of the two Board passes:
	 * - static pass (animate=false): renders when NOT animating
	 * - animate pass (animate=true): renders ONLY when animating
	 * This prevents double-rendering.
	 */
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);

	// QA 03.06.2026: NEMA frame culling-a.
	// Ranija `inFrame` provera (y unutar [0, BOARD_SIZES.height]) je sakrivala
	// simbole dok im centar ne stigne na y=0 — pa su tokom fall-in animacije
	// "pop-in" izgledali na vrhu prvog reda i delovalo je kao da reeli preskaču
	// prvi red i zaustavljaju se na drugom. BoardMask već radi clipping za
	// padding redove iznad/ispod board-a, tako da nije potrebno dodatno
	// runtime culling — neka se simboli renderuju kontinuirano dok kaskadiraju.

	// QA 04.06.2026: TRUE 5×6 — dvostruka logika nevidljivosti.
	//
	// 1) PADDING simboli (gornji/donji rezervoar slotovi): UVEK nevidljivi
	//    bez obzira na y. Tokom board spin-a (fallOut/hanging/fallIn) padding
	//    simboli FIZIČKI prolaze kroz vidljivi opseg y∈[0,500] na svom putu
	//    do krajnjih pozicija y=−50 / y=550 — i to je upravo bio „7. red"
	//    koji je QA video. Pošto su padding po definiciji nevidljivi za
	//    igrača (rezervoar iz kog ulizgavaju pravi simboli), gasimo ih bez
	//    obzira na trenutni y. Isto važi i u mirovanju (y=−50 / y=550).
	//
	// 2) VIDLJIVI 5×6 simboli: cull na ivici maske (y < 0 ili y > height).
	//    Maska je tvrd GPU clip na y∈[0, 500]; ako simbol malo premaši ivicu
	//    (npr. `backOut` bounce kod fall-in landing-a — row 4 nakratko ode
	//    par piksela ispod y=450), MASKA ga lepo odseče i vidi se tek mali
	//    sjaj, a simbol NE nestane. Time se izbegava da poslednji red
	//    „proguta" donja ivica tokom landing bounce-a.
	const invisible = $derived(
		props.isPadding || props.y < 0 || props.y > BOARD_SIZES.height,
	);
</script>

{#if show}
	<Container x={props.x} y={props.y} visible={!invisible}>
		{@render props.children()}
	</Container>
{/if}
