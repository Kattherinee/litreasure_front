"use client";

import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { useMemo, useState } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { ChipTabs } from "@/shared/ui/ChipTabs";
import { SeriesSliderCard } from "@/shared/ui/HomeEntitySliderSection/SeriesSliderCard";
import {
	HeaderActionButton,
	ViewAllLink,
} from "@/components/pages/my-treasures/ui";

type ISeriesTreasureFilter = "all" | "public" | "mine";

interface IMySeriesTabProps {
	mySeries: Array<{
		authorName?: string;
		bookCount?: number;
		coverUrl?: string;
		description?: string;
		id: string;
		isOwned?: boolean;
		isPublic?: boolean;
		title: string;
	}>;
	onCreateSeries: () => void;
}

export const MySeriesTab = ({ mySeries, onCreateSeries }: IMySeriesTabProps) => {
	const [activeFilter, setActiveFilter] = useState<ISeriesTreasureFilter>("all");

	const visibleSeries = useMemo(() => {
		if (activeFilter === "mine") {
			return mySeries.filter((series) => series.isOwned);
		}

		if (activeFilter === "public") {
			return mySeries.filter((series) => series.isPublic);
		}

		return mySeries;
	}, [activeFilter, mySeries]);

	const allCount = mySeries.length;
	const publicCount = mySeries.filter((series) => series.isPublic).length;
	const mineCount = mySeries.filter((series) => series.isOwned).length;

	return (
		<Panel>
			<Header>
				<Row>
					<Title>My Series</Title>
					<ViewAllLink href="/treasures/series">
						<span>View all</span>
						<KeyboardArrowRightIcon aria-hidden="true" />
					</ViewAllLink>
				</Row>
				<HeaderActionButton type="button" onClick={onCreateSeries}>
					<AddIcon aria-hidden="true" />
					<span>Create</span>
				</HeaderActionButton>
			</Header>

			<ChipRow>
				<ChipTabs
					activeId={activeFilter}
					ariaLabel="My series filters"
					items={[
						{ count: allCount, id: "all", label: "All" },
						{ count: publicCount, id: "public", label: "Public" },
						{ count: mineCount, id: "mine", label: "Created by me" },
					]}
					onChange={(id) => setActiveFilter(id as ISeriesTreasureFilter)}
				/>
			</ChipRow>

			{visibleSeries.length > 0 ? (
				<Rail>
					{visibleSeries.slice(0, 10).map((series) => (
						<SliderItem key={series.id}>
							<SeriesSliderCard
								seriesItem={{
									authorName: series.authorName,
									bookCount: series.bookCount,
									coverUrl: series.coverUrl,
									description: series.description,
									id: series.id,
									isSaved: true,
									title: series.title,
								}}
							/>
						</SliderItem>
					))}
				</Rail>
			) : (
				<Text>Series you follow will appear here.</Text>
			)}
		</Panel>
	);
};

const Panel = styled.div``;
const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.75rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: row;
		align-items: center;
	}
`;
const ChipRow = styled.div`
	margin-bottom: 0.85rem;
`;
const Row = styled.div`
	display: flex;
	align-items: center;
	gap: 0.85rem;
	min-width: 0;
	flex: 1;
	flex-wrap: wrap;
`;
const Title = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.35rem;
`;
const Rail = styled.div`
	display: flex;
	gap: 0.9rem;
	overflow-x: auto;
	padding: 0.1rem 0 0.3rem;
	scrollbar-width: none;
	-ms-overflow-style: none;

	&::-webkit-scrollbar {
		display: none;
	}
`;
const SliderItem = styled.div`
	flex: 0 0 auto;
`;
const Text = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;
