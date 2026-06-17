import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";

import type { ISearchGenre } from "@/shared/api/search";
import { useSaveGenreMutation } from "@/shared/api/genres";

import {
	GenreMark,
	MiniSaveButton,
	ResultActionCard,
	ResultContentLink,
	ResultMeta,
	ResultTitle,
} from "./SearchResultCard.styles";
import {
	getEntitySupplementalMatch,
	HighlightedText,
	SearchMatchBadge,
} from "./SearchResultCard.utils";

interface IGenreResultCardProps {
	closeSearch: () => void;
	genre: ISearchGenre;
	query: string;
	saveRecentSearch: () => void;
}

export const GenreResultCard = ({
	closeSearch,
	genre,
	query,
	saveRecentSearch,
}: IGenreResultCardProps) => (
	<GenreSearchResult
		closeSearch={closeSearch}
		genre={genre}
		query={query}
		saveRecentSearch={saveRecentSearch}
	/>
);

const GenreSearchResult = ({
	closeSearch,
	genre,
	query,
	saveRecentSearch,
}: IGenreResultCardProps) => {
	const saveGenreMutation = useSaveGenreMutation();
	const [isSaved, setIsSaved] = useState(Boolean(genre.isSaved));

	const handleOpenResult = () => {
		saveRecentSearch();
		closeSearch();
	};

	const handleSaveGenre = async () => {
		if (isSaved || saveGenreMutation.isPending) return;

		try {
			await saveGenreMutation.mutateAsync(genre.id);
			setIsSaved(true);
		} catch {
			setIsSaved(false);
		}
	};

	return (
		<ResultActionCard>
			<ResultContentLink
				href={`/genres/${genre.slug}`}
				onClick={handleOpenResult}
			>
				<GenreMark>#</GenreMark>
				<ResultMeta>
					<ResultTitle>
						<HighlightedText query={query} text={genre.name} />
					</ResultTitle>
					<SearchMatchBadge
						match={getEntitySupplementalMatch(genre.searchMatches, query, [
							"genre",
							"genres",
							"name",
						])}
						query={query}
					/>
				</ResultMeta>
			</ResultContentLink>
			<MiniSaveButton
				$isSaved={isSaved}
				aria-label={isSaved ? "Genre saved" : "Save genre"}
				disabled={isSaved || saveGenreMutation.isPending}
				type="button"
				onClick={() => void handleSaveGenre()}
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
