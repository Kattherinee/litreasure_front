"use client";

import Link from "next/link";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { ViewAllLink } from "@/components/pages/my-treasures/ui";

interface IMyGenresTabProps {
	isMyGenresLoading: boolean;
	myGenres: Array<{ id: string; name: string; slug: string }>;
}

export const MyGenresTab = ({ isMyGenresLoading, myGenres }: IMyGenresTabProps) => (
	<Panel>
		<Header>
			<Row>
				<Title>My Genres</Title>
				<ViewAllLink href="/genres">
					<span>View all</span>
					<KeyboardArrowRightIcon aria-hidden="true" />
				</ViewAllLink>
			</Row>
		</Header>
		{isMyGenresLoading ? (
			<Text>Loading your genres...</Text>
		) : myGenres.length > 0 ? (
			<List>
				{myGenres.map((genre) => (
					<Chip key={genre.id} href={`/genres/${genre.slug}`}>
						{genre.name}
					</Chip>
				))}
			</List>
		) : (
			<Text>Saved genres will appear here after you add them in the genre catalog.</Text>
		)}
	</Panel>
);

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
const Row = styled.div`
	display: flex;
	align-items: center;
	gap: 0.85rem;
	min-width: 0;
	flex: 1;
`;
const Title = styled.h2`margin:0;color:${theme.colors.foreground};font-family:${theme.fonts.serif};font-size:1.35rem;`;
const List = styled.div`display:flex;flex-wrap:wrap;gap:.55rem;`;
const Chip = styled(Link)`
	border:.0625rem solid rgb(211 202 196 / .72);border-radius:999px;background:rgb(255 255 255 /.58);padding:.45rem .85rem;color:${theme.colors.foreground};text-decoration:none;
`;
const Text = styled.p`margin:0;color:${theme.colors.softForeground};font-size:.95rem;line-height:1.45;`;
