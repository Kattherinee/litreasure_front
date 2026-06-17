"use client";

import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import { useMemo, useState } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { AuthorAvatar } from "@/shared/ui/AuthorAvatar";
import { ChipTabs } from "@/shared/ui/ChipTabs";
import { ResultSeries } from "@/shared/ui/BookSearch/SearchResultCard.styles";
import {
	HeaderActionButton,
	HeaderActionLink,
	ViewAllLink,
} from "@/components/pages/my-treasures/ui";

type IAuthorsTreasureFilter = "all" | "public" | "mine";

interface IMyAuthorsTabProps {
	isMyAuthorsLoading: boolean;
	myAuthors: Array<{
		bookCount: number;
		id: string;
		isOwned?: boolean;
		isPublic?: boolean;
		name: string;
		photoUrl?: string;
	}>;
	onCreateAuthor: () => void;
}

export const MyAuthorsTab = ({
	isMyAuthorsLoading,
	myAuthors,
	onCreateAuthor,
}: IMyAuthorsTabProps) => {
	const [activeFilter, setActiveFilter] = useState<IAuthorsTreasureFilter>("all");

	const visibleAuthors = useMemo(() => {
		if (activeFilter === "mine") {
			return myAuthors.filter((author) => author.isOwned);
		}

		if (activeFilter === "public") {
			return myAuthors.filter((author) => author.isPublic);
		}

		return myAuthors;
	}, [activeFilter, myAuthors]);

	const allCount = myAuthors.length;
	const publicCount = myAuthors.filter((author) => author.isPublic).length;
	const mineCount = myAuthors.filter((author) => author.isOwned).length;

	return (
		<Panel>
			<Header>
				<Row>
					<Title>My Authors</Title>
					<ViewAllLink href="/treasures/authors">
						<span>View all</span>
						<KeyboardArrowRightIcon aria-hidden="true" />
					</ViewAllLink>
				</Row>
				<Actions>
					<HeaderActionLink href="/authors">
						<SearchIcon aria-hidden="true" />
						<span>Find</span>
					</HeaderActionLink>
					<HeaderActionButton type="button" onClick={onCreateAuthor}>
						<AddIcon aria-hidden="true" />
						<span>Create</span>
					</HeaderActionButton>
				</Actions>
			</Header>

			<ChipRow>
				<ChipTabs
					activeId={activeFilter}
					ariaLabel="My authors filters"
					items={[
						{ count: allCount, id: "all", label: "All" },
						{ count: publicCount, id: "public", label: "Public" },
						{ count: mineCount, id: "mine", label: "Created by me" },
					]}
					onChange={(id) => setActiveFilter(id as IAuthorsTreasureFilter)}
				/>
			</ChipRow>

			{isMyAuthorsLoading ? (
				<Text>Loading saved authors...</Text>
			) : visibleAuthors.length > 0 ? (
				<Grid>
					{visibleAuthors.map((author) => (
						<Card key={author.id} href={`/authors/${author.id}`}>
							<AuthorAvatar
								fontSize="0.95rem"
								name={author.name}
								photoUrl={author.photoUrl}
								size="3.75rem"
							/>
							<Meta>
								<Name>{author.name}</Name>
								<BookCount>{author.bookCount} books</BookCount>
							</Meta>
						</Card>
					))}
				</Grid>
			) : (
				<Text>Saved authors will appear here after you add them.</Text>
			)}
		</Panel>
	);
};

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
const ChipRow = styled.div`
	margin-bottom: 0.85rem;
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
const Actions = styled.div`
	display: flex;
	gap: 0.6rem;
	margin-left: auto;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-wrap: nowrap;
		gap: 0.45rem;
	}
`;
const Grid = styled.div`
	display: grid;
	gap: 0.75rem;
	grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));

	@media (max-width: ${theme.rubberSize.tablet}) {
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
	}
`;
const Card = styled(Link)`
	display: grid;
	grid-template-columns: 3.9rem minmax(0, 1fr);
	gap: 0.75rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 0.75rem;
	background: rgb(255 255 255 / 0.58);
	padding: 0.55rem;
	color: inherit;
	text-decoration: none;
`;
const Meta = styled.div`
	min-width: 0;
`;
const Name = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1rem;
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
