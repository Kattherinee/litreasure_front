"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";

import {
	type IBookRecomendation,
	useRecomendationsByPromptQuery,
} from "@/shared/api/recomendations";
import type { IByPromptRecomendationsParams } from "@/shared/api/recomendations/recomendations.types";
import type { ISearchBook } from "@/shared/api/search";
import { theme } from "@/shared/theme";
import { BookResultCard } from "./BookResultCard";

const RECOMMENDATION_LIMIT = 10;
const MIN_PROMPT_LENGTH = 2;

interface IRecommendationSearchModeProps {
	closeSearch: () => void;
	initialPrompt: string;
	onExitMode: () => void;
	saveRecentSearch: (value: string) => void;
}

const mapBookToSearchBook = (book: IBookRecomendation): ISearchBook => ({
	author: book.author ?? book.authors?.[0]?.name ?? "",
	authorId: book.authors?.[0]?.id,
	coverUrl: book.coverUrl,
	id: book.id,
	orderInSeries: book.orderInSeries,
	searchMatches: book.searchMatches,
	seriesTitle: book.seriesTitle,
	title: book.title,
});

export const RecommendationSearchMode = ({
	closeSearch,
	initialPrompt,
	onExitMode,
	saveRecentSearch,
}: IRecommendationSearchModeProps) => {
	const [prompt, setPrompt] = useState(initialPrompt);
	const [submittedPrompt, setSubmittedPrompt] = useState("");
	const normalizedPrompt = prompt.trim();
	const queryParams = useMemo<IByPromptRecomendationsParams | null>(
		() =>
			submittedPrompt.trim().length >= MIN_PROMPT_LENGTH
				? { limit: RECOMMENDATION_LIMIT, prompt: submittedPrompt.trim() }
				: null,
		[submittedPrompt],
	);

	const { data, isFetching } = useRecomendationsByPromptQuery(
		queryParams ?? { limit: RECOMMENDATION_LIMIT, prompt: "" },
		{
			enabled: Boolean(queryParams),
		},
	);

	const cards = useMemo(
		() => (data ?? []).map((book) => mapBookToSearchBook(book)),
		[data],
	);

	const handleSubmit = () => {
		const nextPrompt = normalizedPrompt;

		if (nextPrompt.length < MIN_PROMPT_LENGTH) {
			return;
		}

		setSubmittedPrompt(nextPrompt);
		saveRecentSearch(nextPrompt);
	};

	const handleSaveRecentSearch = () => {
		if (submittedPrompt.trim().length < MIN_PROMPT_LENGTH) return;
		saveRecentSearch(submittedPrompt.trim());
	};

	return (
		<RecommendationShell>
			<RecommendationIntro>
				<RecommendationBadge>Recommendation mode</RecommendationBadge>
				<RecommendationTitle>
					Describe your preferences and we will recommend a fitting book.
				</RecommendationTitle>
				<RecommendationText>
					Here you can search by mood, genre, and feeling, not only by title.
				</RecommendationText>
			</RecommendationIntro>

			<PromptRow>
				<PromptField
					aria-label="Preferences for book recommendations"
					placeholder="For example: a cozy detective story with magic and good humor"
					rows={4}
					value={prompt}
					onChange={(event) => setPrompt(event.target.value)}
				/>
				<PromptActions>
					<PromptButton type="button" onClick={handleSubmit}>
						Find a book
					</PromptButton>
					<BackButton type="button" onClick={onExitMode}>
						Back to normal search
					</BackButton>
				</PromptActions>
			</PromptRow>

			{submittedPrompt ? (
				<ResultsSection>
					<ResultsMeta>
						<span>Query</span>
						<strong>{submittedPrompt}</strong>
					</ResultsMeta>

					{isFetching ? (
						<EmptyState>Finding books...</EmptyState>
					) : cards.length > 0 ? (
						<CardsList>
							{cards.map((book) => (
								<BookResultCard
									key={book.id}
									book={book}
									closeSearch={closeSearch}
									query={submittedPrompt}
									saveRecentSearch={handleSaveRecentSearch}
								/>
							))}
						</CardsList>
					) : (
						<EmptyState>
							Nothing found yet. Try refining your request.
						</EmptyState>
					)}
				</ResultsSection>
			) : (
				<PlaceholderBox>
					<PlaceholderText>
						Describe your preferences and we will recommend a fitting book.
					</PlaceholderText>
				</PlaceholderBox>
			)}
		</RecommendationShell>
	);
};

