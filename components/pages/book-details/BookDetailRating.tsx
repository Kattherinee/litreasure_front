"use client";

import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import styled from "styled-components";
import Rating from "@mui/material/Rating";

import type { IBook } from "@/shared/api/books";
import { theme } from "@/shared/theme";
import Button from "@/shared/ui/Button/Button";

interface IBookDetailRatingProps {
	book: IBook;
}

const defaultRatingLines = [0, 0, 0, 0, 0];

const BookDetailRating = ({ book }: IBookDetailRatingProps) => {
	const normalizedRating = book.ratingAvg ?? book.rating ?? 0;
	const activeStars = Math.round(normalizedRating);
	const formattedRating = normalizedRating.toFixed(1).replace(".0", "");
	const ratingsCount = book.ratingsCount ?? 0;
	const ratingLines =
		book.ratingsByStars.length > 0 ? book.ratingsByStars : defaultRatingLines;
	const maxRatingLine = Math.max(...ratingLines, 1);

	return (
		<RatingSection>
			<Heading>Rating</Heading>

			<RatingBody>
				<ScoreBlock>
					<Score>{formattedRating}</Score>
					<ScoreMeta>
						<Stars aria-label={`Rating ${formattedRating} out of 5`}>
							{Array.from({ length: 5 }, (_, index) =>
								index < activeStars ? (
									<StarIcon key={index} aria-hidden="true" />
								) : (
									<StarBorderIcon key={index} aria-hidden="true" />
								),
							)}
						</Stars>
						<Votes>{ratingsCount.toLocaleString("en-US")}</Votes>
					</ScoreMeta>
				</ScoreBlock>

				<Bars aria-hidden="true">
					{[5, 4, 3, 2, 1].map((label, index) => {
						const value = ratingLines[label - 1] ?? ratingLines[index] ?? 0;
						const width = (value / maxRatingLine) * 100;

						return (
							<BarRow key={label}>
								<BarLabel>{label}</BarLabel>
								<BarTrack>
									<BarFill $width={width} />
								</BarTrack>
							</BarRow>
						);
					})}
				</Bars>

				<Divider />

				<UserRate>
					<UserRateTitle>Your Rate</UserRateTitle>
					<Rating name="simple-uncontrolled" defaultValue={book.rating ?? 0} />
					<MarkButton>Mark it</MarkButton>
				</UserRate>
			</RatingBody>
		</RatingSection>
	);
};

export default BookDetailRating;

const RatingSection = styled.section`
	margin-top: 2.8rem;
`;

const Heading = styled.h2`
	margin: 0 0 1.1rem;
	color: ${theme.colors.black};
	font-family: ${theme.fonts.serif};
	font-size: 1.6rem;
	font-weight: 500;
	line-height: 1.35;
`;

const RatingBody = styled.div`
	display: flex;
	align-items: center;
	gap: 3rem;

	@media (max-width: 70rem) {
		align-items: flex-start;
		flex-direction: column;
		gap: 1.5rem;
	}
`;

const ScoreBlock = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const Score = styled.div`
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 3rem;
	font-weight: 700;
	line-height: 1;
`;

const ScoreMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
`;

const Stars = styled.div`
	display: flex;
	gap: 0.08rem;
	color: ${theme.colors.orangePrimary};

	& svg {
		width: 1.05rem;
		height: 1.05rem;
	}
`;

const Votes = styled.div`
	color: ${theme.colors.bluePrimary};
	font-family: ${theme.fonts.sans};
	font-size: 1rem;
	line-height: 1;
`;

const Bars = styled.div`
	display: flex;
	width: 20rem;
	flex-direction: column;
	gap: 0.3rem;
`;

const BarRow = styled.div`
	display: grid;
	align-items: center;
	gap: 0.5rem;
	grid-template-columns: 0.75rem 1fr;
`;

const BarLabel = styled.span`
	color: ${theme.colors.black};
	font-family: ${theme.fonts.sans};
	font-size: 0.8rem;
	font-weight: 700;
	line-height: 1;
`;

const BarTrack = styled.span`
	overflow: hidden;
	height: 0.4rem;
	border-radius: 62.4375rem;
	background: ${theme.colors.surface};
`;

const BarFill = styled.span<{ $width: number }>`
	display: block;
	width: ${({ $width }) => `${$width}%`};
	height: 100%;
	border-radius: inherit;
	background: ${theme.colors.orangeLight};
`;

const Divider = styled.div`
	width: 0.0625rem;
	height: 5.1rem;
	background: ${theme.colors.muted};

	@media (max-width: 70rem) {
		display: none;
	}
`;

const UserRate = styled.div`
	display: flex;
	align-items: center;
	flex-direction: column;
	gap: 0.75rem;
`;

const UserRateTitle = styled.div`
	color: ${theme.colors.black};
	font-family: ${theme.fonts.sans};
	font-size: 1.025rem;
	font-weight: 600;
	line-height: 1.1;
`;

const MarkButton = styled(Button)`
	&& {
		padding: 0.38rem 1.35rem;

		font-size: 0.875rem;
		line-height: 1.2;
	}
`;
