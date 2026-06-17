"use client";

import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import styled from "styled-components";

import type { IUserBookStatus } from "@/shared/api/user-books";
import { theme } from "@/shared/theme";
import type { IBookCardData } from "@/shared/ui/BookCard";
import BookCarousel from "@/shared/ui/BookCarousel/BookCarousel";
import { ChipTabs } from "@/shared/ui/ChipTabs";
import {
	HeaderActionButton,
	HeaderActionLink,
	NextIcon,
	PrevIcon,
	RailControlButton,
	RailControls,
	ViewAllLink,
} from "./ui";

const statusTabs: Array<{ id: IUserBookStatus | "all"; label: string }> = [
	{ id: "all", label: "All" },
	{ id: "reading", label: "Reading" },
	{ id: "planned", label: "Planned" },
	{ id: "finished", label: "Finished" },
	{ id: "paused", label: "Paused" },
	{ id: "rereading", label: "Rereading" },
	{ id: "dropped", label: "Dropped" },
];
type IMyBooksFilter = IUserBookStatus | "all" | "created";

interface IMyBooksBlockProps {
	activeStatus: IMyBooksFilter;
	bookCarouselControls: {
		canScrollNext: boolean;
		canScrollPrev: boolean;
		scrollNext: () => void;
		scrollPrev: () => void;
	} | null;
	bookCarouselItems: IBookCardData[];
	createdBooksCount: number;
	getStatusCount: (status: IUserBookStatus | "all") => number;
	hasBookCarouselControls: boolean;
	isUserBooksError: boolean;
	isUserBooksLoading: boolean;
	shouldShowAllBooksLink: boolean;
	onChangeStatus: (status: IMyBooksFilter) => void;
	onCreateBook: () => void;
	onControlsChange: (controls: {
		canScrollNext: boolean;
		canScrollPrev: boolean;
		scrollNext: () => void;
		scrollPrev: () => void;
	}) => void;
}

export const MyBooksBlock = ({
	activeStatus,
	bookCarouselControls,
	bookCarouselItems,
	createdBooksCount,
	getStatusCount,
	hasBookCarouselControls,
	isUserBooksError,
	isUserBooksLoading,
	shouldShowAllBooksLink,
	onChangeStatus,
	onCreateBook,
	onControlsChange,
}: IMyBooksBlockProps) => (
	<MainGrid>
		<LibraryPanel>
			<PanelHeader>
				<PanelTitleRow>
					<PanelTitle>My Books</PanelTitle>
					{shouldShowAllBooksLink ? (
						<ViewAllLink href="/treasures/books">
							<span>View all</span>
							<KeyboardArrowRightIcon aria-hidden="true" />
						</ViewAllLink>
					) : null}
				</PanelTitleRow>
				<HeaderActions>
					<HeaderActionLink href="/search" title="Find a book">
						<SearchIcon aria-hidden="true" />
						<span>Find a book</span>
					</HeaderActionLink>
					<HeaderActionButton
						title="Create a book"
						type="button"
						onClick={onCreateBook}
					>
						<AddIcon aria-hidden="true" />
						<span>Create</span>
					</HeaderActionButton>
				</HeaderActions>
			</PanelHeader>
			<BooksToolbar>
				<TabsRow>
					<ChipTabs
						activeId={activeStatus}
						ariaLabel="Book statuses"
						items={statusTabs.map((status) => ({
							count: getStatusCount(status.id),
							id: status.id,
							label: status.label,
						}))}
						onChange={(id) => onChangeStatus(id as IMyBooksFilter)}
					/>
					<CreatedTabButton
						$isActive={activeStatus === "created"}
						type="button"
						onClick={() => onChangeStatus("created")}
					>
						Created
						<CreatedCount>{createdBooksCount}</CreatedCount>
					</CreatedTabButton>
				</TabsRow>
				{hasBookCarouselControls ? (
					<RailControls aria-label="Book carousel controls">
						<RailControlButton
							aria-label="Previous books"
							disabled={!bookCarouselControls?.canScrollPrev}
							type="button"
							onClick={bookCarouselControls?.scrollPrev}
						>
							<PrevIcon aria-hidden="true" />
						</RailControlButton>
						<RailControlButton
							aria-label="Next books"
							disabled={!bookCarouselControls?.canScrollNext}
							type="button"
							onClick={bookCarouselControls?.scrollNext}
						>
							<NextIcon aria-hidden="true" />
						</RailControlButton>
					</RailControls>
				) : null}
			</BooksToolbar>
			{isUserBooksLoading ? (
				<BookEmptyState>
					<BookEmptyTitle>Loading books...</BookEmptyTitle>
				</BookEmptyState>
			) : isUserBooksError ? (
				<BookEmptyState>
					<BookEmptyTitle>Failed to load books</BookEmptyTitle>
					<BookEmptyText>
						Check your authorization and try opening the page again.
					</BookEmptyText>
				</BookEmptyState>
			) : bookCarouselItems.length > 0 ? (
				<BookCarouselFrame>
					<BookCarousel
						bleed={false}
						books={bookCarouselItems}
						showStatusBadge={activeStatus === "all"}
						size="tiny"
						onControlsChange={onControlsChange}
					/>
				</BookCarouselFrame>
			) : (
				<BookEmptyState>
					<BookEmptyTitle>No books yet</BookEmptyTitle>
					<BookEmptyText>
						Add a book and assign a status: planned, reading, finished, paused,
						rereading, or dropped.
					</BookEmptyText>
				</BookEmptyState>
			)}
		</LibraryPanel>
	</MainGrid>
);

