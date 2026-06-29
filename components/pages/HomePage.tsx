"use client";

import styled from "styled-components";

import { useRecomendationsHomeSectionsQuery } from "@/shared/api/recomendations/recomendations.hooks";
import type { IHomeSection } from "@/shared/api/recomendations/recomendations.types";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { BookOfTheWeekSlider } from "@/shared/ui/BookOfTheWeekSlider";
import { BookSliderSection } from "@/shared/ui/BookSliderSection";
import { GenreCarousel } from "@/shared/ui/GenreCarousel";
import HomeEntitySliderSection from "@/shared/ui/HomeEntitySliderSection/HomeEntitySliderSection";

const normalize = (value?: string) => value?.toLowerCase().trim() ?? "";

const ABOVE_FOLD_LAZY_ROOT_MARGIN = "-180px 0px 0px 0px";
const BELOW_FOLD_LAZY_ROOT_MARGIN = "-420px 0px 0px 0px";
const BOOK_SECTION_LIMIT = 20;

const isForYouSection = (section: IHomeSection) => {
	const key = normalize(section.key);

	return (
		key.includes("for_you") ||
		key.includes("for-you") ||
		key.includes("foryou") ||
		key.includes("personal")
	);
};

const isPopularSection = (section: IHomeSection) => {
	return section.query.sort === "popular";
};

const isPopularBooksByKey = (section: IHomeSection) =>
	normalize(section.key) === "popular-books";

const hasGenreFilter = (section: IHomeSection) =>
	Boolean(section.query.genre) ||
	Boolean(section.query.genres?.length) ||
	Boolean(section.query.genreIds?.length);
const isNewestSection = (section: IHomeSection) =>
	section.query.sort === "newest" && !hasGenreFilter(section);

const HomePage = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const { data: homeSections } = useRecomendationsHomeSectionsQuery();
	const bookSections = (homeSections ?? []).filter(
		(section: IHomeSection) =>
			section.entity === "books" && section.endpoint === "/books/cards",
	);
	const authorSections = (homeSections ?? []).filter(
		(section: IHomeSection) =>
			section.entity === "authors" && section.endpoint === "/authors",
	);
	const collectionSections = (homeSections ?? []).filter(
		(section: IHomeSection) =>
			section.entity === "collections" && section.endpoint === "/collections",
	);
	const seriesSections = (homeSections ?? []).filter(
		(section: IHomeSection) =>
			section.entity === "series" && section.endpoint === "/series",
	);

	const explicitForYouSections = bookSections.filter(isForYouSection);
	const forYouSection = explicitForYouSections[0] ?? null;
	const newestBookSection =
		bookSections.find(
			(section: IHomeSection) =>
				!isForYouSection(section) && isNewestSection(section),
		) ?? null;
	const introBookSection = isAuthenticated ? forYouSection : newestBookSection;
	const afterIntroBookSections = bookSections.filter(
		(section: IHomeSection) => section.key !== introBookSection?.key,
	);
	const afterForYouBookSections = afterIntroBookSections.filter(
		(section: IHomeSection) => section.key !== forYouSection?.key,
	);
	const popularBookSection =
		afterForYouBookSections.find(isPopularBooksByKey) ??
		afterForYouBookSections.find(isPopularSection) ??
		null;
	const afterPopularBookSections = afterForYouBookSections.filter(
		(section: IHomeSection) => section.key !== popularBookSection?.key,
	);
	const genreBookSections = afterPopularBookSections.filter(hasGenreFilter);
	const firstGenreBookSection = genreBookSections[0] ?? null;
	const secondGenreBookSection = genreBookSections[1] ?? null;
	const thirdGenreBookSection = genreBookSections[2] ?? null;
	const fourthGenreBookSection = genreBookSections[3] ?? null;
	const remainingGenreBookSections = genreBookSections.slice(4);
	const remainingBookSections = afterPopularBookSections.filter(
		(section: IHomeSection) =>
			!genreBookSections.some(
				(genreSection) => genreSection.key === section.key,
			),
	);

	const hasDynamicSections =
		bookSections.length > 0 ||
		authorSections.length > 0 ||
		collectionSections.length > 0 ||
		seriesSections.length > 0;

	return (
		<Page>
			<CatalogHero>
				<CatalogHeroInner>
					<HeroCopy>
						<PageKicker>Litreasure</PageKicker>
						<PageTitle>Book Feed</PageTitle>
					</HeroCopy>
					<HeroText>
						A reader lives a thousand lives before they die. The person who
						never reads lives only one. - George R.R. Martin.
					</HeroText>
				</CatalogHeroInner>
			</CatalogHero>

			{hasDynamicSections ? (
				<>
					<GenreCarousel />
					{isAuthenticated ? (
						forYouSection ? (
						<BookSliderSection
							key={forYouSection.key}
							source="for-you"
							title="You Might Like"
							limit={BOOK_SECTION_LIMIT}
							{...forYouSection.query}
						/>
					) : (
						<BookSliderSection
							source="for-you"
							title="You Might Like"
							limit={BOOK_SECTION_LIMIT}
						/>
					)
					) : newestBookSection ? (
						<BookSliderSection
							key={newestBookSection.key}
							lazy
							title="New releases"
							{...newestBookSection.query}
						/>
					) : (
						<BookSliderSection
							title="New releases"
							sort="newest"
							limit={BOOK_SECTION_LIMIT}
						/>
					)}
					<BookOfTheWeekSlider
						lazy
						lazyRootMargin={ABOVE_FOLD_LAZY_ROOT_MARGIN}
					/>
					{popularBookSection ? (
						<BookSliderSection
							key={popularBookSection.key}
							lazy
							lazyRootMargin={ABOVE_FOLD_LAZY_ROOT_MARGIN}
							title="Popular"
							{...popularBookSection.query}
						/>
					) : null}
					{firstGenreBookSection ? (
						<BookSliderSection
							key={firstGenreBookSection.key}
							lazy
							lazyRootMargin={ABOVE_FOLD_LAZY_ROOT_MARGIN}
							title={firstGenreBookSection.title}
							{...firstGenreBookSection.query}
						/>
					) : null}
					{collectionSections.map((section: IHomeSection) => (
						<HomeEntitySliderSection
							key={section.key}
							entity="collections"
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							query={section.query}
							title={section.title}
						/>
					))}
					{secondGenreBookSection ? (
						<BookSliderSection
							key={secondGenreBookSection.key}
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							title={secondGenreBookSection.title}
							{...secondGenreBookSection.query}
						/>
					) : null}
					{seriesSections.map((section: IHomeSection) => (
						<HomeEntitySliderSection
							key={section.key}
							entity="series"
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							query={section.query}
							title={section.title}
						/>
					))}
					{thirdGenreBookSection ? (
						<BookSliderSection
							key={thirdGenreBookSection.key}
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							title={thirdGenreBookSection.title}
							{...thirdGenreBookSection.query}
						/>
					) : null}
					{fourthGenreBookSection ? (
						<BookSliderSection
							key={fourthGenreBookSection.key}
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							title={fourthGenreBookSection.title}
							{...fourthGenreBookSection.query}
						/>
					) : null}
					{authorSections.map((section: IHomeSection) => (
						<HomeEntitySliderSection
							key={section.key}
							entity="authors"
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							query={section.query}
							title={section.title}
						/>
					))}
					{remainingGenreBookSections.map((section: IHomeSection) => (
						<BookSliderSection
							key={section.key}
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							title={section.title}
							{...section.query}
						/>
					))}
					{remainingBookSections.map((section: IHomeSection) => (
						<BookSliderSection
							key={section.key}
							lazy
							lazyRootMargin={BELOW_FOLD_LAZY_ROOT_MARGIN}
							title={section.title}
							{...section.query}
						/>
					))}
				</>
			) : (
				<>
					<GenreCarousel />
					{isAuthenticated ? (
						<BookSliderSection
							source="for-you"
							title="You Might Like"
							sort="newest"
							limit={BOOK_SECTION_LIMIT}
						/>
					) : (
						<BookSliderSection
							title="New releases"
							sort="newest"
							limit={BOOK_SECTION_LIMIT}
						/>
					)}
					<BookOfTheWeekSlider />
					{isAuthenticated ? (
						<BookSliderSection
							lazy
							title="Popular"
							sort="popular"
							limit={BOOK_SECTION_LIMIT}
						/>
					) : null}
					<BookSliderSection
						lazy
						title="Young Adult Fiction"
						sort="newest"
						genre="young_adult_fiction"
						limit={BOOK_SECTION_LIMIT}
					/>
					<BookSliderSection
						lazy
						title="Fantasy"
						sort="newest"
						genre="fantasy"
						limit={BOOK_SECTION_LIMIT}
					/>
				</>
			)}
		</Page>
	);
};

