"use client";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import { AuthorEditModal } from "@/components/pages/author/AuthorEditModal";
import {
	ResultsBadge as BaseResultsBadge,
	ResultsNumber as TotalNumber,
	ResultsText as TotalText,
} from "@/components/pages/AuthorsFilters";
import {
	type IAuthorBookSort,
	type IAuthorSeries,
	useDeleteAuthorMutation,
	useAuthorQuery,
	useSaveAuthorMutation,
	useUnsaveAuthorMutation,
	useUpdateAuthorMutation,
} from "@/shared/api/authors";
import {
	useSaveSeriesMutation,
	useUnsaveSeriesMutation,
} from "@/shared/api/series";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { AuthorAvatar } from "@/shared/ui/AuthorAvatar";
import { BookCard } from "@/shared/ui/BookCard";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import {
	CarouselContainer,
	CarouselControlButton,
	CarouselControls,
	CarouselSlide,
	CarouselViewport,
} from "@/shared/ui/Carousel/Carousel.styles";
import { useHorizontalCarousel } from "@/shared/ui/Carousel/useHorizontalCarousel";
import { GenrePill } from "@/shared/ui/GenrePill";
import { BookCardSkeleton, SkeletonBlock } from "@/shared/ui/Skeleton";

interface IAuthorPageProps {
	id: string;
}

const bookSortOptions: Array<{ label: string; value: IAuthorBookSort }> = [
	{ label: "Series order", value: "series_order" },
	{ label: "Popular", value: "popular" },
	{ label: "A-Z", value: "title_asc" },
	{ label: "Z-A", value: "title_desc" },
];

