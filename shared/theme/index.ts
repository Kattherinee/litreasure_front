export const theme = {
	colors: {
		background: "#e8e2de",
		backgroundTop: "#efe8e3",
		surface: "#f2efed",
		foreground: "#04121a",
		orangePrimary: "#fe7f2d",
		orangeDark: "#d4641c",
		orangeLight: "#eda06c",
		darkerOrangeLight: "#cf8451;",
		bluePrimary: "#233d4d",
		lightText: "#2E363C",
		textPrimary: "#04121A",
		invertedText: "#F2EFED",
		muted: "#bab7b4",
		greyWarm: "#bab7b4",
		border: "#d3cac4",
		softForeground: "#4f5152",
		inputBackground: "#c9c4c0",
		inputHoverBorder: "#b8b1ad",
		inputDisabledBorder: "#9f9f9f",
		inputDisabledText: "#8e8e8e",
		white: "#ffffff",
		black: "#000000",
		transparent: "transparent",
	},
	alpha: {
		orangeGlow: "rgb(254 127 45 / 0.18)",
		orangeFocus: "rgb(254 127 45 / 0.34)",
		blueDivider: "rgb(35 61 77 / 0.08)",
		blueWash: "rgb(35 61 77 / 0.08)",
		shadow: "rgb(0 0 0 / 0.2)",
		coverActionBorder: "rgb(255 255 255 / 0.72)",
		coverActionBackground: "rgb(4 18 26 / 0.72)",
		surfaceRaised: "rgb(242 239 237 / 0.64)",
	},
	fonts: {
		sans: '"Oxygen", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
		serif: '"Vollkorn", Georgia, serif',
		mono: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
	},
	layout: {
		contentMaxWidth: "80.5vw",
		collectionsPageMaxWidth: "70vw",
		contentGutter: "clamp(1rem, 4vw, 3.75rem)",
	},
	rubberSize: {
		desktop: "1199px",
		tablet: "767px",
		phone: "375px",
	},
} as const;

type IRubberScreen = keyof typeof theme.rubberSize;

const getScreenWidth = (screen: IRubberScreen) =>
	Number.parseFloat(theme.rubberSize[screen]);

export const pxToVw = (size: number, screen: IRubberScreen = "desktop") =>
	`${(size / getScreenWidth(screen)) * 100}vw`;
