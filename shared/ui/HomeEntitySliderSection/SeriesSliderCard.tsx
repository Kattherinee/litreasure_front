import type { ISeriesPreview } from "@/shared/api/series";
import Link from "next/link";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { ResultSeries } from "../BookSearch/SearchResultCard.styles";

interface IProps {
	seriesItem: ISeriesPreview;
}

export const SeriesSliderCard = ({ seriesItem }: IProps) => {
	return (
		<SeriesTreasureCard
			prefetch={false}
			href={`/series/${seriesItem.id}`}
		>
			<SeriesCoverStack aria-hidden="true">
				{Array.from({ length: 3 }, (_, index) => (
					<SeriesCover
						key={index}
						$index={index}
						alt=""
						decoding="async"
						loading="lazy"
						src={seriesItem.coverUrl ?? "/images/book-placeholder.svg"}
					/>
				))}
			</SeriesCoverStack>
			<TreasureResourceMeta>
				<TreasureResourceTitle>{seriesItem.title}</TreasureResourceTitle>
				<TreasureResourceText>{seriesItem.authorName}</TreasureResourceText>
				<ResultSeries>{seriesItem.bookCount ?? 0} books</ResultSeries>
			</TreasureResourceMeta>
		</SeriesTreasureCard>
	);
};

const SeriesTreasureCard = styled(Link)`
	display: flex;
	align-items: center;
	justify-content: center;
	height: fit-content;
	gap: 1.4rem;
	flex-direction: column;
	text-align: center;
	width: fit-content;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 0.75rem;

	padding: 1.25rem 1.5rem 1.25rem 2.15rem;
	color: inherit;
	text-decoration: none;
	transition:
		border-color 180ms ease,
		background 180ms ease,
		transform 180ms ease;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};

		outline: none;
	}
`;

const SeriesCoverStack = styled.div`
	position: relative;
	display: block;
	height: 9.625rem;
	width: fit-content;
	margin-inline: auto;
`;

const SeriesCover = styled.img<{ $index: number }>`
	position: absolute;
	top: ${({ $index }) => $index * 0.3}rem;
	left: 50%;
	z-index: ${({ $index }) => 3 - $index};
	width: auto;
	height: 9.625rem;
	border: 0.0625rem solid ${theme.colors.background};
	border-radius: 0.45rem;
	transform: translateX(calc(-50% - ${({ $index }) => $index * 0.3}rem));
	object-fit: cover;
`;
export const TreasureResourceMeta = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: auto 0;
	gap: 0.35rem;
`;
const TreasureResourceTitle = styled.h3`
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.1rem;
	font-weight: 600;
	line-height: 1.15;
`;

const TreasureResourceText = styled.p`
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	margin: 0.28rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 0.8rem;
	line-height: 1.3;
	margin-block: 0;
	margin-bottom: 0.1rem;
`;