const AuthorPage = ({ id }: IAuthorPageProps) => {
	const router = useRouter();
	const [authModalMode, setAuthModalMode] = useState<IAuthModalMode | null>(
		null,
	);
	const [authorSavedOverride, setAuthorSavedOverride] = useState<
		boolean | null
	>(null);
	const [savedSeriesOverrides, setSavedSeriesOverrides] = useState<
		Record<string, boolean>
	>({});
	const [isBioExpanded, setIsBioExpanded] = useState(false);
	const [canExpandBio, setCanExpandBio] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editBio, setEditBio] = useState("");
	const [editPhotoUrl, setEditPhotoUrl] = useState("");
	const [actionMessage, setActionMessage] = useState("");
	const [bookSort, setBookSort] = useState<IAuthorBookSort>("series_order");
	const bioRef = useRef<HTMLParagraphElement | null>(null);
	const {
		data: author,
		error,
		isError,
		isLoading,
	} = useAuthorQuery(id, {
		bookSort,
	});
	const visibleBooks = author?.books.slice(0, 27) ?? [];
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const saveAuthorMutation = useSaveAuthorMutation();
	const unsaveAuthorMutation = useUnsaveAuthorMutation();
	const updateAuthorMutation = useUpdateAuthorMutation();
	const deleteAuthorMutation = useDeleteAuthorMutation();
	const saveSeriesMutation = useSaveSeriesMutation();
	const unsaveSeriesMutation = useUnsaveSeriesMutation();
	const isAuthorSavePending =
		saveAuthorMutation.isPending || unsaveAuthorMutation.isPending;
	const isSeriesSavePending =
		saveSeriesMutation.isPending || unsaveSeriesMutation.isPending;
	const isAuthorSaved = authorSavedOverride ?? author?.isSaved ?? false;
	const isMyAuthor = author?.isPublic === false;

	const getIsSeriesSaved = (seriesId: string, initialValue?: boolean) =>
		savedSeriesOverrides[seriesId] ?? initialValue ?? false;

	useEffect(() => {
		const bioNode = bioRef.current;

		if (!bioNode) {
			return;
		}

		const updateBioOverflow = () => {
			if (isBioExpanded) {
				return;
			}

			setCanExpandBio(bioNode.scrollHeight > bioNode.clientHeight + 1);
		};

		updateBioOverflow();

		const resizeObserver = new ResizeObserver(updateBioOverflow);
		resizeObserver.observe(bioNode);

		return () => {
			resizeObserver.disconnect();
		};
	}, [author?.bio, isBioExpanded]);

	const requestAuth = () => {
		setAuthModalMode("login");
	};

	const openEditAuthor = () => {
		if (!author) return;

		setEditName(author.name);
		setEditBio(author.bio ?? "");
		setEditPhotoUrl(author.photoUrl ?? "");
		setIsEditOpen(true);
	};

	const handleBookSortChange = (nextSort: IAuthorBookSort) => {
		setBookSort(nextSort);
	};

	const handleToggleAuthorSave = async () => {
		if (!author) {
			return;
		}

		if (!isAuthenticated) {
			requestAuth();
			return;
		}

		const wasSaved = isAuthorSaved;
		setAuthorSavedOverride(!wasSaved);

		try {
			if (wasSaved) {
				await unsaveAuthorMutation.mutateAsync(author.id);
			} else {
				await saveAuthorMutation.mutateAsync(author.id);
			}
		} catch {
			setAuthorSavedOverride(wasSaved);
		}
	};

	const handleToggleSeriesSave = async (
		seriesId: string,
		initialValue?: boolean,
	) => {
		if (!isAuthenticated) {
			requestAuth();
			return;
		}

		const wasSaved = getIsSeriesSaved(seriesId, initialValue);
		setSavedSeriesOverrides((currentState) => ({
			...currentState,
			[seriesId]: !wasSaved,
		}));

		try {
			if (wasSaved) {
				await unsaveSeriesMutation.mutateAsync(seriesId);
			} else {
				await saveSeriesMutation.mutateAsync(seriesId);
			}
		} catch {
			setSavedSeriesOverrides((currentState) => ({
				...currentState,
				[seriesId]: wasSaved,
			}));
		}
	};

	const saveAuthorChanges = async () => {
		if (!author) return;

		const name = editName.trim();
		setActionMessage("");

		if (!name) {
			setActionMessage("Author name is required");
			return;
		}

		try {
			await updateAuthorMutation.mutateAsync({
				id: author.id,
				payload: {
					bio: editBio.trim() || undefined,
					name,
					photoUrl: editPhotoUrl.trim() || undefined,
				},
			});
			setIsEditOpen(false);
			setActionMessage("Author updated");
		} catch (error) {
			setActionMessage(
				error instanceof Error ? error.message : "Could not update author",
			);
		}
	};

	const deleteAuthor = async () => {
		if (!author) return;

		setActionMessage("");
		try {
			await deleteAuthorMutation.mutateAsync(author.id);
			router.push("/authors");
		} catch (error) {
			setActionMessage(
				error instanceof Error ? error.message : "Could not delete author",
			);
		}
	};

	if (isLoading) {
		return (
			<Page>
				<Content>
					<SkeletonBlock $height="2rem" $width="8rem" />
					<Hero>
						<SkeletonBlock $height="9rem" $radius="50%" $width="9rem" />
						<HeroCopy>
							<SkeletonBlock $height="3rem" $width="min(100%, 28rem)" />
							<SkeletonBlock $height="1rem" $width="min(100%, 36rem)" />
							<SkeletonBlock $height="1rem" $width="min(100%, 30rem)" />
						</HeroCopy>
					</Hero>
					<BookGrid>
						{Array.from({ length: 6 }, (_, index) => (
							<BookCardSkeleton key={index} size="compact" />
						))}
					</BookGrid>
				</Content>
			</Page>
		);
	}

	if (isError) {
		return (
			<Page>
				<Content>
					<StateMessage>Could not load author: {error.message}</StateMessage>
				</Content>
			</Page>
		);
	}

	if (!author) {
		return (
			<Page>
				<Content>
					<StateMessage>Author not found.</StateMessage>
				</Content>
			</Page>
		);
	}

	return (
		<Page>
			<Content>
				<Hero>
					<AuthorAvatar
						fontSize="2.5rem"
						name={author.name}
						photoUrl={author.photoUrl}
						size="7rem"
					/>
					<HeroCopy>
						<TitleRow>
							<Title>{author.name}</Title>
							<TitleActions>
								{isAuthorSaved ? (
									<SavedActionButton
										aria-label="Remove author from saved"
										disabled={isAuthorSavePending}
										title="Remove from saved"
										type="button"
										onClick={() => void handleToggleAuthorSave()}
									>
										<BookmarkIcon aria-hidden="true" />
										<span>
											{isAuthorSavePending ? "Saving..." : "Subscribed"}
										</span>
									</SavedActionButton>
								) : (
									<SaveActionButton
										disabled={isAuthorSavePending}
										type="button"
										onClick={() => void handleToggleAuthorSave()}
									>
										{isAuthorSavePending ? "Saving..." : "Subscribe"}
									</SaveActionButton>
								)}
								{isMyAuthor ? (
									<OwnerActions aria-label="Actions for your author">
										<OwnerActionButton type="button" onClick={openEditAuthor}>
											Edit
										</OwnerActionButton>
										<DangerActionButton
											type="button"
											disabled={deleteAuthorMutation.isPending}
											onClick={() => setIsDeleteConfirmOpen(true)}
										>
											Delete
										</DangerActionButton>
									</OwnerActions>
								) : null}
							</TitleActions>
						</TitleRow>
						{actionMessage ? (
							<ActionMessage role="status">{actionMessage}</ActionMessage>
						) : null}
						<Facts>
							<TotalBadge
								aria-label={`Total author books: ${author.bookCount}`}
							>
								<TotalNumber>{author.bookCount}</TotalNumber>
								<TotalText>total books</TotalText>
							</TotalBadge>
							{author.topGenres && author.topGenres.length > 0 ? (
								<GenreChips aria-label="Author genres">
									{author.topGenres.map((genre) => (
										<AuthorGenrePill
											key={genre.id}
											href={`/genres/${genre.slug}`}
										>
											{genre.name}
										</AuthorGenrePill>
									))}
								</GenreChips>
							) : null}
						</Facts>
						{author.bio ? (
							<BioWrap>
								<Bio ref={bioRef} $isExpanded={isBioExpanded}>
									{author.bio}
								</Bio>
								{canExpandBio || isBioExpanded ? (
									<BioToggle
										$isExpanded={isBioExpanded}
										type="button"
										onClick={() =>
											setIsBioExpanded((currentState) => !currentState)
										}
									>
										{isBioExpanded ? "Collapse" : "Show more"}
									</BioToggle>
								) : null}
							</BioWrap>
						) : null}
					</HeroCopy>
				</Hero>

				{author.bookCount > 0 ? (
					<BooksToolbar>
						<SortLabel htmlFor="author-books-sort">Book sorting</SortLabel>
						<SortSelect
							id="author-books-sort"
							value={bookSort}
							onChange={(event) =>
								handleBookSortChange(event.target.value as IAuthorBookSort)
							}
						>
							{bookSortOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</SortSelect>
					</BooksToolbar>
				) : null}

				{author.series.length > 0 ? (
					<Section>
						<SectionHeader>
							<SectionTitle>Series</SectionTitle>
							<SectionStats>
								<TotalBadge
									aria-label={`Total series: ${author.series.length}`}
								>
									<TotalNumber>{author.series.length}</TotalNumber>
									<TotalText>total</TotalText>
								</TotalBadge>
							</SectionStats>
						</SectionHeader>
						<SeriesList>
							{author.series.map((series) => (
								<AuthorSeriesCard
									key={series.id}
									authorName={author.name}
									isSeriesSavePending={isSeriesSavePending}
									series={series}
									onToggleSeriesSave={handleToggleSeriesSave}
									getIsSeriesSaved={getIsSeriesSaved}
								/>
							))}
						</SeriesList>
					</Section>
				) : null}

				{visibleBooks.length > 0 ? (
					<Section>
						<SectionHeader>
							<SectionTitle>Books</SectionTitle>
							<TotalBadge aria-label={`Total books: ${author.books.length}`}>
								<TotalNumber>{author.books.length}</TotalNumber>
								<TotalText>total</TotalText>
							</TotalBadge>
						</SectionHeader>
						<BookGrid>
							{visibleBooks.map((book) => (
								<BookCard
									key={book.id}
									size="compact"
									book={{
										...book,
										author: author.name,
										relationType: book.seriesRelationType,
									}}
								/>
							))}
						</BookGrid>
					</Section>
				) : null}
				{isEditOpen ? (
					<AuthorEditModal
						bio={editBio}
						books={author.books}
						isSaving={updateAuthorMutation.isPending}
						name={editName}
						photoUrl={editPhotoUrl}
						onBioChange={setEditBio}
						onClose={() => setIsEditOpen(false)}
						onNameChange={setEditName}
						onPhotoUrlChange={setEditPhotoUrl}
						onSave={() => void saveAuthorChanges()}
					/>
				) : null}
				{isDeleteConfirmOpen ? (
					<ConfirmModal
						confirmLabel="Delete"
						confirmLoadingLabel="Deleting..."
						isLoading={deleteAuthorMutation.isPending}
						title="Delete author?"
						onCancel={() => setIsDeleteConfirmOpen(false)}
						onConfirm={() => void deleteAuthor()}
					>
						The author will be removed from your list, and links to their books
						will be deleted.
					</ConfirmModal>
				) : null}
				{authModalMode ? (
					<AuthModal
						mode={authModalMode}
						redirectOnSuccess={false}
						onClose={() => setAuthModalMode(null)}
						onModeChange={setAuthModalMode}
					/>
				) : null}
			</Content>
		</Page>
	);
};

