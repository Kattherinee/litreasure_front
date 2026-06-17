import { Fragment } from "react";
import styled from "styled-components";

import type { ISearchMatch, ISearchSeries } from "@/shared/api/search";
import { theme } from "@/shared/theme";

export const lineHasMatch = (
	value: string | null | undefined,
	matches: ISearchMatch[] | undefined,
	query: string,
	fields: string[],
) => {
	const safeValue = typeof value === "string" ? value : "";
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery) {
		return false;
	}

	return (
		safeValue.toLowerCase().includes(normalizedQuery) ||
		matches?.some(
			(match) =>
				fields.includes(match.field) &&
				typeof match.value === "string" &&
				match.value.toLowerCase().includes(normalizedQuery),
		) === true
	);
};

export const getSupplementalSearchMatch = (
	matches: ISearchMatch[] | undefined,
	query: string,
	visibleMatches: { author: boolean; series: boolean; title: boolean },
) => {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery || !matches?.length) {
		return null;
	}

	return (
		matches.find((match) => {
			if (
				typeof match.value !== "string" ||
				!match.value.toLowerCase().includes(normalizedQuery)
			) {
				return false;
			}

			if (["book", "title"].includes(match.field)) {
				return !visibleMatches.title;
			}

			if (["author", "authors"].includes(match.field)) {
				return !visibleMatches.author;
			}

			if (["series", "seriesTitle"].includes(match.field)) {
				return !visibleMatches.series;
			}

			return true;
		}) ?? null
	);
};

export const getEntitySupplementalMatch = (
	matches: ISearchMatch[] | undefined,
	query: string,
	visibleFields: string[],
) => {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery || !matches?.length) {
		return null;
	}

	return (
		matches.find(
			(match) =>
				!visibleFields.includes(match.field) &&
				typeof match.value === "string" &&
				match.value.toLowerCase().includes(normalizedQuery),
		) ?? null
	);
};

export const getSeriesCoverUrl = (series: ISearchSeries) => series.coverUrl;

export const getSeriesAuthorLine = (series: ISearchSeries) =>
	series.authorName ??
	series.searchMatches?.find((match) => match.field === "author")?.value;

export const getBooksCountLabel = (count: number) => {
	if (count === 1) {
		return "1 book";
	}

	return `${count} books`;
};

export const HighlightedText = ({
	query,
	text,
}: {
	query: string;
	text: string | null | undefined;
}) => {
	const safeText = typeof text === "string" ? text : "";
	const highlightValue = query.trim();

	if (!highlightValue) {
		return safeText;
	}

	const matchIndex = safeText
		.toLowerCase()
		.indexOf(highlightValue.toLowerCase());

	if (matchIndex === -1) {
		return safeText;
	}

	const before = safeText.slice(0, matchIndex);
	const match = safeText.slice(matchIndex, matchIndex + highlightValue.length);
	const after = safeText.slice(matchIndex + highlightValue.length);

	return (
		<Fragment>
			{before}
			<Highlight>{match}</Highlight>
			{after}
		</Fragment>
	);
};

export const SearchMatchBadge = ({
	match,
	query,
}: {
	match: ISearchMatch | null;
	query: string;
}) => {
	if (!match) {
		return null;
	}

	return (
		<ResultMatchLine>
			<ResultMatchField>{formatSearchMatchField(match.field)}</ResultMatchField>
			<HighlightedText query={query} text={match.value} />
		</ResultMatchLine>
	);
};

const formatSearchMatchField = (field: string) => {
	if (field === "author" || field === "authors") return "Author";
	if (field === "genre" || field === "genres") return "Genre";
	if (field === "series" || field === "seriesTitle") return "Series";
	if (field === "collection" || field === "collections") return "Collection";
	if (field === "publisher" || field === "publishers") return "Publisher";
	if (field === "title" || field === "book") return "Book";

	return "Match";
};

const ResultMatchLine = styled.span`
	display: inline-flex;
	max-width: 100%;
	align-items: center;
	gap: 0.4rem;
	overflow: hidden;
	border-radius: 0.45rem;
	background: rgb(218 142 91 / 0.1);
	padding: 0.25rem 0.45rem;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.78rem;
	line-height: 1.25;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ResultMatchField = styled.span`
	flex: 0 0 auto;
	color: ${theme.colors.orangeDark};
	font-weight: 700;
`;

const Highlight = styled.mark`
	background: ${theme.colors.transparent};
	color: ${theme.colors.orangeDark};
	font-weight: inherit;
`;
