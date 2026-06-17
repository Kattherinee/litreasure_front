import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";

import { useSaveSeriesMutation } from "@/shared/api/series";
import type { ISearchSeries } from "@/shared/api/search";

import {
	ResultAuthor,
	ResultContentLink,
	ResultEntityCard,
	ResultMeta,
	ResultSeries,
	ResultTitle,
	MiniSaveButton,
	SeriesStack,
	SeriesStackCover,
} from "./SearchResultCard.styles";
import {
	getBooksCountLabel,
	getEntitySupplementalMatch,
	getSeriesAuthorLine,
	getSeriesCoverUrl,
	HighlightedText,
	SearchMatchBadge,
} from "./SearchResultCard.utils";

interface ISeriesResultCardProps {
	closeSearch?: () => void;
	query: string;
	saveRecentSearch: () => void;
	series: ISearchSeries;
}

export const SeriesResultCard = ({
	closeSearch,
	query,
	saveRecentSearch,
	series,
}: ISeriesResultCardProps) => {
	const saveSeriesMutation = useSaveSeriesMutation();
	const [isSaved, setIsSaved] = useState(Boolean(series.isSaved));
	const coverUrl = getSeriesCoverUrl(series);
	const authorLine = getSeriesAuthorLine(series);

	const handleOpenResult = () => {
		saveRecentSearch();
		if (closeSearch) {
			closeSearch();
		}
	};
	const handleSaveSeries = async () => {
		if (isSaved || saveSeriesMutation.isPending) return;

		try {
			await saveSeriesMutation.mutateAsync(series.id);
			setIsSaved(true);
		} catch {
			setIsSaved(false);
		}
	};

	return (
		<ResultEntityCard>
			<ResultContentLink
				href={`/series/${series.id}`}
				onClick={handleOpenResult}
			>
				<SeriesStack>
					{Array.from({ length: 3 }, (_, index) => (
						<SeriesStackCover
							key={index}
							$index={index}
							alt=""
							src={coverUrl ?? "/images/book-placeholder.svg"}
						/>
					))}
				</SeriesStack>
				<ResultMeta>
					<ResultTitle>
						<HighlightedText query={query} text={series.title} />
					</ResultTitle>
					{authorLine ? (
						<ResultAuthor>
							<HighlightedText query={query} text={authorLine} />
						</ResultAuthor>
					) : null}
					<ResultSeries>
						{getBooksCountLabel(series.bookCount ?? 0)}
					</ResultSeries>
					<SearchMatchBadge
						match={getEntitySupplementalMatch(series.searchMatches, query, [
							"series",
							"seriesTitle",
							"title",
							"author",
						])}
						query={query}
					/>
				</ResultMeta>
			</ResultContentLink>
			<MiniSaveButton
				$isSaved={isSaved}
				aria-label={isSaved ? "Series saved" : "Save series"}
				disabled={isSaved || saveSeriesMutation.isPending}
				type="button"
				onClick={() => void handleSaveSeries()}
			>
				{isSaved ? (
					<CheckIcon aria-hidden="true" />
				) : (
					<AddIcon aria-hidden="true" />
				)}
			</MiniSaveButton>
		</ResultEntityCard>
	);
};
