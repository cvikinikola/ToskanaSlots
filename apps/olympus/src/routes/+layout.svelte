<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoaderStakeEngine, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import VikingMusic from '../components/VikingMusic.svelte';
	// import ThorHammer3D from '../lib/components/ThorHammer3D.svelte';
	import ThorCharacter3D from '../lib/components/ThorCharacter3D.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	const loaderUrlStakeEngine = '/stake-engine-loader.gif';

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
<!-- <ThorHammer3D /> -->

<!-- Thor himself on the RIGHT side of the frame, paired with the hammer. -->
<ThorCharacter3D />

<LoaderStakeEngine src={loaderUrlStakeEngine} />

<VikingMusic />

{@render props.children()}
