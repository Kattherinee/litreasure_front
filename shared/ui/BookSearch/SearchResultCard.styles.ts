import Link from "next/link";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";

export const ResultItem = styled.div`
	position: relative;
	z-index: 0;
	display: grid;
	align-items: center;
	gap: 0.9rem;
	grid-template-columns: minmax(0, 1fr) auto;
	border-radius: 1rem;
	transition:
		background 160ms ease,
		transform 160ms ease;

	&:hover,
	&:focus-within {
		z-index: 10;
		background: rgb(242 239 237 / 0.78);
		transform: translateY(-0.0625rem);
	}

	&:hover .search-result-title,
	&:focus-within .search-result-title {
		color: ${theme.colors.orangeDark};
	}

	@media (max-width: 34rem) {
		grid-template-columns: 1fr;
	}
`;

export const ResultLinkCard = styled(Link)`
	position: relative;
	z-index: 0;
	display: grid;
	align-items: center;
	gap: 1.05rem;
	grid-template-columns: 4.5rem minmax(0, 1fr) 1.5rem;
	border-radius: 1rem;
	padding: 0.75rem 0.9rem;
	color: inherit;
	text-decoration: none;
	transition:
		background 160ms ease,
		transform 160ms ease;

	&:hover,
	&:focus-visible {
		z-index: 10;
		background: rgb(242 239 237 / 0.78);
		outline: none;
		transform: translateY(-0.0625rem);
	}

	&:hover .search-result-title,
	&:focus-visible .search-result-title {
		color: ${theme.colors.orangeDark};
	}

	@media (max-width: 34rem) {
		grid-template-columns: 3.75rem minmax(0, 1fr) 1.5rem;
	}
`;

export const ResultEntityCard = styled.div`
	position: relative;
	z-index: 0;
	display: grid;
	align-items: center;
	gap: 1.05rem;
	grid-template-columns: 4.5rem minmax(0, 1fr) auto;
	border-radius: 1rem;
	padding: 0.75rem 0.9rem;
	transition:
		background 160ms ease,
		transform 160ms ease;

	&:hover,
	&:focus-within {
		z-index: 10;
		background: rgb(242 239 237 / 0.78);
		transform: translateY(-0.0625rem);
	}

	&:hover .search-result-title,
	&:focus-within .search-result-title {
		color: ${theme.colors.orangeDark};
	}

	@media (max-width: 34rem) {
		grid-template-columns: 3.75rem minmax(0, 1fr) auto;
	}
`;

export const ResultActionCard = styled.div`
	position: relative;
	z-index: 0;
	display: grid;
	align-items: center;
	gap: 1.05rem;
	grid-template-columns: 4.5rem minmax(0, 1fr) auto;
	border-radius: 1rem;
	padding: 0.75rem 0.9rem;
	transition:
		background 160ms ease,
		transform 160ms ease;

	&:hover,
	&:focus-within {
		z-index: 10;
		background: rgb(242 239 237 / 0.78);
		transform: translateY(-0.0625rem);
	}

	&:hover .search-result-title,
	&:focus-within .search-result-title {
		color: ${theme.colors.orangeDark};
	}

	@media (max-width: 34rem) {
		grid-template-columns: 3.75rem minmax(0, 1fr) auto;
	}
`;

export const ResultContentLink = styled(Link)`
	display: contents;
	color: inherit;
	text-decoration: none;

	&:focus-visible .search-result-title {
		color: ${theme.colors.orangeDark};
	}
`;

export const ResultArrow = styled.span`
	width: 1rem;
	height: 1rem;
	border-top: 0.22rem solid rgb(4 18 26 / 0.25);
	border-right: 0.22rem solid rgb(4 18 26 / 0.25);
	transform: rotate(45deg);
`;

export const GenreMark = styled.span`
	display: inline-flex;
	width: 4rem;
	height: 4rem;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgb(218 142 91 / 0.18);
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 2rem;
	line-height: 1;
`;

export const CollectionMark = styled.span`
	position: relative;
	width: 4rem;
	height: 4rem;
	border-radius: 0.9rem;
	background: rgb(218 142 91 / 0.18);

	&::before,
	&::after {
		position: absolute;
		right: 1rem;
		left: 1rem;
		height: 0.2rem;
		border-radius: 999px;
		background: ${theme.colors.orangeDark};
		content: "";
	}

	&::before {
		top: 1.45rem;
	}

	&::after {
		top: 2.25rem;
	}
`;

export const SeriesStack = styled.span`
	position: relative;
	display: block;
	width: 4rem;
	height: 5.2rem;
`;

