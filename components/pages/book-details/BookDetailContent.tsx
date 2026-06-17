"use client";

import { useState } from "react";
import Rating from "@mui/material/Rating";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import Link from "next/link";
import styled from "styled-components";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import { useRateBookMutation, type IBook } from "@/shared/api/books";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import GenrePill from "@/shared/ui/GenrePill/GenrePill";
import { CoverPlaceholder } from "@/shared/ui/Skeleton";

import InfoChip, { InfoChipLabel, InfoChipValue } from "@/shared/ui/InfoChip";

import BookDetailHero from "./BookDetailHero";
import { SeriesTag } from "./BookDetailHero";
import BookDetailTabs, { type ITabId } from "./BookDetailTabs";
import BookSeriesBlock from "./BookSeriesBlock";

interface IBookDetailContentProps {
	book: IBook;
}

const getPaperCopyLabel = (
	status?: IBook["myPaperBook"] extends infer T
		? T extends { status?: infer S }
			? S
			: never
		: never,
) => {
	if (status === "owned") return "Owned copy";
	if (status === "wanted_to_buy") return "Want to buy";
	if (status === "given_away") return "Given away";
	return null;
};

const getPaperBadgeTone = (
	status?: IBook["myPaperBook"] extends infer T
		? T extends { status?: infer S }
			? S
			: never
		: never,
) => {
	if (status === "owned") {
		return {
			background: "rgb(162 198 172 / 0.35)",
			border: "rgb(140 182 154 / 0.78)",
			color: "#274534",
			icon: CheckCircleOutlineOutlinedIcon,
		};
	}

	if (status === "wanted_to_buy") {
		return {
			background: "rgb(245 204 170 / 0.36)",
			border: "rgb(230 182 143 / 0.86)",
			color: "#5a3a1c",
			icon: BookmarkBorderOutlinedIcon,
		};
	}

	return {
		background: "rgb(188 202 220 / 0.34)",
		border: "rgb(165 184 208 / 0.84)",
		color: "#243a55",
		icon: AutoStoriesOutlinedIcon,
	};
};

// const formatGenreLabel = (genre: string) =>
// 	genre
// 		.split("-")
// 		.filter(Boolean)
// 		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
// 		.join(" ");

const getBookFacts = (book: IBook) => {
	const meta: { label: string; value: string }[] = [];

	if (book.publishedYear) {
		meta.push({ label: "Year", value: String(book.publishedYear) });
	}

	if (book.pagesCount) {
		meta.push({
			label: "Pages",
			value: book.pagesCount.toLocaleString("en-US"),
		});
	}

	if (book.publisher) {
		meta.push({ label: "Publisher", value: book.publisher });
	}

	return meta;
};

const ratingLabels = [5, 4, 3, 2, 1];

const getSeriesTag = (book: IBook) => {
	const series = book.series;
	const seriesTitle = series?.title;

	if (!series || !seriesTitle) {
		return null;
	}

	const orderInSeries = series.orderInSeries ?? book.orderInSeries;
	const relationType = series.relationType ?? book.relationType;
	const mainBooksCount =
		series.books?.filter(
			(seriesBook) =>
				(seriesBook.relationType === "main" ||
					!seriesBook.relationType ||
					seriesBook.relationType === "unknown") &&
				(seriesBook.orderInSeries ?? 0) > 0,
		).length ?? 0;

	if (relationType === "spin_off") {
		return `Spin-off in ${seriesTitle}`;
	}

	if (relationType === "collection" || relationType === "omnibus") {
		return `${series.seriesLabel ?? book.seriesLabel ?? "Collection"} in ${seriesTitle}`;
	}

	if (orderInSeries && orderInSeries > 0) {
		return mainBooksCount > 0
			? `Book ${orderInSeries} of ${mainBooksCount} in ${seriesTitle}`
			: `Book ${orderInSeries} in ${seriesTitle}`;
	}

	return `Part of ${seriesTitle}`;
};

