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
		await Promise.all(reelState.symbols.map(moveSymbol));
	};

	const fallOut = async () => {
		reelState.motion = 'fallingOut';
		reelOptions.onReelSpinStart?.();

		await moveAllSymbolsWith(async (reelSymbol) => {
			const oldSymbolY = reelSymbol.symbolY.current;
			const newSymbolY = getSymbolY(reelSymbol.symbolIndexOfBoard + reelLength);
			const distance = newSymbolY - oldSymbolY;
			const duration = distance / reelState.spinOptions().symbolFallOutSpeed;
			const delay =
				reelState.spinOptions().symbolFallOutInterval *
				(reelLengthInBoard - reelSymbol.symbolIndexOfBoard);

			await waitForTimeout(delay);
			reelSymbol.symbolState = 'spin' as TSymbolState;
			await reelSymbol.symbolY.set(newSymbolY, { duration });
		});

		reelState.motion = 'hanging';
	};

	const getFallInMode = () => reelState.spinOptions().symbolFallInMode ?? 'default';

	const getHangY = (idx: number) => {
		const mode = getFallInMode();
		if (idx >= 0 && idx < reelLengthInBoard) {
			if (mode === 'rain') {
				return getSymbolY(-1) - (reelLengthInBoard - 1 - idx) * reelOptions.symbolHeight;
			}
			if (mode === 'top-stagger') {
				return getSymbolY(-1) - idx * reelOptions.symbolHeight;
			}
		}
		return getSymbolY(idx - reelLength);
	};

	const getFallInStartDelay = (idx: number) => {
		const interval = reelState.spinOptions().symbolFallInInterval;
		const mode = getFallInMode();
		if (mode === 'top-stagger') {
			return interval * idx;
		}
		// rain + default: bottom row leads, others follow
		return interval * (reelLengthInBoard - 1 - idx);
	};

	const hanging = async () => {
		updateSymbols(targetSymbols);

		await moveAllSymbolsWith(async (reelSymbol) => {
			const idx = reelSymbol.symbolIndexOfBoard;
			await reelSymbol.symbolY.set(getHangY(idx), { duration: 0 });
		});
	};

	const fallOneSymbolIn = async (reelSymbol: ReelSymbol) => {
		const oldSymbolY = reelSymbol.symbolY.current;
		const newSymbolY = getSymbolY(reelSymbol.symbolIndexOfBoard);
		const distance = newSymbolY - oldSymbolY;
		const noBounce = getFallInMode() === 'rain';
		const bounceDistance = noBounce
			? 0
			: reelOptions.symbolHeight * reelState.spinOptions().symbolFallInBounceSizeMulti;
		const fallSpeed = reelState.spinOptions().symbolFallInSpeed;
		const landDuration = Math.max(1, (distance - bounceDistance) / fallSpeed);

		reelSymbol.symbolState = 'spin' as TSymbolState;

		if (noBounce) {
			await reelSymbol.symbolY.set(newSymbolY, { duration: landDuration });
			reelSymbol.symbolState = 'land' as TSymbolState;
			reelOptions.onSymbolLand({
				rawSymbol: reelSymbol.rawSymbol,
				symbolIndexOfBoard: reelSymbol.symbolIndexOfBoard,
			});
			reelSymbol.symbolState = 'static' as TSymbolState;
			return;
		}

		const bounceDuration = bounceDistance / reelState.spinOptions().symbolFallInBounceSpeed;
		await reelSymbol.symbolY.set(newSymbolY - bounceDistance, {
			duration: landDuration,
		});
		reelSymbol.symbolState = 'land' as TSymbolState;
		reelOptions.onSymbolLand({
			rawSymbol: reelSymbol.rawSymbol,
			symbolIndexOfBoard: reelSymbol.symbolIndexOfBoard,
		});
		await reelSymbol.symbolY.set(newSymbolY, {
			duration: bounceDuration,
			easing: backOut,
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
		} else if (stateBet.isTurbo) {
			// skip
		} else {
			await interruptible.add(waitToStartFallingIn);
		}

		reelState.motion = 'fallingIn';

		const mode = getFallInMode();
		const sequentialTopStagger =
			mode === 'top-stagger' && reelState.spinType !== 'fast' && !stateBet.isTurbo;

		if (sequentialTopStagger) {
			const visibleSymbols = reelState.symbols
				.filter((s) => s.symbolIndexOfBoard >= 0 && s.symbolIndexOfBoard < reelLengthInBoard)
				.sort((a, b) => a.symbolIndexOfBoard - b.symbolIndexOfBoard);
			const gap = reelState.spinOptions().symbolFallInInterval;

			for (let i = 0; i < visibleSymbols.length; i++) {
				if (i > 0 && gap > 0) await waitForTimeout(gap);
				await fallOneSymbolIn(visibleSymbols[i]);
			}
		} else {
			await moveAllSymbolsWith(async (reelSymbol) => {
				const idx = reelSymbol.symbolIndexOfBoard;
				if (idx < 0 || idx >= reelLengthInBoard) return;

				const delay = getFallInStartDelay(idx);
				if (delay > 0) await waitForTimeout(delay);
				await fallOneSymbolIn(reelSymbol);
			});
		}

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
		await hanging();
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
		await SPIN_MAP[reelState.spinType]();
	};

	const setSymbolsWithRawSymbols = (value?: TRawSymbol[]) => {
		reelState.motion = 'stopped';
		if (value) {
			updateSymbols(value);
		}
	};

	const stop = () => {
		interruptible.interrupt();
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
