<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| { type: 'boardWithAnimateSymbols'; symbolPositions: Position[] };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);

	const resetBoardSymbolStates = () => {
		context.stateGame.board.forEach((reel) => {
			reel.reelState.symbols.forEach((reelSymbol) => {
				reelSymbol.symbolState = 'static';
				reelSymbol.oncomplete = () => {};
			});
		});
	};

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => {
			// Main board hidden during tumble — TumbleBoard handles STOP there.
			if (!show) return;
			context.stateGameDerived.enhancedBoard.stop();
			resetBoardSymbolStates();
		},

		boardSettle: ({ board }) => {
			context.stateGameDerived.enhancedBoard.settle(board);
			resetBoardSymbolStates();
		},

		boardShow: () => (show = true),

		boardHide: () => (show = false),

		/**
		 * Set each requested symbol to 'win' state, await its animation callback,
		 * then restore normal rendering.
		 * All symbols animate in parallel.
		 */
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			// Dedupe: same position can appear in multiple winning lines; without
			// this, two parallel awaits overwrite each other's oncomplete resolver
			// and Promise.all hangs forever.
			const seen = new Set<string>();
			const uniquePositions = symbolPositions.filter((p) => {
				const k = `${p.reel}-${p.row}`;
				if (seen.has(k)) return false;
				seen.add(k);
				return true;
			});
			const getPromises = () =>
				uniquePositions.map(async (position) => {
					// +1 because reelState.symbols[0] is the top padding symbol;
					// visible row 0 is at array index 1.
					const reelSymbol =
						context.stateGame.board[position.reel].reelState.symbols[position.row + 1];
					if (!reelSymbol) return;
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					reelSymbol.symbolState = 'static';
					reelSymbol.oncomplete = () => {};
				});

			await Promise.all(getPromises());
			resetBoardSymbolStates();
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

{#if show}
	<!--
		Two BoardContext passes:
		  animate=false → static layer (symbols not in animation)
		  animate=true  → animation layer (symbols being animated)
		This separation lets PixiJS render animated sprites above static ones.
	-->
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<BoardBase />
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<!--
				QA 04.06.2026: maska se primenjuje i na animate prolaz (win/explosion
				simboli). Ranije je samo statički prolaz bio maskiran, pa je animate
				prolaz bio jedina nemaskirana površina — kad bi QA usporio igru,
				simbol u animaciji je mogao da "viri" iznad/ispod zlatnog frame-a.
				PixiJS maska je tvrd GPU clip (y∈[0,500] native, unutar otvora
				frame-a y∈[-112,612]) → nijedan simbol NIKAD ne može da izađe iz
				frame-a, na svim uređajima (maska je u native koord. i skalira se).
			-->
			<BoardMask />
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
