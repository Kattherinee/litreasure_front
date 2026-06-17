import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";

import { useSaveAuthorMutation } from "@/shared/api/authors";
import type { ISearchAuthor } from "@/shared/api/search";
import { AuthorAvatar } from "@/shared/ui/AuthorAvatar";

import {
	MiniSaveButton,
	ResultActionCard,
	ResultContentLink,
	ResultMeta,
	ResultSeries,
	ResultTitle,
} from "./SearchResultCard.styles";
import {
	getBooksCountLabel,
	getEntitySupplementalMatch,
	HighlightedText,
	SearchMatchBadge,
} from "./SearchResultCard.utils";

interface IAuthorResultCardProps {
	author: ISearchAuthor;
	closeSearch: () => void;
	query: string;
	saveRecentSearch: () => void;
}

export const AuthorResultCard = ({
	author,
	closeSearch,
	query,
	saveRecentSearch,
}: IAuthorResultCardProps) => {
	const saveAuthorMutation = useSaveAuthorMutation();
	const [isSaved, setIsSaved] = useState(Boolean(author.isSaved));

	const handleOpenResult = () => {
		saveRecentSearch();
		closeSearch();
	};
	const handleSaveAuthor = async () => {
		if (isSaved || saveAuthorMutation.isPending) return;

		try {
			await saveAuthorMutation.mutateAsync(author.id);
			setIsSaved(true);
		} catch {
			setIsSaved(false);
		}
	};

	return (
		<ResultActionCard>
			<ResultContentLink
				href={`/authors/${author.id}`}
				onClick={handleOpenResult}
			>
				<AuthorAvatar
					fontSize="1rem"
					name={author.name}
					photoUrl={author.photoUrl}
					size="4rem"
				/>
				<ResultMeta>
					<ResultTitle>
						<HighlightedText query={query} text={author.name} />
					</ResultTitle>
					<ResultSeries>
						{getBooksCountLabel(author.bookCount ?? 0)}
					</ResultSeries>
					<SearchMatchBadge
						match={getEntitySupplementalMatch(author.searchMatches, query, [
							"author",
							"authors",
							"name",
						])}
						query={query}
					/>
				</ResultMeta>
			</ResultContentLink>
			<MiniSaveButton
				$isSaved={isSaved}
				aria-label={isSaved ? "Author saved" : "Save author"}
				disabled={isSaved || saveAuthorMutation.isPending}
				type="button"
				onClick={() => void handleSaveAuthor()}
			>
				{isSaved ? (
					<CheckIcon aria-hidden="true" />
				) : (
					<AddIcon aria-hidden="true" />
				)}
			</MiniSaveButton>
		</ResultActionCard>
	);
};
