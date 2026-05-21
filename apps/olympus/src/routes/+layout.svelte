<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoaderStakeEngine, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import VikingMusic from '../components/VikingMusic.svelte';
	import ThorHammer3D from '../lib/components/ThorHammer3D.svelte';
	import ThorCharacter3D from '../lib/components/ThorCharacter3D.svelte';
	import FreeSpinCounterHTML from '../lib/components/FreeSpinCounterHTML.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	let showLoader = $state(false);

	const loaderUrlStakeEngine = new URL('../../stake-engine-loader.gif', import.meta.url).href;

	setContext();
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<!-- Cinematic 3D Thor hammer prop. Sits between the PIXI canvas and the
     modal layer (z-index 10 < 50) and is click-through. -->
<ThorHammer3D />

<!-- Thor himself on the RIGHT side of the frame, paired with the hammer. -->
<ThorCharacter3D />

<!-- HTML overlay for the FREE SPINS counter (desktop/landscape only).
     z-index 20 keeps it in front of the 3D hammer (z-index 10) so the
     hammer appears to spin *behind* the card rather than over it. -->
<FreeSpinCounterHTML />

<LoaderStakeEngine src={loaderUrlStakeEngine} oncomplete={() => (showLoader = true)} />

<VikingMusic />

{@render props.children()}