const AuthorSeriesCard = ({
	authorName,
	getIsSeriesSaved,
	isSeriesSavePending,
	onToggleSeriesSave,
	series,
}: {
	authorName: string;
	getIsSeriesSaved: (seriesId: string, initialValue?: boolean) => boolean;
	isSeriesSavePending: boolean;
	onToggleSeriesSave: (
		seriesId: string,
		initialValue?: boolean,
	) => Promise<void>;
	series: IAuthorSeries;
}) => {
	const measureRef = useRef<HTMLDivElement | null>(null);
	const [isSlider, setIsSlider] = useState(false);
	const {
		canScrollNext,
		canScrollPrev,
		setContainerRef,
		setViewportRef,
		scrollNext,
		scrollPrev,
	} = useHorizontalCarousel();

	useEffect(() => {
		const measureNode = measureRef.current;

		if (!measureNode) {
			return undefined;
		}

		const updateLayout = () => {
			const computedStyle = window.getComputedStyle(measureNode);
			const gapValue = Number.parseFloat(computedStyle.gap || "0") || 0;
			const itemWidth =
				measureNode.firstElementChild?.getBoundingClientRect().width;

			if (!itemWidth || !measureNode.parentElement) {
				setIsSlider(false);
				return;
			}

			const availableWidth = measureNode.parentElement.clientWidth;
			const totalWidth = measureNode.children.length * itemWidth;
			const fullWidth =
				totalWidth + Math.max(0, measureNode.children.length - 1) * gapValue;

			setIsSlider(fullWidth > availableWidth + 4);
		};

		updateLayout();

		const resizeObserver = new ResizeObserver(updateLayout);
		resizeObserver.observe(measureNode);
		if (measureNode.parentElement) {
			resizeObserver.observe(measureNode.parentElement);
		}

		return () => resizeObserver.disconnect();
	}, [series.books.length, series.id, series.title]);

	const cardProps = (book: (typeof series.books)[number]) => ({
		...book,
		author: authorName,
		relationType: book.seriesRelationType,
		seriesTotal: series.books.length,
	});

	return (
		<SeriesCard>
			<SeriesHeader>
				<SeriesCopy>
					<SeriesTitleRow>
						<SeriesTitleLink href={`/series/${series.id}`}>
							<SeriesTitle>{series.title}</SeriesTitle>
						</SeriesTitleLink>
						<SeriesMeta
							aria-label={`Total books in series: ${series.books.length}`}
						>
							<TotalNumber>{series.books.length}</TotalNumber>
							<TotalText>total</TotalText>
						</SeriesMeta>
					</SeriesTitleRow>
				</SeriesCopy>
				<SeriesHeaderActions>
					{isSlider ? (
						<SeriesBooksCarouselControls $isVisible>
							<SeriesBooksCarouselControl
								aria-label="Previous series books"
								disabled={!canScrollPrev}
								type="button"
								onClick={scrollPrev}
							>
								{"\u2039"}
							</SeriesBooksCarouselControl>
							<SeriesBooksCarouselControl
								aria-label="Next series books"
								disabled={!canScrollNext}
								type="button"
								onClick={scrollNext}
							>
								{"\u203A"}
							</SeriesBooksCarouselControl>
						</SeriesBooksCarouselControls>
					) : null}
					{getIsSeriesSaved(series.id, series.isSaved) ? (
						<SavedActionButton
							aria-label="Remove series from saved"
							disabled={isSeriesSavePending}
							title="Remove from saved"
							type="button"
							onClick={() => void onToggleSeriesSave(series.id, series.isSaved)}
						>
							<BookmarkIcon aria-hidden="true" />
						</SavedActionButton>
					) : (
						<SaveActionButton
							disabled={isSeriesSavePending}
							type="button"
							onClick={() => void onToggleSeriesSave(series.id, series.isSaved)}
						>
							{isSeriesSavePending ? "Saving..." : "Subscribe"}
						</SaveActionButton>
					)}
				</SeriesHeaderActions>
			</SeriesHeader>
			{isSlider ? (
				<SeriesBooksFrame>
					<SeriesBooksMeasure ref={measureRef} aria-hidden="true">
						{series.books.map((book) => (
							<BookCard key={book.id} book={cardProps(book)} />
						))}
					</SeriesBooksMeasure>
					<SeriesBooksCarousel>
						<SeriesBooksCarouselViewport $hasOverflow ref={setViewportRef}>
							<SeriesBooksCarouselContainer ref={setContainerRef}>
								{series.books.map((book) => (
									<CarouselSlide key={book.id}>
										<BookCard book={cardProps(book)} />
									</CarouselSlide>
								))}
							</SeriesBooksCarouselContainer>
						</SeriesBooksCarouselViewport>
					</SeriesBooksCarousel>
				</SeriesBooksFrame>
			) : (
				<SeriesBooksFrame>
					<SeriesBooksMeasure ref={measureRef} aria-hidden="true">
						{series.books.map((book) => (
							<BookCard key={book.id} book={cardProps(book)} />
						))}
					</SeriesBooksMeasure>
					<SeriesBooksWrap>
						{series.books.map((book) => (
							<BookCard key={book.id} book={cardProps(book)} />
						))}
					</SeriesBooksWrap>
				</SeriesBooksFrame>
			)}
		</SeriesCard>
	);
};

