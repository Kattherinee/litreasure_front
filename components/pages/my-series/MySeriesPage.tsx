"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

import { CreateSeriesModal } from "@/components/pages/series/CreateSeriesModal";
import { MyCreatorsTabs } from "@/components/pages/my-treasures/tabs/MyCreatorsTabs";
import type { IMyCreatorsTab } from "@/components/pages/my-treasures/tabs/MyCreatorsTabs";
import { useMySeriesQuery } from "@/shared/api/series";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { AppPagination } from "@/shared/ui/AppPagination";
import { PageHero } from "@/shared/ui/PageHero";
import { SeriesSliderCard } from "@/shared/ui/HomeEntitySliderSection/SeriesSliderCard";

export const MySeriesPage = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);
	const [isCreateSeriesOpen, setIsCreateSeriesOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [activeTab, setActiveTab] = useState<IMyCreatorsTab>("all");
	const pageSize = 27;
	const loaderLimit = 27;
	const { data: mySeriesData, isLoading } = useMySeriesQuery(
		{ limit: loaderLimit },
		{ enabled: Boolean(session) },
	);
	const mineSeries = useMemo(
		() => mySeriesData?.items ?? [],
		[mySeriesData?.items],
	);
	const series = useMemo(() => {
		if (activeTab === "mine") {
			return mineSeries.filter((seriesItem) => seriesItem.isOwned);
		}

		if (activeTab === "public") {
			return mineSeries.filter((seriesItem) => seriesItem.isPublic);
		}

		return mineSeries;
	}, [activeTab, mineSeries]);
	const visibleSeries = useMemo(() => {
		const startIndex = (page - 1) * pageSize;
		return series.slice(startIndex, startIndex + pageSize);
	}, [page, pageSize, series]);
	const totalPages = Math.max(1, Math.ceil(series.length / pageSize));
	const seriesTotal = series.length;
	const publicTotal = mineSeries.filter(
		(seriesItem) => seriesItem.isPublic,
	).length;
	const mineTotal = mineSeries.filter(
		(seriesItem) => seriesItem.isOwned,
	).length;

	useEffect(() => {
		if (!session) {
			router.replace("/?auth=required");
		}
	}, [router, session]);

	if (!session) {
		return null;
	}

	return (
		<Page>
			<PageHero
				actionLabel="Create series"
				copyWidth="min(72rem, 100%)"
				text="Series you follow and create are shown here in one place."
				title="My series"
				onAction={() => setIsCreateSeriesOpen(true)}
			/>

			<Content>
				<ControlsRow>
					<MyCreatorsTabs
						activeTab={activeTab}
						allCount={seriesTotal}
						className="creators-tabs"
						mineCount={mineTotal}
						publicCount={publicTotal}
						onChange={(tab) => {
							setActiveTab(tab);
							setPage(1);
						}}
					/>

					<ResultsBadge aria-label={`Series found: ${seriesTotal}`}>
						<ResultsNumber>{seriesTotal}</ResultsNumber>
						<ResultsText>series</ResultsText>
					</ResultsBadge>
				</ControlsRow>

				{isLoading ? (
					<Text>Loading your series...</Text>
				) : visibleSeries.length > 0 ? (
					<>
						<Grid>
							{visibleSeries.map((seriesItem) => (
								<SeriesSliderCard key={seriesItem.id} seriesItem={seriesItem} />
							))}
						</Grid>
						{totalPages > 1 ? (
							<PaginationWrap>
								<AppPagination
									count={totalPages}
									page={page}
									onChange={(nextPage) => {
										setPage(nextPage);
									}}
								/>
							</PaginationWrap>
						) : null}
					</>
				) : (
					<Text>Your saved series will appear here.</Text>
				)}
			</Content>

			{isCreateSeriesOpen ? (
				<CreateSeriesModal onClose={() => setIsCreateSeriesOpen(false)} />
			) : null}
		</Page>
	);
};

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding-bottom: clamp(3rem, 5vw, 4.5rem);
`;

const Content = styled.section`
	width: min(72rem, 100%);
	margin: 0 auto;
`;

const ControlsRow = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 1.25rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		align-items: stretch;
	}
`;

const ResultsBadge = styled.div`
	display: inline-flex;
	min-height: 2.35rem;
	align-items: baseline;
	justify-content: center;
	gap: 0.42rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.22);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.72);
	padding: 0.48rem 0.85rem;
	white-space: nowrap;
`;

const ResultsNumber = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1.18rem;
	font-weight: 600;
	line-height: 1;
`;

const ResultsText = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
	line-height: 1;
`;

const Grid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: start;
	justify-content: center;
	margin-top: clamp(2.5rem, 5vw, 4rem);
`;

const Text = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.45;
`;

const PaginationWrap = styled.div`
	margin-top: 1rem;
`;