const RecommendationShell = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.22);
	border-radius: 1.15rem;
	background: linear-gradient(
		180deg,
		rgb(255 249 244 / 0.98),
		rgb(242 239 237 / 0.94)
	);
	padding: 1rem;
	box-shadow: 0 1.1rem 2rem rgb(218 142 91 / 0.1);
`;

const RecommendationIntro = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
`;

const RecommendationBadge = styled.span`
	display: inline-flex;
	align-self: flex-start;
	border-radius: 999px;
	background: rgb(218 142 91 / 0.16);
	padding: 0.35rem 0.7rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-transform: uppercase;
`;

const RecommendationTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	font-weight: 600;
	line-height: 1.25;
`;

const RecommendationText = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.92rem;
	line-height: 1.5;
`;

const PromptRow = styled.div`
	display: grid;
	gap: 0.75rem;
`;

const PromptField = styled.textarea`
	width: 100%;
	min-height: 7.5rem;
	resize: vertical;
	border: 0.0625rem solid rgb(218 142 91 / 0.25);
	border-radius: 1rem;
	background: ${theme.colors.surface};
	padding: 0.95rem 1rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.sans};
	font-size: 0.98rem;
	line-height: 1.5;
	outline: none;
	box-shadow: inset 0 0 0 0.0625rem rgb(255 255 255 / 0.45);

	&::placeholder {
		color: ${theme.colors.softForeground};
	}

	&:focus,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		box-shadow: 0 0 0 0.2rem rgb(218 142 91 / 0.18);
	}
`;

const PromptActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem;
`;

const PromptButton = styled.button`
	border: 0;
	border-radius: 999px;
	background: linear-gradient(
		135deg,
		${theme.colors.orangeDark},
		${theme.colors.orangeLight}
	);
	padding: 0.72rem 1.1rem;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.92rem;
	font-weight: 700;
	line-height: 1;
	transition:
		transform 160ms ease,
		box-shadow 160ms ease;
	box-shadow: 0 0.7rem 1.4rem rgb(218 142 91 / 0.18);

	&:hover,
	&:focus-visible {
		outline: none;
		transform: translateY(-0.0625rem);
		box-shadow: 0 0.85rem 1.6rem rgb(218 142 91 / 0.22);
	}
`;

const BackButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.25);
	border-radius: 999px;
	background: transparent;
	padding: 0.72rem 1.1rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.92rem;
	font-weight: 700;
	line-height: 1;
	transition:
		background 160ms ease,
		border-color 160ms ease,
		color 160ms ease;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(218 142 91 / 0.08);
		color: ${theme.colors.bluePrimary};
		outline: none;
	}
`;

const PlaceholderBox = styled.div`
	display: flex;
	min-height: 12rem;
	align-items: center;
	justify-content: center;
	border: 0.0625rem dashed rgb(218 142 91 / 0.3);
	border-radius: 1rem;
	background: rgb(255 255 255 / 0.45);
	padding: 1.25rem;
`;

const PlaceholderText = styled.p`
	max-width: 32rem;
	margin: 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.95rem;
	line-height: 1.55;
	text-align: center;
`;

const ResultsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
`;

const ResultsMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem 0.65rem;
	align-items: baseline;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.88rem;

	strong {
		color: ${theme.colors.foreground};
		font-weight: 700;
	}
`;

const CardsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const EmptyState = styled.div`
	padding: 1rem 0 0.25rem;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.95rem;
	line-height: 1.5;
	text-align: center;
`;
