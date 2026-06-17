"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styled from "styled-components";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import { useGenresByCategoryQuery } from "@/shared/api/genres";
import { useAddUserGenreMutation } from "@/shared/api/users";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { GenrePillSkeleton } from "@/shared/ui/Skeleton";

const formatCompactCount = (value?: number) => {
	if (!value) return "";
	if (value >= 1000) return `${Math.round(value / 100) / 10}k`;

	return String(value);
};

const GenresPage = () => {
	const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
	const [search, setSearch] = useState("");
	const [authModalMode, setAuthModalMode] = useState<IAuthModalMode | null>(
		null,
	);
	const [optimisticSavedGenreIds, setOptimisticSavedGenreIds] = useState<
		string[]
	>([]);
	const session = useAuthStore((state) => state.session);
	const userId = session?.user.id;
	const addGenreMutation = useAddUserGenreMutation();
	const savedGenreIds = useMemo(
		() => new Set(optimisticSavedGenreIds),
		[optimisticSavedGenreIds],
	);
	const { data, isLoading } = useGenresByCategoryQuery({
		includeCounts: true,
	});
	const groups = useMemo(() => data?.groups ?? [], [data?.groups]);
	const recommendations = useMemo(
		() => data?.recommendations ?? [],
		[data?.recommendations],
	);
	const normalizedSearch = search.trim().toLowerCase();

	const filteredGroups = useMemo(() => {
		const groupsWithBooks = groups
			.map((group) => ({
				...group,
				genres: group.genres
					.filter((genre) => Boolean(genre.bookCount))
					.sort((firstGenre, secondGenre) =>
						firstGenre.name.localeCompare(secondGenre.name, "en"),
					),
			}))
			.filter((group) => group.genres.length > 0)
			.sort((firstGroup, secondGroup) =>
				firstGroup.name.localeCompare(secondGroup.name, "en"),
			);

		if (!normalizedSearch) return groupsWithBooks;

		return groupsWithBooks
			.map((group) => ({
				...group,
				genres: group.genres.filter((genre) =>
					genre.name.toLowerCase().includes(normalizedSearch),
				),
			}))
			.filter(
				(group) =>
					group.name.toLowerCase().includes(normalizedSearch) ||
					group.category.toLowerCase().includes(normalizedSearch) ||
					group.genres.length > 0,
			);
	}, [groups, normalizedSearch]);
	const filteredRecommendations = useMemo(
		() =>
			recommendations
				.filter((genre) => Boolean(genre.bookCount))
				.sort((firstGenre, secondGenre) =>
					firstGenre.name.localeCompare(secondGenre.name, "en"),
				),
		[recommendations],
	);
	const canReset = search.length > 0 || selectedGroupKeys.length > 0;

	const visibleGroupKeys =
		selectedGroupKeys.length > 0 ? selectedGroupKeys : [];
	const visibleGroups = visibleGroupKeys
		.map((key) => filteredGroups.find((group) => group.key === key))
		.filter((group): group is NonNullable<typeof group> => Boolean(group));
	const visibleGenres = Array.from(
		new Map(
			visibleGroups
				.flatMap((group) => group.genres)
				.map((genre) => [genre.slug, genre]),
		).values(),
	).sort((firstGenre, secondGenre) =>
		firstGenre.name.localeCompare(secondGenre.name, "en"),
	);
	const hasVisibleGroups = visibleGroups.length > 0;
	const areAllGroupsSelected =
		filteredGroups.length > 0 &&
		filteredGroups.every((group) => selectedGroupKeys.includes(group.key));

	const toggleGroup = (key: string) => {
		setSelectedGroupKeys((current) =>
			current.includes(key)
				? current.filter((currentKey) => currentKey !== key)
				: [...current, key],
		);
	};

	const addGenreToUser = (genreId: string) => {
		if (!userId) {
			setAuthModalMode("login");
			return;
		}

		if (savedGenreIds.has(genreId)) return;

		addGenreMutation.mutate(
			{
				payload: { genreId },
				userId,
			},
			{
				onSuccess: () => {
					setOptimisticSavedGenreIds((current) =>
						current.includes(genreId) ? current : [...current, genreId],
					);
				},
			},
		);
	};

	const selectAllGroups = () => {
		setSelectedGroupKeys(filteredGroups.map((group) => group.key));
	};

	const renderGenreChip = (genre: (typeof visibleGenres)[number]) => {
		const isSaved = Boolean(genre.isSaved) || savedGenreIds.has(genre.id);
		const isSaving =
			addGenreMutation.isPending &&
			addGenreMutation.variables?.payload.genreId === genre.id;

		return (
			<GenreChip key={genre.id}>
				<GenreLink href={`/genres/${genre.slug}`}>
					<GenreName>{genre.name}</GenreName>
					{genre.bookCount ? (
						<GenreCountText>
							{formatCompactCount(genre.bookCount)}
						</GenreCountText>
					) : null}
				</GenreLink>
				<AddGenreButton
					type="button"
					aria-label={
						isSaved
							? `Genre ${genre.name} is already saved`
							: `Add genre ${genre.name} to my genres`
					}
					disabled={isSaved || isSaving}
					$isSaved={isSaved}
					onClick={() => addGenreToUser(genre.id)}
				>
					{isSaved ? "✓" : "+"}
				</AddGenreButton>
			</GenreChip>
		);
	};

	return (
		<Page>
			<Hero>
				<HeroTop>
					<PageTitle>Genres</PageTitle>
					<HeroControls>
						<SearchInput
							placeholder="Find a genre or group"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
						{canReset ? (
							<ClearButton
								type="button"
								onClick={() => {
									setSearch("");
									setSelectedGroupKeys([]);
								}}
							>
								Reset
							</ClearButton>
						) : null}
						{filteredGroups.length > 0 && !areAllGroupsSelected ? (
							<SelectAllButton type="button" onClick={selectAllGroups}>
								Select all
							</SelectAllButton>
						) : null}
					</HeroControls>
				</HeroTop>
			</Hero>

			<Content>
				{isLoading ? (
					<SkeletonGrid aria-label="Loading genres">
						{Array.from({ length: 32 }, (_, index) => (
							<GenrePillSkeleton key={index} />
						))}
					</SkeletonGrid>
				) : (
					<>
						<StickyFilters>
							<GroupSection>
								<GroupRow aria-label="Genre groups">
									{filteredGroups.map((group) => {
										const isActive = visibleGroupKeys.includes(group.key);

										return (
											<GroupChip
												key={group.key}
												type="button"
												$isActive={isActive}
												onClick={() => toggleGroup(group.key)}
											>
												<span>{group.name}</span>
											</GroupChip>
										);
									})}
								</GroupRow>
							</GroupSection>
						</StickyFilters>

						{hasVisibleGroups ? (
							<GenreListSection>
								<SectionHeader>
									<SectionTitle>
										{visibleGroups.length > 1
											? "Genres in selected groups"
											: visibleGroups[0]?.name || "Genres"}
									</SectionTitle>
								</SectionHeader>
								<GenreGrid>{visibleGenres.map(renderGenreChip)}</GenreGrid>
							</GenreListSection>
						) : (
							<GenreListSection>
								<SectionHeader>
									<SectionTitle>Genres in selected groups</SectionTitle>
								</SectionHeader>
								<GenreEmptyHint>
									Choose one or more groups above: genres will appear here.
								</GenreEmptyHint>
							</GenreListSection>
						)}

						{filteredRecommendations.length > 0 ? (
							<RecommendationSection>
								<SectionHeader>
									<SectionTitle>You may like</SectionTitle>
									<SectionMeta>{filteredRecommendations.length}</SectionMeta>
								</SectionHeader>
								<GenreGrid>
									{filteredRecommendations.map(renderGenreChip)}
								</GenreGrid>
							</RecommendationSection>
						) : null}
					</>
				)}
			</Content>
			{authModalMode ? (
				<AuthModal
					mode={authModalMode}
					redirectOnSuccess={false}
					onClose={() => setAuthModalMode(null)}
					onModeChange={setAuthModalMode}
				/>
			) : null}
		</Page>
	);
};

