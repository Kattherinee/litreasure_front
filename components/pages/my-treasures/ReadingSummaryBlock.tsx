"use client";

import Link from "next/link";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import type {
	IBookChallenge,
	IChallengePeriodType,
} from "@/shared/api/book-challenge";
import type { IUserBookTracking } from "@/shared/api/user-books";
import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";
import styled from "styled-components";

interface IReadingSummaryBlockProps {
	activeChallengeIndex: number;
	activeChallenges: IBookChallenge[];
	challengeCanScrollNext: boolean;
	challengeCanScrollPrev: boolean;
	challengeSliderRef: (node: HTMLDivElement | null) => void;
	isReadingBooksLoading: boolean;
	readingBooks: IUserBookTracking[];
	readingBooksCount: number;
	readingCanScrollNext: boolean;
	readingCanScrollPrev: boolean;
	readingSliderRef: (node: HTMLDivElement | null) => void;
	selectedReadingIndex: number;
	showChallenge: (direction: "next" | "prev") => void;
	showReadingBook: (direction: "next" | "prev") => void;
}

const challengePeriodLabels: Record<IChallengePeriodType, string> = {
	month: "month",
	week: "week",
	year: "year",
};

const formatChallengeDate = (date: string) =>
	new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "short",
	}).format(new Date(date));

const clampPercent = (value?: number) => Math.min(Math.max(value ?? 0, 0), 100);

