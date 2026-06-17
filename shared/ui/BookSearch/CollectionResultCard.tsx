import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";

import { useSaveCollectionMutation } from "@/shared/api/collections";
import type { ISearchCollection } from "@/shared/api/search";

import {
	CollectionMark,
	ResultDescription,
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

interface ICollectionResultCardProps {
	closeSearch: () => void;
	collection: ISearchCollection;
	query: string;
	saveRecentSearch: () => void;
}

export const CollectionResultCard = ({
	closeSearch,
	collection,
	query,
	saveRecentSearch,
}: ICollectionResultCardProps) => {
	const saveCollectionMutation = useSaveCollectionMutation();
	const [isSaved, setIsSaved] = useState(Boolean(collection.isSaved));

	const handleOpenResult = () => {
		saveRecentSearch();
		closeSearch();
	};
	const handleSaveCollection = async () => {
		if (isSaved || saveCollectionMutation.isPending) return;

		try {
			await saveCollectionMutation.mutateAsync(collection.id);
			setIsSaved(true);
		} catch {
			setIsSaved(false);
		}
	};

	return (
		<ResultActionCard>
			<ResultContentLink
				href={`/collections/${collection.id}`}
				onClick={handleOpenResult}
			>
				<CollectionMark />
				<ResultMeta>
					<ResultTitle>
						<HighlightedText query={query} text={collection.title} />
					</ResultTitle>
					{collection.description ? (
						<ResultDescription>
							<HighlightedText query={query} text={collection.description} />
						</ResultDescription>
					) : null}
					<ResultSeries>
						{getBooksCountLabel(collection.bookCount ?? 0)}
					</ResultSeries>
					<SearchMatchBadge
						match={getEntitySupplementalMatch(collection.searchMatches, query, [
							"collection",
							"collections",
							"title",
							"description",
						])}
						query={query}
					/>
				</ResultMeta>
			</ResultContentLink>
			<MiniSaveButton
				$isSaved={isSaved}
				aria-label={isSaved ? "Collection saved" : "Save collection"}
				disabled={isSaved || saveCollectionMutation.isPending}
				type="button"
				onClick={() => void handleSaveCollection()}
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
