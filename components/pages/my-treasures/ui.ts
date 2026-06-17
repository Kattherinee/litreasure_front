"use client";

import Link from "next/link";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import styled from "styled-components";

import { theme } from "@/shared/theme";

export const ViewAllLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 0.12rem;
	color: ${theme.colors.orangeDark};
	font-size: 1.02rem;
	font-weight: 500;
	text-decoration: none;

	span {
		position: relative;
	}

	span::after {
		content: "";
		position: absolute;
		bottom: -0.16rem;
		left: 0;
		width: 100%;
		height: 0.0625rem;
		background: currentColor;
		opacity: 0;
		transform: translateY(0.1rem);
		transition:
			opacity 160ms ease,
			transform 160ms ease;
	}

	&:hover span::after,
	&:focus-visible span::after {
		opacity: 1;
		transform: translateY(0);
	}
`;

const actionPill = `
	display:inline-flex;
	align-items:center;
	gap:.32rem;
	border:.0625rem solid rgb(212 100 28 / .24);
	border-radius:999px;
	background:rgb(255 255 255 / .36);
	padding:.26rem .5rem;
	color:${theme.colors.orangeDark};
	text-decoration:none;
	cursor:pointer;
	font:inherit;
	font-size:.86rem;
	line-height:1.2;
`;

export const HeaderActionLink = styled(Link)`
	${actionPill}
	svg {
		width: 1.15rem;
		height: 1.15rem;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 2.35rem;
		height: 2.35rem;
		padding: 0;
		justify-content: center;

		span {
			display: none;
		}
	}
`;

export const HeaderActionButton = styled.button`
	${actionPill}
	svg {
		width: 1.15rem;
		height: 1.15rem;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 2.35rem;
		height: 2.35rem;
		padding: 0;
		justify-content: center;

		span {
			display: none;
		}
	}
`;

export const RailControls = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: none;
	}
`;

export const RailControlButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.715rem;
	height: 1.715rem;
	border: 0.0625rem solid ${theme.colors.orangeDark};
	border-radius: 999px;
	background: transparent;
	color: ${theme.colors.orangeDark};
	cursor: pointer;

	&:disabled {
		opacity: 0.38;
		cursor: not-allowed;
	}
`;

export const PrevIcon = KeyboardArrowLeftIcon;
export const NextIcon = KeyboardArrowRightIcon;