export const ReadingSummaryBlock = ({
	activeChallengeIndex,
	activeChallenges,
	challengeCanScrollNext,
	challengeCanScrollPrev,
	challengeSliderRef,
	isReadingBooksLoading,
	readingBooks,
	readingBooksCount,
	readingCanScrollNext,
	readingCanScrollPrev,
	readingSliderRef,
	selectedReadingIndex,
	showChallenge,
	showReadingBook,
}: IReadingSummaryBlockProps) => (
	<ReadingCard>
		<HeroCopy>
			<Title>My Treasures</Title>
			<Lead>
				Your books, collections, authors, series, and quotes. Everything you
				save or create is gathered here.
			</Lead>
		</HeroCopy>
		<ReadingShelf>
			<ReadingHeader>
				<CardEyebrow>Currently Reading</CardEyebrow>
			</ReadingHeader>
			{isReadingBooksLoading ? (
				<CardText>Loading current books...</CardText>
			) : readingBooks.length > 0 ? (
				<ReadingSpotlight>
					<ReadingViewport ref={readingSliderRef}>
						<ReadingTrack>
							{readingBooks.map((item, index) => (
								<ReadingSlide key={item.book.id}>
									<ReadingCoverLink href={`/books/${item.book.id}`}>
										<ReadingCoverImage
											$isSingle={readingBooksCount === 1}
											$isActive={index === selectedReadingIndex}
											alt={item.book.title ?? "Current book"}
											aria-label={item.book.title ?? "Current book"}
											src={item.book.coverUrl || "/images/book-placeholder.svg"}
										/>
									</ReadingCoverLink>
								</ReadingSlide>
							))}
						</ReadingTrack>
					</ReadingViewport>
					{readingBooksCount > 1 ? (
						<ReadingNav>
							<RailControlButton
								aria-label="Previous reading book"
								disabled={!readingCanScrollPrev}
								type="button"
								onClick={() => showReadingBook("prev")}
							>
								<KeyboardArrowLeftIcon aria-hidden="true" />
							</RailControlButton>
							<ReadingIndex>
								{selectedReadingIndex + 1} of {readingBooksCount}
							</ReadingIndex>
							<RailControlButton
								aria-label="Next reading book"
								disabled={!readingCanScrollNext}
								type="button"
								onClick={() => showReadingBook("next")}
							>
								<KeyboardArrowRightIcon aria-hidden="true" />
							</RailControlButton>
						</ReadingNav>
					) : null}
				</ReadingSpotlight>
			) : (
				<>
					<CardTitle>Nothing Here Yet</CardTitle>
					<CardText>
						Books with the reading status will be pinned here separately from
						the main list.
					</CardText>
					<Button buttonType="oxygenPill" href="/search">
						Choose a book
					</Button>
				</>
			)}
		</ReadingShelf>

		<ChallengeCard>
			<ChallengeCopy>
				<ChallengeHeading>
					<CardEyebrow>Book Challenge</CardEyebrow>
					<ChallengeDetailsLink href="/book-challenge">
						View details
					</ChallengeDetailsLink>
				</ChallengeHeading>
				<ChallengeViewport ref={challengeSliderRef}>
					<ChallengeTrack>
						{(activeChallenges.length > 0 ? activeChallenges : [null]).map(
							(challenge, index) => {
								const challengeProgress = clampPercent(
									challenge?.progress?.value?.percent,
								);
								const challengeTimeProgress = clampPercent(
									challenge?.progress?.time?.percent,
								);
								const challengeCurrentValue =
									challenge?.progress?.value?.current ?? 0;
								const challengeRemainingDays =
									challenge?.progress?.time?.remainingDays ?? 0;
								const challengeUnit =
									challenge?.type === "pages" ? "pages" : "books";

								return (
									<ChallengeSlide
										key={challenge?.id ?? `challenge-empty-${index}`}
									>
										<ChallengeGraph
											href="/book-challenge"
											$timePercent={challengeTimeProgress}
											aria-label="Book challenge progress"
										>
											<ChallengeValueRing $valuePercent={challengeProgress}>
												<ChallengeGraphCenter>
													<ChallengeGraphLabel>
														{challenge
															? `For ${challengePeriodLabels[challenge.periodType]}`
															: "No challenge"}
													</ChallengeGraphLabel>
													<ChallengeGraphValue>
														{challenge
															? `${challengeCurrentValue} / ${challenge.targetValue} ${challengeUnit}`
															: "0"}
													</ChallengeGraphValue>
													{challenge ? (
														<ChallengeGraphMeta>
															{challengeRemainingDays} days left · until{" "}
															{formatChallengeDate(challenge.endDate)}
														</ChallengeGraphMeta>
													) : (
														<ChallengeGraphMeta>
															Create a reading goal
														</ChallengeGraphMeta>
													)}
												</ChallengeGraphCenter>
											</ChallengeValueRing>
										</ChallengeGraph>
									</ChallengeSlide>
								);
							},
						)}
					</ChallengeTrack>
				</ChallengeViewport>
				{activeChallenges.length > 1 ? (
					<ReadingNav>
						<RailControlButton
							aria-label="Previous challenge"
							disabled={!challengeCanScrollPrev}
							type="button"
							onClick={() => showChallenge("prev")}
						>
							<KeyboardArrowLeftIcon aria-hidden="true" />
						</RailControlButton>
						<ReadingIndex>
							{activeChallengeIndex + 1} of {activeChallenges.length}
						</ReadingIndex>
						<RailControlButton
							aria-label="Next challenge"
							disabled={!challengeCanScrollNext}
							type="button"
							onClick={() => showChallenge("next")}
						>
							<KeyboardArrowRightIcon aria-hidden="true" />
						</RailControlButton>
					</ReadingNav>
				) : null}
			</ChallengeCopy>
		</ChallengeCard>
	</ReadingCard>
);

const HeroCopy = styled.div`
	min-width: 0;
	width: fit-content;
	align-self: center;
	margin: 0 1vw;
`;
const Title = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(1.95rem, 4vw, 2.8rem);
	line-height: 1.05;
`;
const Lead = styled.p`
	max-width: 29rem;
	margin: 0.45rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 0.92rem;
	line-height: 1.4;
`;
const ReadingCard = styled.section`
	display: grid;
	align-items: stretch;
	grid-template-columns: minmax(0, 1fr) auto auto;
	gap: 0.65rem;
	margin: 0 auto 0.8rem;
	justify-content: center;
	width: fit-content;
	@media (max-width: 50rem) {
		grid-template-columns: 1fr;
	}
`;
const CardEyebrow = styled.p`
	margin: 0 0 0.35rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;
const CardTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.6rem;
	line-height: 1.15;
`;
const CardText = styled.p`
	margin: 0.55rem 0 1rem;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;
const ReadingShelf = styled.div`
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 1rem;
	background: rgb(242 239 237 / 0.74);
	padding: 1rem 1.5rem 0.6rem;
	width: 100%;
	max-width: 19.5rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		max-width: none;
	}
`;
const ReadingHeader = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 0.55rem;
`;
const ReadingSpotlight = styled.div`
	display: grid;
	justify-items: center;