export default GenresPage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding-bottom: 2rem;
`;

const Hero = styled.section`
	width: min(
		calc(100% - (${theme.layout.contentGutter} * 2)),
		${theme.layout.contentMaxWidth}
	);
	margin: 0 auto;
	padding: clamp(1.8rem, 3.6vw, 3rem) 0 0.85rem;
	@media (max-width: 52rem) {
		padding-top: 2rem;
	}
`;

const HeroTop = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;

	@media (max-width: 52rem) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const PageTitle = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(1.75rem, 2.35vw, 2.25rem);
	font-weight: 600;
	line-height: 1;
`;

const HeroControls = styled.div`
	display: flex;
	min-width: 0;
	flex: 1 1 auto;
	align-items: center;
	justify-content: flex-end;
	gap: 1rem;

	@media (max-width: 52rem) {
		width: 100%;
		flex-direction: column;
		align-items: stretch;
		gap: 0.6rem;
	}
`;

const SearchInput = styled.input`
	width: min(100%, 18rem);

	min-height: 2.45rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 0.9rem;
	background: rgb(242 239 237 / 0.72);
	padding: 0.45rem 0.85rem;
	color: ${theme.colors.foreground};
	font: inherit;
	font-size: 0.9rem;

	&:focus {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
	@media (max-width: 52rem) {
		min-height: 1.45rem;
		width: 100%;
	}
`;

const ClearButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.32);
	border-radius: 999px;
	background: rgb(218 142 91 / 0.1);
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	flex: 0 0 auto;
	font: inherit;
	font-size: 0.86rem;
	font-weight: 600;
	padding: 0.48rem 0.8rem;
	white-space: nowrap;

	&:hover,
	&:focus-visible {
		border-color: rgb(218 142 91 / 0.58);
		background: rgb(218 142 91 / 0.16);
		outline: none;
	}
`;

const Content = styled.section`
	display: flex;
	width: min(95vw, ${theme.layout.contentMaxWidth});
	flex-direction: column;
	gap: 0.85rem;
	margin: 0 auto;
`;

const StickyFilters = styled.div`
	position: sticky;
	z-index: 5;
	top: 3.25rem;
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
	background: ${theme.colors.background};
	padding: 0.4rem 0 0.9rem;

	@media (max-width: 40rem) {
		top: 4.25rem;
	}
`;

const GroupSection = styled.section`
	border: 0.0625rem solid rgb(186 183 180 / 0.5);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.22);
	padding: 0.85rem 0.85rem 1rem;
`;

const GroupRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
`;

const GroupChip = styled.button<{ $isActive: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0.0625rem solid
		${({ $isActive }) =>
			$isActive ? theme.colors.orangeLight : "rgb(211 202 196 / 0.72)"};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.16)" : "rgb(242 239 237 / 0.62)"};
	padding: 0.48rem 0.88rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-family: ${theme.fonts.sans};
	font-size: 0.86rem;
	font-weight: 400;
	line-height: 1.2;
	transition:
		background 150ms ease,
		border-color 150ms ease,
		color 150ms ease;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(218 142 91 / 0.12);
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const GenreSection = styled.section`
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.58);
	padding: 1rem;
`;

const GenreListSection = styled.section`
	padding: 0.25rem 0 0;
`;

const GenreEmptyHint = styled.p`
	margin: 0;
	border: 0.0625rem solid rgb(186 183 180 / 0.5);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.18);
	padding: 1rem;
	color: ${theme.colors.softForeground};
	font-size: 0.92rem;
	line-height: 1.45;
`;

const RecommendationSection = styled(GenreSection)`
	flex: 0 0 auto;
	padding-top: 0.9rem;
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 0.8rem;

	@media (max-width: 42rem) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

const SectionTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.28rem;
	font-weight: 500;
	line-height: 1.1;
`;

const SectionMeta = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.82rem;
`;

const SelectAllButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.32);
	border-radius: 999px;
	background: ${theme.colors.white};
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.86rem;
	font-weight: 600;
	padding: 0.48rem 0.8rem;
	white-space: nowrap;

	&:hover,
	&:focus-visible {
		border-color: rgb(218 142 91 / 0.58);
		background: rgb(218 142 91 / 0.12);
		outline: none;
	}
`;

const GenreGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem;

	@media (max-width: 40rem) {
		gap: 0.5rem;
	}
`;

const GenreChip = styled.article`
	display: inline-flex;
	max-width: 16rem;
	align-items: center;
	gap: 0.38rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.5);
	padding: 0.4rem 0.44rem 0.4rem 0.9rem;
	transition:
		background 150ms ease,
		border-color 150ms ease;

	&:hover,
	&:focus-within {
		border-color: ${theme.colors.orangeLight};
		background: rgb(218 142 91 / 0.12);
	}
`;

const GenreLink = styled(Link)`
	display: inline-flex;
	min-width: 0;
	align-items: baseline;
	gap: 0.35rem;
	color: inherit;
	text-decoration: none;
`;

const GenreName = styled.span`
	overflow: hidden;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.sans};
	font-size: 0.86rem;
	font-weight: 400;
	line-height: 1.2;
	text-overflow: ellipsis;
	white-space: nowrap;

	${GenreChip}:hover &,
	${GenreChip}:focus-within & {
		color: ${theme.colors.orangeDark};
	}
`;

const GenreCountText = styled.span`
	flex: 0 0 auto;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	line-height: 1;
`;

const AddGenreButton = styled.button<{ $isSaved: boolean }>`
	display: inline-flex;
	width: 1.45rem;
	height: 1.45rem;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: ${({ $isSaved }) =>
		$isSaved ? theme.colors.orangeLight : "rgb(218 142 91 / 0.13)"};
	color: ${({ $isSaved }) =>
		$isSaved ? theme.colors.invertedText : theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 1.05rem;
	font-weight: 400;
	line-height: 1;
	transition:
		background 150ms ease,
		color 150ms ease;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.22);
		outline: none;
	}

	&:disabled {
		cursor: default;
		opacity: ${({ $isSaved }) => ($isSaved ? 1 : 0.65)};
	}
`;

const SkeletonGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem;
`;
