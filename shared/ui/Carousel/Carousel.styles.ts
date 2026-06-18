import styled from "styled-components";

import { theme } from "@/shared/theme";

const finePointer = "@media (hover: hover) and (pointer: fine)";

export const CarouselViewport = styled.div<{
	$bleed?: boolean;
	$hasOverflow?: boolean;
}>`
	width: ${({ $bleed }) => ($bleed ? "100vw" : "100%")};
	margin-left: ${({ $bleed }) =>
		$bleed ? "calc(var(--content-side-space) * -1)" : "0"};
	overflow: ${({ $hasOverflow }) => ($hasOverflow ? "hidden" : "visible")};
	overscroll-behavior-x: contain;
	overscroll-behavior-y: auto;
	padding-block: 0.125rem;
`;

export const CarouselContainer = styled.div<{ $bleed?: boolean }>`
	--slide-gap: clamp(0.575rem, 0.8vw, 1rem);

	display: flex;
	align-items: flex-start;
	gap: var(--slide-gap);
	height: auto;
	padding-left: ${({ $bleed }) =>
		$bleed ? "var(--content-side-space)" : "0.35rem"};
	padding-block: ${({ $bleed }) => ($bleed ? "0" : "0.35rem")};
	touch-action: pan-y pinch-zoom;
`;

export const CarouselSlide = styled.div`
	flex: 0 0 auto;
	align-self: flex-start;
	width: fit-content;
	height: fit-content;
	min-width: 0;
`;

export const CarouselControls = styled.div<{ $isVisible?: boolean }>`
	display: ${({ $isVisible }) => ($isVisible === false ? "none" : "flex")};
	justify-content: flex-end;
	gap: 0.625rem;
	margin-top: 1rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: none;
	}
`;

export const CarouselControlButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.875rem;
	height: 1.875rem;
	border: 0.0625rem solid ${theme.colors.orangeDark};
	border-radius: 62.4375rem;
	background: ${theme.colors.transparent};
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.serif};
	font-size: 2rem;
	line-height: 1;
	transition:
		background 180ms ease,
		border-color 180ms ease,
		color 180ms ease,
		opacity 180ms ease,
		transform 180ms ease;

	${finePointer} {
		&:not(:disabled):hover {
			background: ${theme.colors.orangeLight};
			border-color: ${theme.colors.orangeLight};
			color: ${theme.colors.invertedText};
			transform: translateY(-0.0625rem);
		}
	}

	&:disabled {
		cursor: default;
		opacity: 0.38;
	}
`;

export const CarouselStateMessage = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;
