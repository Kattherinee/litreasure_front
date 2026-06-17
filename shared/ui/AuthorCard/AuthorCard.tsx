import { theme } from "@/shared/theme";
import Link from "next/link";
import styled from "styled-components";
import { IAuthorPreview } from "../../api/authors";
import { AuthorAvatar } from "../AuthorAvatar";
import { ResultSeries } from "../BookSearch/SearchResultCard.styles";

const AuthorCard = ({ author }: { author: IAuthorPreview }) => {
	return (
		<AuthorCardContainer key={author.id} href={`/authors/${author.id}`}>
			<AuthorAvatar name={author.name} photoUrl={author.photoUrl} />
			<AuthorMeta>
				<AuthorName>{author.name}</AuthorName>

				<BookCount>{author.bookCount} books</BookCount>
				<AuthorFacts>
					{author.topGenres && author.topGenres.length > 0
						? author.topGenres.map((genre) => (
								<ResultSeries key={genre.id}>{genre.name}</ResultSeries>
							))
						: null}
				</AuthorFacts>
			</AuthorMeta>
		</AuthorCardContainer>
	);
};
export default AuthorCard;
const AuthorCardContainer = styled(Link)`
	display: grid;
	align-items: center;
	gap: 1rem;
	grid-template-columns: 5rem minmax(0, 1fr);
	border-radius: 1rem;
	background: ${theme.colors.white};
	padding: 1rem;
	color: inherit;
	text-decoration: none;
	transition:
		box-shadow 180ms ease,
		transform 180ms ease;

	&:hover,
	&:focus-visible {
		box-shadow: 0 0.75rem 1.5rem rgb(4 18 26 / 0.08);
		outline: none;
		transform: translateY(-0.0625rem);
	}
`;

const AuthorMeta = styled.span`
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.35rem;
`;

const AuthorName = styled.span`
	overflow: hidden;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.25rem;
	font-weight: 600;
	line-height: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const AuthorFacts = styled.span`
	display: flex;

	flex-wrap: wrap;
	align-items: center;
	gap: 0.35vw;
	color: ${theme.colors.orangeDark};
	font-size: 0.82vw;
	line-height: 1.3vw;
`;
const BookCount = styled.span`
	color: ${theme.colors.orangeDark};
	font-size: 0.82vw;
	line-height: 1.3vw;
`;