const MainGrid = styled.div`
	margin-bottom: 1rem;
`;
const LibraryPanel = styled.section`
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 1rem;
	background: rgb(242 239 237 / 0.74);
	padding: 1.25rem 1.35rem 1.45rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding: 1rem;
	}
`;
const PanelHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 0.75rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		align-items: center;
		gap: 0.75rem;
	}
`;
const PanelTitleRow = styled.div`
	display: flex;
	flex: 1;
	align-items: center;
	gap: 0.85rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		min-width: 0;
		justify-content: flex-start;
	}
`;
const PanelTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.35rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 1.2rem;
	}
`;
const HeaderActions = styled.div`
	display: flex;
	gap: 0.6rem;
	margin-left: auto;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex: 0 0 auto;
		flex-wrap: nowrap;
		gap: 0.45rem;
	}
`;
const BooksToolbar = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 1rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		align-items: stretch;
	}
`;
const TabsRow = styled.div`
	display: flex;
	flex: 1;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 100%;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.65rem;
		overflow-x: auto;
		overflow-y: hidden;
		padding-bottom: 0.15rem;
		scrollbar-width: none;
		-ms-overflow-style: none;

		&::-webkit-scrollbar {
			display: none;
		}
	}
`;
const CreatedTabButton = styled.button<{ $isActive: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	border: 0.0625rem solid
		${({ $isActive }) =>
			$isActive ? theme.colors.orangeLight : "rgb(211 202 196 / 0.82)"};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.14)" : theme.colors.surface};
	padding: 0.45rem 0.85rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	font-weight: ${({ $isActive }) => ($isActive ? 700 : 400)};
	white-space: nowrap;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex: 0 0 auto;
		width: fit-content;
	}

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;
const CreatedCount = styled.span`
	color: ${theme.colors.orangeDark};
	font-weight: 700;
`;
const BookCarouselFrame = styled.div`
	min-height: 12.75rem;
	margin-top: 1rem;
	overflow: visible;

	@media (max-width: ${theme.rubberSize.tablet}) {
		min-height: 0;
		margin-top: 0.5rem;
	}
`;
const BookEmptyState = styled.div`
	margin-top: 1rem;
	border: 0.0625rem dashed ${theme.colors.border};
	border-radius: 0.8rem;
	padding: 1.5rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding: 1rem;
	}
`;
const BookEmptyTitle = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.25rem;
`;
const BookEmptyText = styled.p`
	max-width: 42rem;
	margin: 0.45rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;
