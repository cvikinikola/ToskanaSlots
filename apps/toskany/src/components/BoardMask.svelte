<script lang="ts">
	import { Rectangle } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';

	const context = getContext();

	// Reference kept so the mask re-renders when the layout changes
	// (e.g. orientation flip) — values themselves are native pixels so
	// the mask geometry is independent of board scale.
	$effect(() => {
		void context.stateGameDerived.boardLayout();
	});
</script>

<!--
	isMask=true makes this Rectangle act as a PixiJS mask.
	Sized in BOARD-NATIVE pixels (same coordinate space as the symbols
	inside `BoardContainer`, which applies the scale itself).

	stake.com pravilo (QA 04.06.2026): igra je 7×7 — vidi se TAČNO 7 redova
	u celosti. Maska je zato visoka tačno BOARD_SIZES.height →
	svih 49 simbola (7×7) je potpuno vidljivo, a oba padding reda (gornji
	y<0, donji y>BOARD_SIZES.height) su POTPUNO odsečena maskom. Padding redovi su samo
	rezervoar iz kog simboli upadaju tokom kaskade (GoO stil: simbol postane
	vidljiv tek kad pređe gornju ivicu y=0 i sklizne u svoj red) i NIKAD se
	ne vide — ni u mirovanju, ni tokom spina, ni kad se igra uspori.
	Maska je tvrd GPU clip primenjen na sva 4 prolaza (Board static+animate,
	TumbleBoard static+animate). Horizontalno labavo (±SYMBOL_SIZE) za sjaje.
-->
<Rectangle
	isMask
	x={-SYMBOL_SIZE}
	y={0}
	width={BOARD_SIZES.width + SYMBOL_SIZE * 2}
	height={BOARD_SIZES.height}
/>