export const SeriesStackCover = styled.img<{ $index: number }>`
	position: absolute;
	top: ${({ $index }) => $index * 0.25}rem;
	left: ${({ $index }) => $index * -0.25}rem;
	z-index: ${({ $index }) => 3 - $index};
	width: 3.75rem;
	height: 5rem;
	border: 0.0625rem solid ${theme.colors.background};
	border-radius: 0.45rem;
	object-fit: cover;
`;

export const ResultMain = styled.div<{ $isRecommendation?: boolean }>`
	display: grid;
	align-items: ${({ $isRecommendation }) =>
		$isRecommendation ? "start" : "center"};
	gap: 0.9rem;
	grid-template-columns: 3.25rem minmax(0, 1fr);
	min-width: 0;
	padding: 0.6rem;
`;

export const ResultCoverLink = styled(Link)<{ $isRecommendation?: boolean }>`
	display: inline-flex;
	width: ${({ $isRecommendation }) =>
		$isRecommendation ? "3.75rem" : "3.25rem"};
	height: ${({ $isRecommendation }) =>
		$isRecommendation ? "5.4rem" : "4.7rem"};
	border-radius: 0.8rem;

	&:focus-visible {
		outline: 0.125rem solid ${theme.colors.orangeLight};
		outline-offset: 0.125rem;
	}
`;

export const ResultLink = styled(Link)`
	display: flex;
	min-width: 0;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.35rem;
	color: ${theme.colors.foreground};
	text-decoration: none;

	&:focus-visible {
		outline: none;
	}
`;

export const ResultCover = styled.img<{ $isRecommendation?: boolean }>`
	width: ${({ $isRecommendation }) =>
		$isRecommendation ? "3.75rem" : "3.25rem"};
	height: ${({ $isRecommendation }) =>
		$isRecommendation ? "5.4rem" : "4.7rem"};
	border-radius: 0.8rem;
	object-fit: cover;
`;

export const ResultMeta = styled.span`
	display: flex;
	min-width: 0;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.35rem;
`;

export const ResultSeries = styled.span`
	display: inline-flex;
	max-width: 100%;
	align-items: center;
	border: 0.0625rem solid rgb(212 100 28 / 0.18);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.62);
	padding: 0.28rem 0.55rem;
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.72rem;
	font-weight: 600;
	line-height: 1;
	overflow: hidden;
	width: fit-content;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const ResultTitle = styled.span.attrs({
	className: "search-result-title",
})`
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.05rem;
	font-weight: 500;
	line-height: 1.15;
	transition:
		color 160ms ease,
		text-decoration-color 160ms ease;
`;

export const ResultAuthor = styled.span`
	overflow: hidden;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.85rem;
	line-height: 1.3;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const ResultRecommendationAuthor = styled(ResultAuthor)`
	color: ${theme.colors.orangeDark};
	font-weight: 700;
	white-space: normal;
`;

export const ResultDescription = styled.span`
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	line-height: 1.3;
`;

export const ResultRecommendationDescription = styled(ResultDescription)`
	border-left: 0.2rem solid ${theme.colors.orangeLight};
	border-radius: 0.4rem;
	background: rgb(218 142 91 / 0.08);
	padding: 0.55rem 0.7rem;
	color: ${theme.colors.foreground};
	font-size: 0.84rem;
	font-style: italic;
`;

export const WantButton = styled(Button)<{ $isSaved?: boolean }>`
	&& {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		justify-self: end;
		margin-right: 0.6rem;
		padding: 0.45rem 0.8rem;
		font-size: 0.82rem;
		white-space: nowrap;

		& svg {
			width: 1rem;
			height: 1rem;
		}

		@media (max-width: 34rem) {
			display: none;
		}
	}
`;

export const MiniSaveButton = styled.button<{ $isSaved?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border: 0;
	border-radius: 50%;
	background: ${({ $isSaved }) =>
		$isSaved ? theme.colors.surface : theme.colors.orangeLight};
	color: ${({ $isSaved }) =>
		$isSaved ? theme.colors.darkerOrangeLight : theme.colors.invertedText};
	cursor: pointer;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease,
		opacity 180ms ease;

	& svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	&:hover,
	&:focus-visible {
		background: ${theme.colors.bluePrimary};
		color: ${theme.colors.invertedText};
		outline: none;
		transform: translateY(-0.0625rem);
	}

	&:disabled {
		cursor: wait;
		opacity: 0.68;
		transform: none;
	}
`;
