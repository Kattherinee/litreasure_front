"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

import { useGenresByCategoryQuery } from "@/shared/api/genres";
import { theme } from "@/shared/theme";
import { InputField } from "@/shared/ui/InputField";

import { StepBody, StepDescription } from "./stepStyles";
import { MIN_SELECTED_GENRES } from "./types";

interface IGenresStepProps {
	selectedGenres: string[];
	onToggle: (slug: string) => void;
}

export const GenresStep = ({ selectedGenres, onToggle }: IGenresStepProps) => {
	const { data } = useGenresByCategoryQuery({
		includeCounts: true,
	});
	const genreGroups = useMemo(() => data?.groups ?? [], [data?.groups]);
	const recommendations = useMemo(
		() => data?.recommendations ?? [],
		[data?.recommendations],
	);
	const [genreSearch, setGenreSearch] = useState("");
	const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
	const [areRecommendationsOpen, setAreRecommendationsOpen] = useState(true);
	const selectedGenresRowRef = useRef<HTMLDivElement | null>(null);
	const [selectedRowFade, setSelectedRowFade] = useState({
		left: false,
		right: false,
	});
	const normalizedSearch = genreSearch.trim().toLowerCase();

	const filteredGroups = useMemo(() => {
		const groupsWithBooks = genreGroups
			.map((group) => ({
				...group,
				genres: [...group.genres]
					.filter((genre) => !genre.bookCount || genre.bookCount > 0)
					.sort((first, second) => first.name.localeCompare(second.name)),
			}))
			.filter((group) => group.genres.length > 0)
			.sort((first, second) => first.name.localeCompare(second.name));

		if (!normalizedSearch) return groupsWithBooks;

		return groupsWithBooks
			.map((group) => ({
				...group,
				genres:
					group.name.toLowerCase().includes(normalizedSearch) ||
					group.category.toLowerCase().includes(normalizedSearch)
						? group.genres
						: group.genres.filter((genre) =>
								genre.name.toLowerCase().includes(normalizedSearch),
							),
			}))
			.filter(
				(group) =>
					group.name.toLowerCase().includes(normalizedSearch) ||
					group.category.toLowerCase().includes(normalizedSearch) ||
					group.genres.length > 0,
			);
	}, [genreGroups, normalizedSearch]);

	const visibleGroupKeys = selectedGroupKeys;
	const activeGroups = visibleGroupKeys
		.map((key) => filteredGroups.find((group) => group.key === key))
		.filter((group): group is NonNullable<typeof group> => Boolean(group));
	const visibleGenres = Array.from(
		new Map(
			activeGroups
				.flatMap((group) => group.genres)
				.map((genre) => [genre.slug, genre]),
		).values(),
	).sort((first, second) => first.name.localeCompare(second.name));
	const allGenresFlat = useMemo(
		() =>
			Array.from(
				new Map(
					[
						...genreGroups.flatMap((group) => group.genres),
						...recommendations,
					].map((genre) => [genre.slug, genre]),
				).values(),
			),
		[genreGroups, recommendations],
	);

	const toggleGroup = (key: string) => {
		setSelectedGroupKeys((current) =>
			current.includes(key)
				? current.filter((currentKey) => currentKey !== key)
				: [...current, key],
		);
	};

	const updateSelectedRowFade = useCallback(() => {
		const row = selectedGenresRowRef.current;
		if (!row) {
			setSelectedRowFade({ left: false, right: false });
			return;
		}

		const maxScrollLeft = row.scrollWidth - row.clientWidth;
		setSelectedRowFade({
			left: row.scrollLeft > 2,
			right: maxScrollLeft - row.scrollLeft > 2,
		});
	}, []);

	useEffect(() => {
		const frameId = window.requestAnimationFrame(updateSelectedRowFade);
		window.addEventListener("resize", updateSelectedRowFade);

		return () => {
			window.cancelAnimationFrame(frameId);
			window.removeEventListener("resize", updateSelectedRowFade);
		};
	}, [selectedGenres, updateSelectedRowFade]);

	return (
		<StepBody>
			<MobileGenresHint>
				Choose at least 5 genres. Start with one or more groups, then tap the
				genres you like below.
			</MobileGenresHint>
			<SelectedSummaryRow>
				{selectedGenres.length > 0 ? (
					<SelectedGenresCarousel
						$showLeftFade={selectedRowFade.left}
						$showRightFade={selectedRowFade.right}
					>
						<SelectedGenresRow
							ref={selectedGenresRowRef}
							aria-label="Selected genres"
							onScroll={updateSelectedRowFade}
						>
							{selectedGenres.map((slug) => {
								const genre = allGenresFlat.find((item) => item.slug === slug);
								return genre ? (
									<SelectedChip
										key={slug}
										type="button"
										onClick={() => onToggle(slug)}
									>
										{genre.name}
										<ChipX>x</ChipX>
									</SelectedChip>
								) : null;
							})}
						</SelectedGenresRow>
					</SelectedGenresCarousel>
				) : (
					<SelectedPlaceholder>
						Selected genres will appear here
					</SelectedPlaceholder>
				)}
				<GenreCount>
					{selectedGenres.length} / {MIN_SELECTED_GENRES} min.
				</GenreCount>
			</SelectedSummaryRow>

			<GenrePicker>
				<PanelLabel>Genre groups</PanelLabel>
				<GroupsRail aria-label="Genre groups">
					{filteredGroups.map((group) => {
						const isActive = visibleGroupKeys.includes(group.key);
						const hasSelected = selectedGenres.some((slug) =>
							group.genres.some((genre) => genre.slug === slug),
						);

						return (
							<GroupButton
								key={group.key}
								type="button"
								$isActive={isActive}
								onClick={() => toggleGroup(group.key)}
							>
								<GroupName>
									{hasSelected ? <ColDot /> : null}
									{group.name}
								</GroupName>
							</GroupButton>
						);
					})}
				</GroupsRail>

				<GenrePanel>
					<GenrePanelHeader>
						<PanelLabel>Genres in selected groups</PanelLabel>
						<InlineSearchInput
							placeholder="Search genres..."
							value={genreSearch}
							onChange={(event) => setGenreSearch(event.target.value)}
						/>
					</GenrePanelHeader>
					{visibleGenres.length > 0 ? (
						<ScrollableGenrePillsWrap>
							{visibleGenres.map((genre) => {
								const isSelected = selectedGenres.includes(genre.slug);

								return (
									<GenreButton
										key={genre.id}
										type="button"
										$isSelected={isSelected}
										onClick={() => onToggle(genre.slug)}
									>
										{genre.name}
									</GenreButton>
								);
							})}
						</ScrollableGenrePillsWrap>
					) : (
						<GenreEmpty>Choose one or more groups above.</GenreEmpty>
					)}
				</GenrePanel>

				{recommendations.length > 0 ? (
					<RecommendationPanel>
						<RecommendationHeader>
							<PanelLabel>
								If you like these genres, you may like these too
							</PanelLabel>
							<ToggleRecommendationsButton
								type="button"
								onClick={() => setAreRecommendationsOpen((current) => !current)}
							>
								{areRecommendationsOpen ? "Hide" : "Show"}
							</ToggleRecommendationsButton>
						</RecommendationHeader>
						{areRecommendationsOpen ? (
							<RecommendationPillsWrap>
								{recommendations.map((genre) => {
									const isSelected = selectedGenres.includes(genre.slug);

									return (
										<GenreButton
											key={genre.id}
											type="button"
											$isSelected={isSelected}
											onClick={() => onToggle(genre.slug)}
										>
											{genre.name}
										</GenreButton>
									);
								})}
							</RecommendationPillsWrap>
						) : null}
					</RecommendationPanel>
				) : null}
			</GenrePicker>
		</StepBody>
	);
};