export default AuthorPage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding: clamp(3rem, 5vw, 4.5rem) clamp(1.5rem, 2.78vw, 2.5rem);
`;

const Content = styled.section`
	width: 60vw;
	margin: 0 auto;

	@media (max-width: 48rem) {
		width: 95vw;
		padding: 2rem 2rem 0 0rem;
	}
`;

const Hero = styled.section`
	display: grid;
	align-items: center;
	gap: clamp(1rem, 2.2vw, 1.75rem);
	grid-template-columns: 7rem minmax(0, 1fr);
	border-radius: 1.25rem;
	background: ${theme.colors.white};
	padding: clamp(1.15rem, 2.45vw, 2rem);

	@media (max-width: 38rem) {
		grid-template-columns: 1fr;
	}
`;

const HeroCopy = styled.div`
	min-width: 0;
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	flex-wrap: wrap;

	@media (max-width: 38rem) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

const TitleActions = styled.div`
	display: flex;
	flex: 0 0 auto;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 0.65rem;
`;

const Title = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(1.85rem, 3.1vw, 3rem);
	font-weight: 600;
	line-height: 1;
`;

const SaveActionButton = styled.button`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border: 0.0625rem solid ${theme.colors.orangeLight};
	border-radius: 999rem;
	background: ${theme.colors.orangeLight};
	padding: 0.68rem 1.15rem;
	box-shadow: 0 0.55rem 1.15rem rgb(218 142 91 / 0.18);
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1.2;
	transition:
		background 180ms ease,
		color 180ms ease;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.bluePrimary};
		border-color: ${theme.colors.bluePrimary};
		color: ${theme.colors.invertedText};
		outline: none;
		box-shadow: 0 0.65rem 1.35rem rgb(35 61 77 / 0.18);
	}

	&:disabled {
		cursor: progress;
		opacity: 0.72;
	}
