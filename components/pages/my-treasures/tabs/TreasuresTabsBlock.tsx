"use client";

import type { MutableRefObject } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import type { ICollectionTreasureFilter, ITreasureTab } from "../types";
import { MyAuthorsTab } from "./MyAuthorsTab";
import { MyCollectionsTab } from "./MyCollectionsTab";
import { MyGenresTab } from "./MyGenresTab";
import { MyPaperBooksTab } from "./MyPaperBooksTab";
import { MySeriesTab } from "./MySeriesTab";
import { ChipTabs } from "@/shared/ui/ChipTabs";

interface ITabMetric {
	count: number;
	id: ITreasureTab;
	label: string;
}

interface ITreasuresTabsBlockProps {
	activeCollectionFilter: ICollectionTreasureFilter;
	activeTreasureTab: ITreasureTab;
	collectionRailControls: {
		canScrollNext: boolean;
		canScrollPrev: boolean;
		hasOverflow: boolean;
	};
	collectionsRailRef: MutableRefObject<HTMLDivElement | null>;
	isCollectionsLoading: boolean;
	isMyAuthorsLoading: boolean;
	isMyGenresLoading: boolean;
	myAuthors: Array<{ bookCount: number; id: string; name: string; photoUrl?: string }>;
	myGenres: Array<{ id: string; name: string; slug: string }>;
	mySeries: Array<{
		authorName?: string;
		bookCount?: number;
		coverUrl?: string;
		description?: string;
		id: string;
		title: string;
	}>;
	resourceTabs: ITabMetric[];
	visibleCollections: Array<{ bookCount: number; coverUrl?: string; id: string; title: string }>;
	visibleCollectionsTotal: number;
	onChangeCollectionFilter: (filter: ICollectionTreasureFilter) => void;
	onChangeTab: (tab: ITreasureTab) => void;
	onCreateAuthor: () => void;
	onCreateCollection: () => void;
	onCreateSeries: () => void;
	onOpenCollection: (id: string) => void;
	onScrollCollections: (direction: "next" | "prev") => void;
}

export const TreasuresTabsBlock = ({
	activeCollectionFilter,
	activeTreasureTab,
	collectionRailControls,
	collectionsRailRef,
	isCollectionsLoading,
	isMyAuthorsLoading,
	isMyGenresLoading,
	myAuthors,
	myGenres,
	mySeries,
	resourceTabs,
	visibleCollections,
	visibleCollectionsTotal,
	onChangeCollectionFilter,
	onChangeTab,
	onCreateAuthor,
	onCreateCollection,
	onCreateSeries,
	onOpenCollection,
	onScrollCollections,
}: ITreasuresTabsBlockProps) => (
	<TreasureTabsPanel>
		<TabsRow
			activeId={activeTreasureTab}
			ariaLabel="Treasure sections"
			items={resourceTabs}
			variant="block"
			onChange={(id) => onChangeTab(id as ITreasureTab)}
		/>
		<TreasureTabContent>
			{activeTreasureTab === "authors" ? (
				<MyAuthorsTab
					isMyAuthorsLoading={isMyAuthorsLoading}
					myAuthors={myAuthors}
					onCreateAuthor={onCreateAuthor}
				/>
			) : null}
			{activeTreasureTab === "series" ? (
				<MySeriesTab mySeries={mySeries} onCreateSeries={onCreateSeries} />
			) : null}
			{activeTreasureTab === "genres" ? (
				<MyGenresTab isMyGenresLoading={isMyGenresLoading} myGenres={myGenres} />
			) : null}
			{activeTreasureTab === "collections" ? (
				<MyCollectionsTab
					activeCollectionFilter={activeCollectionFilter}
					collectionRailControls={collectionRailControls}
					collectionsRailRef={collectionsRailRef}
					isCollectionsLoading={isCollectionsLoading}
					visibleCollections={visibleCollections}
					visibleCollectionsTotal={visibleCollectionsTotal}
					onChangeCollectionFilter={onChangeCollectionFilter}
					onCreateCollection={onCreateCollection}
					onOpenCollection={onOpenCollection}
					onScrollCollections={onScrollCollections}
				/>
			) : null}
			{activeTreasureTab === "paper-books" ? <MyPaperBooksTab /> : null}
		</TreasureTabContent>
	</TreasureTabsPanel>
);

const TreasureTabsPanel = styled.section`
	--tabs-content-bg: rgb(255 255 255 / 0.42);
`;
const TabsRow = styled(ChipTabs)`
	margin-bottom: 0.75rem;
`;
const TreasureTabContent = styled.div`
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 1rem;
	background: var(--tabs-content-bg);
	padding: 1rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding: 0.85rem;
	}
`;
