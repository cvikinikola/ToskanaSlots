import { backOut } from 'svelte/easing';
import { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';
import { createInterruptible } from 'utils-shared/interruptible';

import type { CascadingReelCreateOptions, CascadingReelSpinOptions, SpinType } from './types';

export type CascadingReelMotion = 'fallingOut' | 'hanging' | 'fallingIn' | 'stopped';
export type CascadingReelSymbolState = 'static' | 'land' | 'spin';

export function createReelForCascading<TRawSymbol extends object, TSymbolState extends string>(
	reelOptions: CascadingReelCreateOptions<TRawSymbol, TSymbolState>,
) {
	// reelSymbols
	const getSymbolY = (symbolIndexOfBoard: number) =>
		(symbolIndexOfBoard + 0.5) * reelOptions.symbolHeight;

	const createReelSymbol = (reelSymbolOptions: { rawSymbol: TRawSymbol; symbolIndex: number }) => {
		const symbolIndexOfBoard = reelSymbolOptions.symbolIndex - 1;
		const rawSymbol = reelSymbolOptions.rawSymbol;
		const symbolState = reelOptions.initialSymbolState;

		const initY = getSymbolY(symbolIndexOfBoard);
		const symbolY = new Tween(initY);
		const oncomplete = () => {};

		const reelSymbol = $state({
			rawSymbol,
			symbolIndexOfBoard,
			symbolY,
			symbolState,
			oncomplete,
		});

		return reelSymbol;
	};

	type ReelSymbol = ReturnType<typeof createReelSymbol>;

	const createReelSymbols: (value: TRawSymbol[]) => ReelSymbol[] = (rawSymbols) => {
		const reelSymbols = rawSymbols.map((rawSymbol, symbolIndex) =>
			createReelSymbol({ rawSymbol, symbolIndex }),
		);

		return reelSymbols;
	};

	const updateSymbols = (value: TRawSymbol[]) =>
		reelState.symbols.map((reelSymbol, symbolIndex) => {
			reelSymbol.rawSymbol = value[symbolIndex];
			reelSymbol.symbolState = 'static' as TSymbolState;
			reelSymbol.oncomplete = () => {};
		});

	// constants
	const reelLength = reelOptions.initialSymbols.length;
	const reelLengthInBoard = reelLength - 2;

	// interruptible
	const interruptible = createInterruptible();

	// reactive states
	const reelState = $state({
		symbols: createReelSymbols(reelOptions.initialSymbols),
		motion: 'stopped' as CascadingReelMotion,
		spinType: 'normal' as SpinType,
		anticipating: false,
		readyToSpin: () => {},
		spinOptions: () => ({}) as CascadingReelSpinOptions,
	});
	const basePaddingSize = () => reelLength * reelState.spinOptions().reelPaddingMultiplierNormal;
	const anticipatedPaddingSize = () =>
		reelLength * reelState.spinOptions().reelPaddingMultiplierAnticipated;

	// internal states
	let targetSymbols = reelOptions.initialSymbols;
	let onSpinFinishing: () => void = () => {};
	let noStop = false;
	let paddingSize = 0;
	let spinInProgress = false;
	let moveAbortResolve: (() => void) | null = null;

	const skipStagger = () => stateBet.isTurbo || reelState.spinType === 'fast';

	const snapSymbolsToBoard = () => {
		reelState.symbols.forEach((reelSymbol) => {
			const y = getSymbolY(reelSymbol.symbolIndexOfBoard);
			reelSymbol.symbolY.set(y, { duration: 0 });
			reelSymbol.symbolState = 'static' as TSymbolState;
			const resolve = reelSymbol.oncomplete;
			reelSymbol.oncomplete = () => {};
			resolve();
		});
	};

	const finishSpinInstantly = () => {
		if (reelState.motion === 'stopped') return;
		moveAbortResolve?.();
		updateSymbols(targetSymbols);
		snapSymbolsToBoard();
		onSpinFinishing();
		reelState.motion = 'stopped';
	};

	const delaySpinByReelIndex = async () => {
		await waitForTimeout(reelState.spinOptions().reelFallOutDelay * reelOptions.reelIndex);
	};

	const preSpin = async ({
		isTurboBeforeAll,
	}: {
		isTurboBeforeAll: boolean; // To avoid previous spinType has effect on "getSpinOption" in "slideDownLoop"
	}) => {
		reelState.spinType = isTurboBeforeAll ? 'fast' : 'normal';
		if (!isTurboBeforeAll) await delaySpinByReelIndex();
		await fallOut();
	};

	const moveAllSymbolsWith = async (moveSymbol: (reelSymbol: ReelSymbol) => Promise<void>) => {
		const moves = Promise.all(reelState.symbols.map(moveSymbol));
		const abort = new Promise<void>((resolve) => {
			moveAbortResolve = resolve;
		});
		await Promise.race([moves, abort]);
		moveAbortResolve = null;
	};

	const fallOut = async () => {
		reelState.motion = 'fallingOut';
		reelOptions.onReelSpinStart?.();

		await moveAllSymbolsWith(async (reelSymbol) => {
			const oldSymbolY = reelSymbol.symbolY.current;
			const newSymbolY = getSymbolY(reelSymbol.symbolIndexOfBoard + reelLength);
			const distance = newSymbolY - oldSymbolY;
			const duration = distance / reelState.spinOptions().symbolFallOutSpeed;
			const delay = skipStagger()
				? 0
				: reelState.spinOptions().symbolFallOutInterval *
					(reelLengthInBoard - reelSymbol.symbolIndexOfBoard);

			await waitForTimeout(delay);
			if (reelState.motion === 'stopped') return;
			reelSymbol.symbolState = 'spin' as TSymbolState;
			await reelSymbol.symbolY.set(newSymbolY, { duration });
		});

		if (reelState.motion !== 'stopped') reelState.motion = 'hanging';
	};

	const hanging = async () => {
		updateSymbols(targetSymbols);

		await moveAllSymbolsWith(async (reelSymbol) => {
			const newSymbolY = getSymbolY(reelSymbol.symbolIndexOfBoard - reelLength);
			const duration = 0;

			await reelSymbol.symbolY.set(newSymbolY, { duration });
		});
	};

	const fallIn = async () => {
		const fallInDelayMultiplier = paddingSize / reelLength - 1;
		const waitToStartFallingIn = async () =>
			await waitForTimeout(reelState.spinOptions().reelFallInDelay * fallInDelayMultiplier);

		// Q: When to skip the waitToStartFallingIn?
		// A: When stop button is clicked(isTurbo) and is noStop is false
		if (noStop) {
			await waitToStartFallingIn();
		} else if (skipStagger()) {
			// skip
		} else {
			await interruptible.add(waitToStartFallingIn);
		}

		if (reelState.motion === 'stopped') return;

		reelState.motion = 'fallingIn';

		await moveAllSymbolsWith(async (reelSymbol) => {
			const oldSymbolY = reelSymbol.symbolY.current;
			const newSymbolY = getSymbolY(reelSymbol.symbolIndexOfBoard);
			const distance = newSymbolY - oldSymbolY;
			const delay = skipStagger()
				? 0
				: reelState.spinOptions().symbolFallInInterval *
					(reelLengthInBoard - reelSymbol.symbolIndexOfBoard);
			const bounceDistance =
				reelOptions.symbolHeight * reelState.spinOptions().symbolFallInBounceSizeMulti;
			const bounceDuration = bounceDistance / reelState.spinOptions().symbolFallInBounceSpeed;
			const landDuration = (distance - bounceDistance) / reelState.spinOptions().symbolFallInSpeed;

			if (reelState.motion === 'stopped') return;

			await reelSymbol.symbolY.set(newSymbolY - bounceDistance, {
				duration: landDuration,
				delay,
			});
			reelSymbol.symbolState = 'land' as TSymbolState;
			reelOptions.onSymbolLand({ rawSymbol: reelSymbol.rawSymbol });
			await reelSymbol.symbolY.set(newSymbolY, {
				duration: bounceDuration,
				easing: backOut,
			});
		});

		if (reelState.motion === 'stopped') return;

		onSpinFinishing();
		reelState.motion = 'stopped';
		reelState.symbols.forEach((reelSymbol) => {
			reelSymbol.symbolY.set(getSymbolY(reelSymbol.symbolIndexOfBoard), { duration: 0 });
			reelSymbol.symbolState = 'static' as TSymbolState;
			reelSymbol.oncomplete = () => {};
		});
	};

	const generalSpin = async () => {
		const isHanging = reelState.motion === 'hanging';

		if (!isHanging) await fallOut();
		if (reelState.motion === 'stopped') return;
		await hanging();
		if (reelState.motion === 'stopped') return;
		await fallIn();
	};

	// Keep redundancy here for the comparison to createSpinningReel
	const fastSpin = () => generalSpin();
	const normalSpin = () => generalSpin();
	const anticipatedSpin = () => generalSpin();

	const SPIN_MAP = {
		fast: fastSpin,
		normal: normalSpin,
		anticipated: anticipatedSpin,
	};

	const prepareToSpin = (prepareToSpinOptions: {
		noStop: boolean;
		spinType: SpinType;
		symbols: TRawSymbol[];
		paddingPosition: number;
		onSpinFinishing: () => void;
		previousPaddingSize: number;
	}) => {
		reelState.spinType = prepareToSpinOptions.spinType;

		noStop = prepareToSpinOptions.noStop;
		targetSymbols = prepareToSpinOptions.symbols;
		onSpinFinishing = prepareToSpinOptions.onSpinFinishing;

		const GET_PADDING_SIZE_MAP = {
			fast: 0,
			normal: prepareToSpinOptions.previousPaddingSize + basePaddingSize(),
			anticipated: prepareToSpinOptions.previousPaddingSize + anticipatedPaddingSize(),
		};

		paddingSize = GET_PADDING_SIZE_MAP[prepareToSpinOptions.spinType];

		return paddingSize;
	};

	const spin = async () => {
		spinInProgress = true;
		try {
			await SPIN_MAP[reelState.spinType]();
		} finally {
			spinInProgress = false;
		}
	};

	const setSymbolsWithRawSymbols = (value?: TRawSymbol[]) => {
		moveAbortResolve?.();
		interruptible.interrupt();
		reelState.motion = 'stopped';
		if (!value?.length) return;
		targetSymbols = value;
		updateSymbols(value);
		snapSymbolsToBoard();
	};

	const stop = () => {
		interruptible.interrupt();
		moveAbortResolve?.();
		if (reelState.motion === 'stopped') return;
		finishSpinInstantly();
	};

	const readyToSpinEffect = () => {
		$effect(() => {
			if (reelState.motion === 'hanging') {
				reelState.readyToSpin();
			}
		});
	};

	return {
		// from options
		reelIndex: reelOptions.reelIndex,
		symbolHeight: reelOptions.symbolHeight,
		onReelStopping: reelOptions.onReelStopping,
		reelLength,
		// reactive states
		reelState,
		// methods
		preSpin,
		prepareToSpin,
		spin,
		stop,
		setSymbolsWithRawSymbols,
		readyToSpinEffect,
	};
}
