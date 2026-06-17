"use client";

import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { ResultSeries } from "@/shared/ui/BookSearch/SearchResultCard.styles";
import { ChipTabs } from "@/shared/ui/ChipTabs";
import {
	HeaderActionButton,
	ViewAllLink,
} from "@/components/pages/my-treasures/ui";
import type { ICollectionTreasureFilter } from "../types";

const collectionFilterTabs: Array<{
	id: ICollectionTreasureFilter;
	label: string;
}> = [
	{ id: "all", label: "All" },
	{ id: "created", label: "Created" },
	{ id: "subscribed", label: "Subscribed" },
];

interface IMyCollectionsTabProps {
	activeCollectionFilter: ICollectionTreasureFilter;
	collectionRailControls: {
		canScrollNext: boolean;
		canScrollPrev: boolean;
		hasOverflow: boolean;
	};
	collectionsRailRef: { current: HTMLDivElement | null };
	isCollectionsLoading: boolean;
	visibleCollections: Array<{
		bookCount: number;
		coverUrl?: string;
		id: string;
		title: string;
	}>;
	visibleCollectionsTotal: number;
	onChangeCollectionFilter: (filter: ICollectionTreasureFilter) => void;
	onCreateCollection: () => void;
	onOpenCollection: (id: string) => void;
	onScrollCollections: (direction: "next" | "prev") => void;
}

export const MyCollectionsTab = ({
	activeCollectionFilter,
	collectionsRailRef,
	isCollectionsLoading,
	visibleCollections,
	visibleCollectionsTotal,
	onChangeCollectionFilter,
	onCreateCollection,
	onOpenCollection,
}: IMyCollectionsTabProps) => (
	<Panel>
		<Header>
			<Row>
				<Title>My Collections</Title>
				<ViewAllLink href="/collections/_username">
					<span>View all</span>
					<KeyboardArrowRightIcon aria-hidden="true" />
				</ViewAllLink>
			</Row>
			<HeaderActionButton type="button" onClick={onCreateCollection}>
				<AddIcon aria-hidden="true" />
				<span>Create</span>
			</HeaderActionButton>
		</Header>
		<FilterRow>
			<ChipTabs
				activeId={activeCollectionFilter}
				ariaLabel="Collection filters"
				items={collectionFilterTabs}
				onChange={(id) =>
					onChangeCollectionFilter(id as ICollectionTreasureFilter)
				}
			/>
			<RightMeta>
				<Total>
					<TotalLabel>Total</TotalLabel>
					<TotalValue>{visibleCollectionsTotal}</TotalValue>
				</Total>
			</RightMeta>
		</FilterRow>
		{isCollectionsLoading ? (
			<Text>Loading your collections...</Text>
		) : visibleCollections.length > 0 ? (
			<List ref={collectionsRailRef}>
				{visibleCollections.slice(0, 10).map((collection) => (
					<Chip
						key={collection.id}
						role="link"
						tabIndex={0}
						onClick={() => onOpenCollection(collection.id)}
						onKeyDown={(event) => {
							if (event.key !== "Enter" && event.key !== " ") return;
							event.preventDefault();
							onOpenCollection(collection.id);
						}}
					>
						<Cover $coverUrl={collection.coverUrl} />
						<Meta>
							<Name>{collection.title}</Name>
							<BookCount>{collection.bookCount} books</BookCount>
						</Meta>
					</Chip>
				))}
			</List>
		) : (
			<Text>
				Create your first collection for favorite books, moods, and future
				shelves.
			</Text>
		)}
	</Panel>
);

const Panel = styled.div``;
const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	margin-bottom: 0.75rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: row;
		align-items: center;
	}
`;
const Row = styled.div`
	display: flex;
	align-items: center;
	gap: 0.85rem;
	min-width: 0;
	flex: 1;
`;
const Title = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.35rem;
`;
const FilterRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		align-items: stretch;
		gap: 0.75rem;
	}
`;
const RightMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 0.85rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		justify-content: space-between;
	}
`;
const Total = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 0.3rem;
`;
const TotalLabel = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;
const TotalValue = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1.25rem;
	font-weight: 600;
	line-height: 1;
`;
const List = styled.div`
	display: flex;
	gap: 0.75rem;
	overflow-x: auto;
	padding: 0.1rem 0 0.25rem;
	scrollbar-width: none;
	-ms-overflow-style: none;

	&::-webkit-scrollbar {
		display: none;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		overflow: visible;
		padding-bottom: 0;
	}
`;
const Chip = styled.article`
	display: grid;
	min-width: clamp(12.5rem, 42vw, 15rem);
	grid-template-columns: 4.25rem minmax(0, 1fr);
	gap: 0.75rem;
	align-items: center;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 0.9rem;
	background: rgb(255 255 255 / 0.64);
	padding: 0.55rem;
	cursor: pointer;
	height: fit-content;

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 100%;
		min-width: 0;
		align-items: start;
		gap: 0.6rem;
	}
`;
const Cover = styled.div<{ $coverUrl?: string }>`
	width: 4.25rem;
	aspect-ratio: 1/1;
	border-radius: 0.6rem;
	background:
		linear-gradient(rgb(4 18 26 / 0.08), rgb(4 18 26 / 0.08)),
		url("${({ $coverUrl }) => $coverUrl || "/images/book-placeholder.svg"}")
			center / cover;
`;
const Meta = styled.div`
	min-width: 0;
	overflow: hidden;
`;
const Name = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.05rem;
	font-weight: 600;
	line-height: 1.12;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	word-break: break-word;

	@media (max-width: ${theme.rubberSize.tablet}) {
		white-space: normal;
		overflow-wrap: anywhere;
	}
`;
const BookCount = styled(ResultSeries)`
	margin-top: 0.3rem;
`;
const Text = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;