const MobileGenresHint = styled(StepDescription)`
	display: none;

	@media (max-width: 42rem) {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.82rem;
		line-height: 1.45;
	}
`;

const SelectedSummaryRow = styled.div`
	display: flex;
	min-width: 0;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
`;

const GenreCount = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.875rem;
	white-space: nowrap;
`;

const SelectedGenresCarousel = styled.div<{
	$showLeftFade: boolean;
	$showRightFade: boolean;
}>`
	position: relative;
	min-width: 0;
	flex: 1 1 auto;

	&::before,
	&::after {
		position: absolute;
		z-index: 1;
		top: 0;
		bottom: 0;
		width: 1.2rem;
		pointer-events: none;
		content: "";
		opacity: 0;
		transition: opacity 120ms ease;
	}

	&::before {
		left: 0;
		background: linear-gradient(90deg, ${theme.colors.background}, transparent);
		opacity: ${({ $showLeftFade }) => ($showLeftFade ? 1 : 0)};
	}

	&::after {
		right: 0;
		background: linear-gradient(
			270deg,
			${theme.colors.background},
			transparent
		);
		opacity: ${({ $showRightFade }) => ($showRightFade ? 1 : 0)};
	}
`;

const SelectedGenresRow = styled.div`
	display: flex;
	min-width: 0;
	flex-wrap: nowrap;
	gap: 0.4rem;
	overflow-x: auto;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
`;

const SelectedChip = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.6);
	border-radius: 999px;
	background: rgb(218 142 91 / 0.1);
	padding: 0.2rem 0.55rem 0.2rem 0.7rem;
	color: #da8e5b;
	cursor: pointer;
	flex: 0 0 auto;
	font: inherit;
	font-size: 0.8125rem;
	font-weight: 600;
	transition: background 150ms;

	&:hover {
		background: rgb(218 142 91 / 0.2);
	}
`;