`;

const SavedActionButton = styled.button`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.6);
	border-radius: 999rem;
	background: rgb(218 142 91 / 0.14);
	padding: 0.62rem 1rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1.2;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	svg {
		width: 1.05rem;
		height: 1.05rem;
	}

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.2);
		color: ${theme.colors.orangeDark};
		outline: none;
		transform: translateY(-0.0625rem);
	}

	&:disabled {
		cursor: progress;
		opacity: 0.72;
		transform: none;
	}
`;

const OwnerActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem;
`;

const OwnerActionButton = styled.button`
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 999px;
	background: ${theme.colors.surface};
	padding: 0.55rem 0.95rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.88rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}

	&:disabled {
		cursor: progress;
		opacity: 0.62;
	}
`;

const DangerActionButton = styled(OwnerActionButton)`
	border-color: rgb(180 58 58 / 0.34);
	background: rgb(180 58 58 / 0.08);
	color: #9c2f2f;

	&:hover,
	&:focus-visible {
		background: rgb(180 58 58 / 0.14);
		color: #9c2f2f;
	}
`;

const ActionMessage = styled.p`
	margin: 0.7rem 0 0;
	color: ${theme.colors.orangeDark};
	font-size: 0.92rem;
	font-weight: 700;
	line-height: 1.35;
`;

const Facts = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.55rem;
	margin-top: 0.95rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.95rem;
	line-height: 1.4;
`;

const GenreChips = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.4rem;
`;