export default HomePage;

const Page = styled.div`
	min-height: 100dvh;
	overflow-x: clip;
	background:
		radial-gradient(
			circle at top left,
			${theme.alpha.orangeGlow},
			${theme.colors.transparent} 28%
		),
		linear-gradient(
			180deg,
			${theme.colors.backgroundTop} 0%,
			${theme.colors.background} 100%
		);
	padding-bottom: clamp(3rem, 5vw, 4.5rem);
`;

const CatalogHero = styled.section`
	background:
		radial-gradient(
			circle at 76% 18%,
			${theme.alpha.orangeGlow},
			${theme.colors.transparent} 28%
		),
		linear-gradient(
			135deg,
			${theme.colors.bluePrimary} 0%,
			${theme.colors.foreground} 100%
		);

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding-top: 2rem;
	}
`;

const CatalogHeroInner = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(18rem, 26rem);
	align-items: center;
	gap: clamp(2rem, 5vw, 4rem);
	width: min(
		calc(100% - (${theme.layout.contentGutter} * 2)),
		${theme.layout.contentMaxWidth}
	);
	margin: 0 auto;
	padding: clamp(2.25rem, 4.5vw, 4rem) 0 clamp(2.5rem, 4.5vw, 3.5rem);

	@media (max-width: 64rem) {
		gap: 2rem;
	}

	@media (max-width: 48rem) {
		grid-template-columns: 1fr;
		gap: 1.05rem;
		padding-bottom: 3.5rem;
		padding: clamp(2.25rem, 4.5vw, 4rem) 0 clamp(2rem, 3.5vw, 2.5rem);
		padding-top: 4rem;
	}
`;

const HeroCopy = styled.div`
	min-width: 0;
`;

const PageKicker = styled.p`
	margin: 0 0 0.75rem;
	color: ${theme.colors.orangePrimary};
	font-family: ${theme.fonts.sans};
	font-size: 0.8125rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	line-height: 1.2;
	text-transform: uppercase;
	@media (max-width: 48rem) {
		margin: 0;
	}
`;

const PageTitle = styled.h1`
	margin: 0;
	color: ${theme.colors.invertedText};
	font-family: ${theme.fonts.serif};
	font-size: clamp(3rem, 4vw, 3.5rem);
	font-weight: 600;
	line-height: 0.96;
	@media (max-width: 48rem) {
		display: none;
	}
`;

const HeroText = styled.p`
	max-width: 28rem;
	margin: 0;
	color: ${theme.colors.invertedText};
	font-family: ${theme.fonts.sans};
	font-size: 1rem;
	font-weight: 400;
	line-height: 1.55;
	opacity: 0.82;
`;
