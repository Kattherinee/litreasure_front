"use client";

import AddIcon from "@mui/icons-material/Add";
import { useMemo, useState } from "react";
import styled from "styled-components";

import { CreateAuthorModal } from "@/components/pages/author/CreateAuthorModal";
import type { IAuthorDetails } from "@/shared/api/authors";
import { useSearchAuthorsQuery } from "@/shared/api/search";
import { theme } from "@/shared/theme";
import { useDebouncedValue } from "@/shared/utils/useDebouncedValue";

export interface ISelectedAuthorOption {
	id: string;
	name: string;
}

interface IAuthorMultiSelectFieldProps {
	label?: string;
	placeholder?: string;
	selectedAuthors: ISelectedAuthorOption[];
	onChange: (authors: ISelectedAuthorOption[]) => void;
	error?: string;
	required?: boolean;
}

export const AuthorMultiSelectField = ({
	label = "Author",
	placeholder = "Start typing author name",
	selectedAuthors,
	onChange,
	error,
	required = false,
}: IAuthorMultiSelectFieldProps) => {
	const [query, setQuery] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const debouncedQuery = useDebouncedValue(query, 250);
	const shouldSearch = debouncedQuery.trim().length >= 2;

	const { data: authorsData, isFetching } = useSearchAuthorsQuery(
		debouncedQuery.trim(),
		1,
		8,
		{ enabled: shouldSearch },
	);

	const selectedIds = useMemo(
		() => new Set(selectedAuthors.map((author) => author.id)),
		[selectedAuthors],
	);

	const suggestions = useMemo(() => {
		const items = authorsData?.items ?? [];
		return items.filter((item) => !selectedIds.has(item.id));
	}, [authorsData?.items, selectedIds]);

	const hasExactMatch = useMemo(() => {
		const target = query.trim().toLowerCase();
		if (!target) return false;
		return (authorsData?.items ?? []).some(
			(item) => item.name.toLowerCase() === target,
		);
	}, [authorsData?.items, query]);

	const addAuthor = (author: ISelectedAuthorOption) => {
		if (selectedIds.has(author.id)) return;
		onChange([...selectedAuthors, author]);
		setQuery("");
	};

	const removeAuthor = (id: string) => {
		onChange(selectedAuthors.filter((author) => author.id !== id));
	};

	return (
		<Root>
			<Label $required={required}>{label}</Label>
			<FieldShell>
				<ChipsRow>
					{selectedAuthors.map((author) => (
						<Chip key={author.id}>
							<span>{author.name}</span>
							<ChipRemoveButton
								aria-label={`Remove author ${author.name}`}
								type="button"
								onClick={() => removeAuthor(author.id)}
							>
								×
							</ChipRemoveButton>
						</Chip>
					))}
					<QueryInput
						placeholder={selectedAuthors.length > 0 ? "" : placeholder}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</ChipsRow>
				{query.trim().length > 0 ? (
					<Suggestions>
						{isFetching ? <HintText>Searching...</HintText> : null}
						{!isFetching &&
						suggestions.length === 0 &&
						debouncedQuery.trim().length >= 2 ? (
							<HintText>No existing authors found.</HintText>
						) : null}
						{suggestions.map((author) => (
							<SuggestionButton
								key={author.id}
								type="button"
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => addAuthor({ id: author.id, name: author.name })}
							>
								{author.name}
							</SuggestionButton>
						))}
						{query.trim().length >= 2 && !hasExactMatch ? (
							<CreateButton
								type="button"
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => setIsCreateOpen(true)}
							>
								<AddIcon aria-hidden="true" />
								<span>Create author “{query.trim()}”</span>
							</CreateButton>
						) : null}
					</Suggestions>
				) : null}
			</FieldShell>
			{error ? <ErrorText role="alert">{error}</ErrorText> : null}

			{isCreateOpen ? (
				<CreateAuthorModal
					onClose={() => setIsCreateOpen(false)}
					onCreated={(author: IAuthorDetails) => {
						addAuthor({ id: author.id, name: author.name });
						setIsCreateOpen(false);
					}}
				/>
			) : null}
		</Root>
	);
};

const Root = styled.label`
	display: grid;
	gap: 0.35rem;
`;

const Label = styled.span<{ $required?: boolean }>`
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;

	&::after {
		content: ${({ $required }) => ($required ? '" *"' : '""')};
		color: ${theme.colors.orangeDark};
	}
`;

const FieldShell = styled.div`
	position: relative;
`;

const ChipsRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
	min-height: 2.75rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.74);
	padding: 0.45rem;
`;

const Chip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.28);
	border-radius: 999px;
	background: rgb(218 142 91 / 0.12);
	padding: 0.28rem 0.42rem 0.28rem 0.62rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.82rem;
	font-weight: 700;
`;

const ChipRemoveButton = styled.button`
	display: inline-flex;
	width: 1.15rem;
	height: 1.15rem;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: rgb(212 100 28 / 0.16);
	color: inherit;
	cursor: pointer;
	font: inherit;
	line-height: 1;
	padding: 0;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
		outline: none;
	}
`;

const QueryInput = styled.input`
	min-width: 8rem;
	flex: 1 1 8rem;
	border: 0;
	background: transparent;
	color: ${theme.colors.foreground};
	font: inherit;
	outline: none;
	padding: 0.28rem;
`;

const Suggestions = styled.div`
	position: absolute;
	z-index: 30;
	top: calc(100% + 0.3rem);
	left: 0;
	right: 0;
	display: grid;
	gap: 0.35rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.24);
	border-radius: 0.75rem;
	background: ${theme.colors.background};
	padding: 0.5rem;
	box-shadow: 0 0.8rem 1.8rem rgb(4 18 26 / 0.12);
`;

const SuggestionButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.2);
	border-radius: 0.6rem;
	background: rgb(242 239 237 / 0.82);
	padding: 0.45rem 0.55rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	text-align: left;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const CreateButton = styled(SuggestionButton)`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	color: ${theme.colors.orangeDark};
	font-weight: 700;
`;

const HintText = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.8rem;
`;

const ErrorText = styled.p`
	margin: 0;
	color: #a03434;
	font-size: 0.86rem;
	line-height: 1.3;
`;