`;
const ReadingViewport = styled.div`
	width: 100%;
	overflow: hidden;
	touch-action: pan-y;
`;
const ReadingTrack = styled.div`
	display: flex;
	align-items: center;
`;
const ReadingSlide = styled.div`
	display: flex;
	justify-content: center;
	flex: 0 0 46%;
	padding: 0.2rem 0.1rem;
	@media (max-width: 40rem) {
		flex: 0 0 36%;
	}
`;
const ReadingCoverLink = styled(Link)`
	text-decoration: none;
`;
const ReadingCoverImage = styled.img<{
	$isActive: boolean;
	$isSingle?: boolean;
}>`
	height: ${({ $isSingle }) => ($isSingle ? "14.2rem" : "12.5rem")};
	border-radius: 0.55rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	object-fit: cover;
	opacity: ${({ $isActive }) => ($isActive ? 1 : 0.58)};
	transform: ${({ $isActive }) => ($isActive ? "scale(1)" : "scale(0.82)")};
	transition:
		transform 280ms ease,
		opacity 240ms ease;
`;
const ReadingNav = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.8rem;
	margin-top: 0.65rem;
`;
const ReadingIndex = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.75rem;
`;
const RailControlButton = styled.button`
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
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: none;
	}
`;
const ChallengeCard = styled.section`
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 1rem 1.15rem 1.1rem;
	max-width: 19.5rem;
	width: 100%;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 1rem;
	background: rgb(242 239 237 / 0.74);

	@media (max-width: ${theme.rubberSize.tablet}) {
		max-width: none;
	}
`;
const ChallengeCopy = styled.div`
	width: 100%;
`;
const ChallengeHeading = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 0.75rem;
`;
const ChallengeDetailsLink = styled(Link)`
	color: ${theme.colors.orangeDark};
	font-size: 0.82rem;
	font-weight: 700;
	text-decoration: none;
`;
const ChallengeViewport = styled.div`
	width: min(100%, 20rem);
	margin: 0 auto;
	overflow: hidden;
`;
const ChallengeTrack = styled.div`
	display: flex;
`;
const ChallengeSlide = styled.div`
	display: flex;
	justify-content: center;
	flex: 0 0 100%;
`;
const ChallengeGraph = styled(Link)<{ $timePercent: number }>`
	position: relative;
	display: grid;
	width: clamp(10.8rem, 16vw, 13rem);
	aspect-ratio: 1;
	place-items: center;
	border-radius: 50%;
	color: inherit;
	text-decoration: none;
	&::before {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: conic-gradient(
			${theme.colors.bluePrimary} ${({ $timePercent }) => `${$timePercent}%`},
			rgb(35 61 77 / 0.12) 0
		);
		content: "";
		mask: radial-gradient(
			farthest-side,
			transparent calc(100% - 0.72rem),
			#000 calc(100% - 0.7rem)
		);
	}
`;
const ChallengeValueRing = styled.div<{ $valuePercent: number }>`
	position: relative;
	z-index: 1;
	display: grid;
	width: calc(100% - 2.1rem);
	height: calc(100% - 2.1rem);
	place-items: center;
	border-radius: inherit;
	background: conic-gradient(
		${theme.colors.orangeLight} ${({ $valuePercent }) => `${$valuePercent}%`},
		rgb(254 127 45 / 0.16) 0
	);
	padding: 0.54rem;
`;
const ChallengeGraphCenter = styled.div`
	display: grid;
	width: 100%;
	height: 100%;
	align-content: center;
	justify-items: center;
	border-radius: inherit;
	background: ${theme.colors.background};
	padding: 0.65rem;
	text-align: center;
`;
const ChallengeGraphLabel = styled.span`
	color: ${theme.colors.orangeDark};
	font-size: 0.68rem;
	font-weight: 700;
	text-transform: uppercase;
`;
const ChallengeGraphValue = styled.span`
	margin-top: 0.2rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	font-weight: 700;
`;
const ChallengeGraphMeta = styled.span`
	margin-top: 0.2rem;
	color: ${theme.colors.softForeground};
	font-size: 0.66rem;
`;