const AuthorGenrePill = styled(GenrePill)`
	min-height: 2rem;
	padding: 0.42rem 0.78rem;
	font-size: 0.84rem;
	font-weight: 700;
`;

const BioWrap = styled.div`
	position: relative;
	max-width: 42rem;
`;

const Bio = styled.p<{ $isExpanded: boolean }>`
	max-width: 42rem;
	margin: 1rem 0 0;
	overflow: hidden;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.6;
	overflow-wrap: anywhere;
	${({ $isExpanded }) =>
		$isExpanded
			? ""
			: `
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 4;
			`}
`;

const BioToggle = styled.button<{ $isExpanded: boolean }>`
	position: ${({ $isExpanded }) => ($isExpanded ? "static" : "absolute")};
	right: 0;
	bottom: 0.08rem;
	display: block;
	border: 0;
	background: linear-gradient(
		90deg,
		rgb(255 255 255 / 0),
		${theme.colors.white} 3rem,
		${theme.colors.white}
	);
	margin-top: ${({ $isExpanded }) => ($isExpanded ? "0.45rem" : "0")};
	margin-left: ${({ $isExpanded }) => ($isExpanded ? "auto" : "0")};
	padding: 0 0 0 3.6rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.95rem;
	line-height: 1.6;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangePrimary};
		outline: none;
	}
`;

const BooksToolbar = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 0.55rem;
	margin-top: 1.25rem;
`;

const SortLabel = styled.label`
	color: ${theme.colors.softForeground};
	font-size: 0.9rem;
	font-weight: 700;
`;

const SortSelect = styled.select`
	min-height: 2.35rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 999px;
	background: ${theme.colors.surface};
	padding: 0.45rem 0.85rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;

	&:focus {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const Section = styled.section`
	margin-top: 2rem;
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;

	@media (max-width: 42rem) {
		align-items: flex-start;
		flex-direction: column;
		gap: 0.25rem;
	}
`;

const SectionTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.75rem;
	font-weight: 600;
	line-height: 1.2;
`;

const SectionStats = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.65rem;
	flex-wrap: wrap;
	justify-content: flex-end;
`;

const TotalBadge = styled(BaseResultsBadge)`
	min-height: 2.25rem;
`;

const SeriesList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const SeriesCard = styled.section`
	border: 0.0625rem solid rgb(218 142 91 / 0.16);
	border-radius: 1rem;
	background: rgb(242 239 237 / 0.58);
	padding: 1rem;
	width: fit-content;
	max-width: 100%;
`;

const SeriesHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;
	flex-wrap: nowrap;
`;

const SeriesCopy = styled.div`
	min-width: 0;
`;

const SeriesTitleRow = styled.div`
	display: flex;
	min-width: 0;
	align-items: center;
	gap: 0.6rem;
	flex-wrap: nowrap;
`;

const SeriesHeaderActions = styled.div`
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	gap: 0.55rem;
`;

const SeriesTitleLink = styled(Link)`
	color: inherit;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		outline: none;
		text-decoration: underline;
		text-underline-offset: 0.15rem;
	}
`;

const SeriesTitle = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.35rem;
	font-weight: 500;
	line-height: 1.2;
`;

const SeriesMeta = styled(TotalBadge)`
	width: fit-content;
	margin: 0;
	min-height: 2rem;
	padding: 0.36rem 0.7rem;
`;

const SeriesBooksWrap = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 1rem;
	width: fit-content;
	max-width: 100%;
	padding: 0.15rem 0 0.55rem;
`;

const SeriesBooksMeasure = styled.div`
	position: absolute;
	left: 0;
	top: 0;
	z-index: -1;
	display: flex;
	flex-wrap: nowrap;
	gap: 1rem;
	width: max-content;
	visibility: hidden;
	pointer-events: none;
`;

const SeriesBooksFrame = styled.div`
	position: relative;
	width: 100%;
	padding: 0 0 0.35rem;
`;

const SeriesBooksCarousel = styled.div`
	position: relative;
	width: 100%;
`;

const SeriesBooksCarouselViewport = styled(CarouselViewport)`
	width: 100%;
	margin-left: 0;
`;

const SeriesBooksCarouselContainer = styled(CarouselContainer)`
	padding-left: 0;
`;

const SeriesBooksCarouselControls = styled(CarouselControls)`
	justify-content: flex-end;
	margin: 0;
`;

const SeriesBooksCarouselControl = styled(CarouselControlButton)``;

const BookGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: center;
	gap: 1rem;
`;

const StateMessage = styled.p`
	margin: 2.5rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;