const ChipX = styled.span`
	color: #da8e5b;
	font-size: 1rem;
	font-weight: 300;
	line-height: 1;
`;

const SelectedPlaceholder = styled.span`
	min-width: 0;
	flex: 1 1 auto;
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
	opacity: 0.72;
`;

const InlineSearchInput = styled(InputField)`
	&& {
		width: min(100%, 18rem);
		min-height: 2rem;

		background: rgb(35 61 77 / 0.07);
		border-color: rgb(35 61 77 / 0.18);
		font-size: 0.88rem;

		&:hover,
		&:focus {
			border-color: #da8e5b;
			background: rgb(35 61 77 / 0.07);
		}
	}

	@media (max-width: 42rem) {
		min-height: 1rem;
	}
`;

const GenrePicker = styled.div`
	display: flex;
	min-height: 0;
	flex-direction: column;
	gap: 0.65rem;
	border: 0.0625rem solid rgb(186 183 180 / 0.5);
	border-radius: 0.5rem;
	padding: 0.65rem 0.65rem 0.9rem;

	@media (max-width: 42rem) {
		width: 92vw;
		max-width: 92vw;
		align-self: center;
	}
`;

const GroupsRail = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	align-items: center;
`;

const GroupButton = styled.button<{ $isActive: boolean }>`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	gap: 0.25rem;
	border: 0.0625rem solid
		${({ $isActive }) => ($isActive ? "#da8e5b" : "rgb(186 183 180 / 0.45)")};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.12)" : "rgb(242 239 237 / 0.42)"};
	padding: 0.38rem 0.8rem;
	color: ${({ $isActive }) =>
		$isActive ? "#da8e5b" : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.84rem;
	text-align: left;
	transition:
		background 150ms,
		border-color 150ms,
		color 150ms;

	&:hover {
		background: ${({ $isActive }) =>
			$isActive ? "rgb(218 142 91 / 0.18)" : "rgb(35 61 77 / 0.04)"};
	}
`;

const GroupName = styled.span`
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-weight: 500;
	line-height: 1.2;
`;

const ColDot = styled.span`
	flex-shrink: 0;
	width: 0.4rem;
	height: 0.4rem;
	border-radius: 50%;
	background: #da8e5b;
`;

const GenrePanel = styled.div`
	display: grid;
	min-height: 0;
	gap: 0.45rem;
`;

const GenrePanelHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;

	@media (max-width: 42rem) {
		align-items: flex-start;
		flex-direction: column;
		gap: 0.5rem;
	}
`;

const PanelLabel = styled.h3`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	font-weight: 700;
	line-height: 1.2;
`;

const GenrePillsWrap = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	padding: 0.25rem 0;
`;

const RecommendationPanel = styled(GenrePanel)`
	border-top: 0.0625rem solid rgb(186 183 180 / 0.36);
	padding-top: 0.35rem;
`;

const RecommendationHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
`;

const ToggleRecommendationsButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.32);
	border-radius: 999px;
	background: rgb(218 142 91 / 0.08);
	color: #da8e5b;
	cursor: pointer;
	font: inherit;
	font-size: 0.78rem;
	font-weight: 600;
	padding: 0.28rem 0.65rem;
	white-space: nowrap;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.15);
		outline: none;
	}
`;

const RecommendationPillsWrap = styled(GenrePillsWrap)`
	flex-wrap: nowrap;
	overflow-x: auto;
	padding: 0.15rem 0 0.7rem;
	scrollbar-width: thin;
	scrollbar-color: rgb(218 142 91 / 0.42) transparent;

	&::-webkit-scrollbar {
		height: 0.22rem;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: rgb(218 142 91 / 0.38);
		border-radius: 999px;
	}
`;

const ScrollableGenrePillsWrap = styled(GenrePillsWrap)`
	max-height: clamp(9rem, calc(100dvh - 31rem), 18rem);
	overflow-y: auto;
	padding: 0.25rem 0.25rem 0.7rem 0;

	&::-webkit-scrollbar {
		width: 0.25rem;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: rgb(218 142 91 / 0.45);
		border-radius: 999px;
	}
`;

const GenreEmpty = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.82rem;
	line-height: 1.4;
`;

const GenreButton = styled.button<{ $isSelected: boolean }>`
	flex: 0 0 auto;
	border: 0.0625rem solid
		${({ $isSelected }) => ($isSelected ? "#da8e5b" : theme.colors.border)};
	border-radius: 999px;
	background: ${({ $isSelected }) =>
		$isSelected ? "#da8e5b" : theme.colors.transparent};
	padding: 0.3rem 0.75rem;
	color: ${({ $isSelected }) =>
		$isSelected ? "#f2efed" : theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 0.875rem;
	font-weight: 600;
	transition:
		background 150ms,
		border-color 150ms,
		color 150ms;
`;
