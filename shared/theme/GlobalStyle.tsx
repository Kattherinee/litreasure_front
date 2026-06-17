"use client";

import { createGlobalStyle } from "styled-components";

import { theme } from "@/shared/theme";

const GlobalStyle = createGlobalStyle`
	* {
		box-sizing: border-box;
		scrollbar-color: rgb(186 178 172 / 0.74) rgb(242 239 237 / 0.52);
		scrollbar-width: thin;
	}

	*::-webkit-scrollbar {
		width: 0.625rem;
		height: 0.625rem;
	}

	*::-webkit-scrollbar-track {
		border-radius: 999px;
		background: rgb(242 239 237 / 0.72);
	}

	*::-webkit-scrollbar-thumb {
		border: 0.1875rem solid rgb(242 239 237 / 0.72);
		border-radius: 999px;
		background: rgb(186 178 172 / 0.74);
	}

	*::-webkit-scrollbar-thumb:hover {
		background: rgb(158 149 143 / 0.82);
	}

	*::-webkit-scrollbar-corner {
		background: transparent;
	}

	html {
		min-height: 100%;
		overflow-x: clip;
		overscroll-behavior-x: none;
		background: ${theme.colors.background};
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	body {
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
		margin: 0;
		overflow-x: clip;
		overscroll-behavior-x: none;
		background: ${theme.colors.background};
		color: ${theme.colors.foreground};
		font-family: ${theme.fonts.sans};
		text-rendering: optimizeLegibility;
	}

	@media (display-mode: standalone) {
		body {
			padding-top: max(0.75rem, env(safe-area-inset-top));
		}
	}

	@media (hover: none), (pointer: coarse) {
		button:hover,
		a:hover,
		[role="button"]:hover,
		[role="link"]:hover,
		[role="menuitem"]:hover {
			background: inherit;
			box-shadow: none;
			color: inherit;
			transform: none;
			text-decoration: none;
		}
	}

	main {
		flex: 1 0 auto;
		min-width: 0;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		main {
			padding-bottom: calc(5.25rem + env(safe-area-inset-bottom));
		}
	}

	h1,
	h2,
	h3,
	[data-display="serif"] {
		font-family: ${theme.fonts.serif};
	}
`;

export default GlobalStyle;