const BookDetailContent = ({ book }: IBookDetailContentProps) => {
	const coverSrc = book.coverUrl?.trim()
		? book.coverUrl
		: "/images/book-placeholder.svg";
	const seriesTag = getSeriesTag(book);
	const seriesHref = book.series?.id
		? `/series/${book.series.id}`
		: book.series?.seriesId
			? `/series/${book.series.seriesId}`
			: undefined;
	const [loadedCoverSrc, setLoadedCoverSrc] = useState("");
	const isCoverLoaded = loadedCoverSrc === coverSrc;
	const normalizedRating = book.ratingAvg ?? book.rating ?? 0;
	const formattedRating = normalizedRating.toFixed(1).replace(".0", "");
	const hasRatingBars = book.ratingsByStars.some((value) => value > 0);
	const maxRatingLine = Math.max(...book.ratingsByStars, 1);
	const bookMeta = getBookFacts(book).filter(
		(item) => item.value.trim().toLowerCase() !== "unknown",
	);
	const [authModalMode, setAuthModalMode] = useState<IAuthModalMode | null>(
		null,
	);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const rateBookMutation = useRateBookMutation();
	const [quickRating, setQuickRating] = useState(0);
	const [quickRatingMessage, setQuickRatingMessage] = useState("");
	const [activeTab, setActiveTab] = useState<ITabId>("description");
	const paperCopyLabel = getPaperCopyLabel(book.myPaperBook?.status);
	const paperBadgeTone = getPaperBadgeTone(book.myPaperBook?.status);
	const PaperBadgeIcon = paperBadgeTone.icon;
	async function handleQuickRatingChange(value: number | null) {
		const nextRating = value ?? 0;
		setQuickRating(nextRating);
		setQuickRatingMessage("");
		if (!nextRating) return;

		if (!isAuthenticated) {
			setAuthModalMode("login");
			setQuickRating(0);
			return;
		}

		try {
			await rateBookMutation.mutateAsync({
				id: book.id,
				rating: nextRating,
			});
			setQuickRatingMessage("Rating saved");
		} catch (error) {
			setQuickRating(0);
			setQuickRatingMessage(
				error instanceof Error ? error.message : "Could not save rating",
			);
		}
	}

	const desktopRatingContent = (
		<>
			<RatingTop>
				<RatingScore>{formattedRating}</RatingScore>
				<RatingMeta>
					<Stars
						name="book-average-rating"
						precision={0.5}
						readOnly
						value={normalizedRating}
					/>
					{book.ratingsCount ? (
						<Votes>{book.ratingsCount.toLocaleString("en-US")} votes</Votes>
					) : (
						<Votes>No votes yet</Votes>
					)}
				</RatingMeta>
			</RatingTop>
			{hasRatingBars ? (
				<RatingBars aria-hidden="true">
					{ratingLabels.map((label) => {
						const value = book.ratingsByStars[label - 1] ?? 0;
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
				</RatingBars>
			) : null}
			<QuickRatingBlock>
				<QuickRatingHeader>
					<QuickRatingTitle>Your rating</QuickRatingTitle>
				</QuickRatingHeader>
				<QuickMuiRating
					name="quick-book-rating"
					disabled={rateBookMutation.isPending}
					value={quickRating}
					onChange={(_, value) => void handleQuickRatingChange(value)}
				/>
				{quickRatingMessage ? (
					<QuickRatingMessage>{quickRatingMessage}</QuickRatingMessage>
				) : null}
			</QuickRatingBlock>
		</>
	);

	const mobileRatingContent = (
		<>
			<MobileRatingHeader>
				<RatingTop>
					<RatingScore>{formattedRating}</RatingScore>
					<RatingMeta>
						<Stars
							name="book-average-rating"
							precision={0.5}
							readOnly
							value={normalizedRating}
						/>
						{book.ratingsCount ? (
							<Votes>{book.ratingsCount.toLocaleString("en-US")} votes</Votes>
						) : (
							<Votes>No votes yet</Votes>
						)}
					</RatingMeta>
				</RatingTop>
				<QuickRatingBlock $compact>
					<QuickRatingHeader>
						<QuickRatingTitle>Your rating</QuickRatingTitle>
					</QuickRatingHeader>
					<QuickMuiRating
						name="quick-book-rating"
						disabled={rateBookMutation.isPending}
						value={quickRating}
						onChange={(_, value) => void handleQuickRatingChange(value)}
					/>
					{quickRatingMessage ? (
						<QuickRatingMessage>{quickRatingMessage}</QuickRatingMessage>
					) : null}
				</QuickRatingBlock>
			</MobileRatingHeader>
			{hasRatingBars ? (
				<RatingBars aria-hidden="true">
					{ratingLabels.map((label) => {
						const value = book.ratingsByStars[label - 1] ?? 0;
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
				</RatingBars>
			) : null}
		</>
	);

	return (
		<ContentWrap>
			<Backdrop aria-hidden="true" />

			<ContentGrid>
				<LeftColumn>
					{seriesTag && seriesHref ? (
						<MobileSeriesTag>
							<SeriesTagLink href={seriesHref}>
								<SeriesTag>{seriesTag}</SeriesTag>
							</SeriesTagLink>
						</MobileSeriesTag>
					) : null}
					<CoverWrap>
						{isCoverLoaded ? null : <CoverPlaceholder aria-hidden="true" />}
						<CoverImage
							$isLoaded={isCoverLoaded}
							src={coverSrc}
							alt={`Cover of ${book.title}`}
							onLoad={() => setLoadedCoverSrc(coverSrc)}
						/>
					</CoverWrap>
					{paperCopyLabel ? (
						<PaperStatusBadge
							$background={paperBadgeTone.background}
							$border={paperBadgeTone.border}
							$color={paperBadgeTone.color}
						>
							<PaperBadgeIcon aria-hidden="true" />
							<span>{paperCopyLabel}</span>
						</PaperStatusBadge>
					) : null}
					<DesktopAsideRating>{desktopRatingContent}</DesktopAsideRating>
				</LeftColumn>

				<RightColumn>
					<BookDetailHero
						book={book}
						onAuthRequired={() => setAuthModalMode("login")}
					/>
					<BookDetailTabs
						activeTab={activeTab}
						book={book}
						onActiveTabChange={setActiveTab}
					/>
					{bookMeta.length > 0 || book.genres.length > 0 ? (
						<BookFactsGrid>
							{bookMeta.length > 0 ? (
								<BookFactsSection aria-label="Book information">
									<BookFactsTitle>Book information</BookFactsTitle>
									<BookInfoBlock>
										{bookMeta.map((item) => (
											<InfoChip key={item.label}>
												<InfoChipLabel>{item.label}</InfoChipLabel>
												<InfoChipValue>{item.value}</InfoChipValue>
											</InfoChip>
										))}
									</BookInfoBlock>
								</BookFactsSection>
							) : null}
							{book.genres.length > 0 ? (
								<BookFactsSection aria-label="Book genres">
									<BookFactsTitle>Genres</BookFactsTitle>
									<GenresBlock>
										{book.genres.map((genre) => (
											<HighlightedGenrePill
												key={genre.id}
												href={`/genres/${genre.slug}`}
												fontSize="0.875rem"
												height="2rem"
												paddingBlock="0.45rem"
												paddingInline="1rem"
											>
												{genre.name}
											</HighlightedGenrePill>
										))}
									</GenresBlock>
								</BookFactsSection>
							) : null}
						</BookFactsGrid>
					) : null}
					<AsideRating>{mobileRatingContent}</AsideRating>
					<BookSeriesBlock book={book} />
				</RightColumn>
			</ContentGrid>
			{authModalMode ? (
				<AuthModal
					mode={authModalMode}
					redirectOnSuccess={false}
					onClose={() => setAuthModalMode(null)}
					onModeChange={setAuthModalMode}
				/>
			) : null}
		</ContentWrap>
	);
};

export default BookDetailContent;

const ContentWrap = styled.section`
	--detail-backdrop-height: max(20rem, calc(100vw * 356 / 1979));
	--detail-cover-offset: 5rem;
	--detail-cover-max-height: 21rem;
	--detail-cover-max-width: 16rem;

	position: relative;
	overflow: hidden;

	@media (max-width: 74.9375rem) {
		--detail-cover-offset: 4rem;
		--detail-cover-max-height: 19.5rem;
		--detail-cover-max-width: 14.5rem;
	}

	@media (max-width: 47.9375rem) {
		--detail-backdrop-height: 24rem;
		--detail-cover-offset: 2rem;
		--detail-cover-max-height: 21rem;
		--detail-cover-max-width: 17rem;
	}
`;

const Backdrop = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	left: 0;
	height: var(--detail-backdrop-height);
	background: url("/images/coverDetailCard.png") center / cover no-repeat;

	&::before {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		height: 4rem;
		background: linear-gradient(
			180deg,
			rgb(35 61 77 / 0.5) 0%,
			rgb(35 61 77 / 0.2) 48%,
			rgb(35 61 77 / 0) 100%
		);
		content: "";
		pointer-events: none;
	}

	&::after {
		position: absolute;
		right: 0;
		bottom: -0.6rem;
		left: 0;
		height: 14rem;
		background: linear-gradient(
			180deg,
			rgb(232 226 222 / 0) 0%,
			rgb(232 226 222 / 0.04) 24%,
			rgb(232 226 222 / 0.16) 44%,
			rgb(232 226 222 / 0.44) 64%,
			rgb(232 226 222 / 0.77) 79%,
			rgb(232 226 222 / 0.92) 87%,
			rgb(232 226 222) 95%,
			${theme.colors.background} 100%
		);
		content: "";
		pointer-events: none;
	}

	@media (max-width: 47.9375rem) {
		background-size: cover;
	}
`;

const ContentGrid = styled.div`
	position: relative;
	z-index: 1;
	display: grid;
	width: min(calc(100% - 3rem), var(--book-detail-width));
	margin: 0 auto;
	column-gap: 3.5rem;
	grid-template-columns: auto minmax(0, 1fr);

	@media (max-width: 74.9375rem) {
		column-gap: 2rem;
	}

	@media (max-width: 47.9375rem) {
		display: block;
		padding-top: 2rem;
	}
`;

const LeftColumn = styled.aside`
	width: fit-content;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.8rem;
	padding-top: var(--detail-cover-offset);

	@media (max-width: 47.9375rem) {
		margin: 0 auto;
		align-items: center;
		gap: 0.95rem;
	}
`;

const DesktopAsideRating = styled.section`
	width: min(100%, 16rem);
	margin-top: 1rem;
	color: ${theme.colors.foreground};

	@media (max-width: 47.9375rem) {
		display: none;
	}
`;

const MobileSeriesTag = styled.div`
	display: none;

	@media (max-width: 47.9375rem) {
		display: inline-flex;
		align-self: center;
		margin-bottom: 0.15rem;
	}
`;

const SeriesTagLink = styled(Link)`
	display: inline-flex;
	color: inherit;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		outline: none;
	}
`;

const PaperStatusBadge = styled.span<{
	$background: string;
	$border: string;
	$color: string;
}>`
	display: inline-flex;
	align-items: center;
	gap: 0.36rem;
	border: 0.0625rem solid ${({ $border }) => $border};
	border-radius: 62.4375rem;
	background: ${({ $background }) => $background};
	padding: 0.35rem 0.9rem;
	color: ${({ $color }) => $color};
	font-family: ${theme.fonts.sans};
	font-size: 0.86rem;
	font-weight: 700;
	line-height: 1.3;

	& svg {
		width: 1.08rem;
		height: 1.08rem;
	}
`;

const CoverWrap = styled.div`
	position: relative;
	display: inline-flex;
	overflow: hidden;
	width: fit-content;
	max-width: min(var(--detail-cover-max-width), 100%);
	max-height: var(--detail-cover-max-height);
	border-radius: 0.5rem;
	background: ${theme.colors.surface};
	box-shadow: 0 0 0.9375rem rgb(0 0 0 / 0.45);

	@media (max-width: 47.9375rem) {
		max-width: 100%;
	}
`;

const CoverImage = styled.img<{ $isLoaded: boolean }>`
	display: block;
	width: auto;
	height: auto;
	max-width: var(--detail-cover-max-width);
	max-height: var(--detail-cover-max-height);
	object-fit: contain;
	opacity: ${({ $isLoaded }) => ($isLoaded ? 1 : 0)};
	transition: opacity 220ms ease;
`;

const BookFactsGrid = styled.div`
	display: grid;
	align-items: start;
	gap: 1.5vw;
	margin-top: 1.8rem;
	grid-template-columns: 5fr 4fr;

	@media (max-width: 56rem) {
		grid-template-columns: 1fr;
	}
`;

const BookFactsSection = styled.section`
	min-width: 0;
	@media (max-width: 768px) {
		margin-bottom: 1.1rem;
	}
`;

const BookFactsTitle = styled.h2`
	margin: 0 0 0.65rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	font-weight: 500;
	line-height: 1.15;
`;

const BookInfoBlock = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.55rem;
	font-family: ${theme.fonts.sans};
	line-height: 1.35;
`;

const GenresBlock = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.43vw 0.35vw;
	font-family: ${theme.fonts.sans};
	@media (max-width: 47.9375rem) {
		gap: 0.95rem 0.75rem;
	}
`;

export const HighlightedGenrePill = styled(GenrePill)`
	&& {
		border-color: rgb(218 142 91 / 0.25);
		background: rgb(242 239 237 / 0.86);
		color: ${theme.colors.orangeDark};
		font-weight: 700;
		box-shadow: 0 0.25rem 0.85rem rgb(4 18 26 / 0.04);

		&:hover,
		&:focus-visible {
			background: ${theme.colors.orangeLight};
			color: ${theme.colors.invertedText};
		}
	}
`;

const AsideRating = styled.section`
	width: 100%;
	margin-top: 1rem;
	padding: 1rem;
	color: ${theme.colors.foreground};

	@media (min-width: 47.9375rem) {
		display: none;
	}

	@media (max-width: 47.9375rem) {
		max-width: 100%;
		padding-inline: 0;
	}
`;

const MobileRatingHeader = styled.div`
	display: none;

	@media (max-width: 47.9375rem) {
		display: flex;
		gap: 0.85rem;
		align-items: center;
		justify-content: space-around;
		margin-bottom: 1.25rem;
	}
`;

const RatingTop = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-around;
	gap: 0.75rem;
`;

const RatingScore = styled.div`
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

const RatingMeta = styled.div`
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.25rem;
`;

const Stars = styled(Rating)`
	display: flex;
	color: ${theme.colors.orangePrimary} !important;
	gap: 0.05vw;
	& svg {
		width: clamp(0.95rem, 1.2vw, 1.1rem);
		height: clamp(0.95rem, 1.2vw, 1.1rem);
	}
`;

const Votes = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.78rem;
	line-height: 1.2;
`;

const QuickRatingBlock = styled.div<{ $compact?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 0.45rem;
	margin-top: 1rem;
	border-top: 0.0625rem solid rgb(242 239 237 / 0.72);
	padding-top: 0.95rem;

	@media (max-width: 47.9375rem) {
		margin-top: ${({ $compact }) => ($compact ? "0" : "1rem")};
		padding-top: ${({ $compact }) => ($compact ? "0" : "0.95rem")};
		border-top: ${({ $compact }) =>
			$compact ? "0" : "0.0625rem solid rgb(242 239 237 / 0.72)"};
	}
`;

const QuickRatingHeader = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.75rem;
`;

const QuickRatingTitle = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.05rem;
	font-weight: 600;
	line-height: 1.2;
`;

const QuickMuiRating = styled(Rating)`
	color: ${theme.colors.orangePrimary} !important;

	& .MuiRating-icon {
		width: clamp(1.15rem, 1.8vw, 1.45rem);
		height: clamp(1.15rem, 1.8vw, 1.45rem);
	}

	& .MuiSvgIcon-root {
		width: clamp(1.1rem, 1.6vw, 1.35rem);
		height: clamp(1.1rem, 1.6vw, 1.35rem);
	}
`;

const QuickRatingMessage = styled.p`
	margin: -0.15rem 0 0;
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.76rem;
	line-height: 1.25;
`;

const QuickReviewLink = styled.button`
	align-self: flex-start;
	border: 0;
	background: transparent;
	padding: 0;
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	line-height: 1.35;
	text-decoration: underline;
	text-underline-offset: 0.18rem;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;
const RatingBars = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin-top: 0.95rem;
`;

const BarRow = styled.div`
	display: grid;
	align-items: center;
	gap: 0.45rem;
	grid-template-columns: 0.7rem 1fr;
`;

const BarLabel = styled.span`
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.72rem;
	font-weight: 700;
	line-height: 1;
`;

const BarTrack = styled.span`
	overflow: hidden;
	height: 0.32rem;
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.82);
`;

const BarFill = styled.span<{ $width: number }>`
	display: block;
	width: ${({ $width }) => `${$width}%`};
	height: 100%;
	border-radius: inherit;
	background: ${theme.colors.orangeLight};
`;

const RightColumn = styled.div`
	min-width: 0;
	overflow: hidden;
	padding-bottom: 2rem;

	@media (max-width: 47.9375rem) {
		padding-top: 0.5rem;
	}
`;
