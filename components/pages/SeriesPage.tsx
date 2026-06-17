"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

import { AuthorAvatar } from "@/shared/ui/AuthorAvatar";
import { BookResultCard } from "@/shared/ui/BookSearch/BookResultCard";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { GenrePill } from "@/shared/ui/GenrePill";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import {
	useDeleteSeriesMutation,
	useSaveSeriesMutation,
	useSeriesQuery,
	useUnsaveSeriesMutation,
	useUpdateSeriesMutation,
} from "@/shared/api/series";

import { SeriesEditModal } from "./series/SeriesEditModal";

interface ISeriesPageProps {
	id: string;
}

const noop = () => {};

const SeriesPage = ({ id }: ISeriesPageProps) => {
	const router = useRouter();
	const currentUserId = useAuthStore((state) => state.session?.user.id);
	const { data: series, error, isError, isLoading } = useSeriesQuery(id);
	const saveSeriesMutation = useSaveSeriesMutation();
	const unsaveSeriesMutation = useUnsaveSeriesMutation();
	const updateSeriesMutation = useUpdateSeriesMutation();
	const deleteSeriesMutation = useDeleteSeriesMutation();
	const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

	const isSeriesSaved = savedOverride ?? series?.isSaved ?? false;
	const isOwner = Boolean(
		series?.authorId && currentUserId && series.authorId === currentUserId,
	);
	const isTogglePending =
		saveSeriesMutation.isPending || unsaveSeriesMutation.isPending;

	const handleToggleSave = async () => {
		if (!series) {
			return;
		}

		const wasSaved = isSeriesSaved;
		setSavedOverride(!wasSaved);

		try {
			if (wasSaved) {
				await unsaveSeriesMutation.mutateAsync(series.id);
			} else {
				await saveSeriesMutation.mutateAsync(series.id);
			}
		} catch {
			setSavedOverride(wasSaved);
		}
	};

	const handleUpdateSeries = async (payload: {
		coverUrl?: string;
		title: string;
	}) => {
		if (!series) {
			return;
		}

		await updateSeriesMutation.mutateAsync({
			id: series.id,
			payload,
		});
		setIsEditOpen(false);
	};

	const handleDeleteSeries = async () => {
		if (!series) {
			return;
		}

		await deleteSeriesMutation.mutateAsync(series.id);
		setIsDeleteConfirmOpen(false);
		router.push("/treasures/series");
	};

	if (isLoading) {
		return (
			<Page>
				<Content>
					<StateMessage>Loading series...</StateMessage>
				</Content>
			</Page>
		);
	}

	if (isError) {
		return (
			<Page>
				<Content>
					<StateMessage>Failed to load series: {error.message}</StateMessage>
				</Content>
			</Page>
		);
	}

	if (!series) {
		return (
			<Page>
				<Content>
					<StateMessage>Series not found.</StateMessage>
				</Content>
			</Page>
		);
	}

	return (
		<Page>
			<Content>
				<BackLink href="/treasures">My treasures</BackLink>
				<Hero>
					<SeriesCover $coverUrl={series.coverUrl} aria-hidden="true" />
					<HeroCopy>
						<Eyebrow>Series</Eyebrow>
						<TitleRow>
							<Title>{series.title}</Title>
							<TitleActions>
								{isSeriesSaved ? (
									<SavedActionButton
										aria-label="Remove series from saved"
										disabled={isTogglePending}
										type="button"
										onClick={() => void handleToggleSave()}
									>
										<span aria-hidden="true">🔖</span>
										<span>{isTogglePending ? "Saving..." : "Subscribed"}</span>
									</SavedActionButton>
								) : (
									<SaveActionButton
										disabled={isTogglePending}
										type="button"
										onClick={() => void handleToggleSave()}
									>
										{isTogglePending ? "Saving..." : "Subscribe"}
									</SaveActionButton>
								)}

								{isOwner ? (
									<OwnerActions aria-label="Actions for your series">
										<OwnerActionButton
											type="button"
											onClick={() => setIsEditOpen(true)}
										>
											Edit
										</OwnerActionButton>
										<DangerActionButton
											disabled={deleteSeriesMutation.isPending}
											type="button"
											onClick={() => setIsDeleteConfirmOpen(true)}
										>
											Delete
										</DangerActionButton>
									</OwnerActions>
								) : null}
							</TitleActions>
						</TitleRow>

						{series.authorName ? (
							<AuthorLine>
								<AuthorAvatar
									fontSize="0.8rem"
									name={series.authorName}
									photoUrl={series.authorPhotoUrl}
									size="2rem"
								/>
								{series.authorId ? (
									<AuthorLink href={`/authors/${series.authorId}`}>
										{series.authorName}
									</AuthorLink>
								) : (
									<AuthorName>{series.authorName}</AuthorName>
								)}
							</AuthorLine>
						) : null}

						<MetaRow>
							<MetaItem>
								<MetaValue>{series.bookCount ?? series.books.length}</MetaValue>
								<MetaLabel>books in series</MetaLabel>
							</MetaItem>
						</MetaRow>

						{series.genres.length > 0 ? (
							<GenreList>
								{series.genres.map((genre) => (
									<GenrePill
										key={genre.id}
										fontSize="0.86rem"
										height="2rem"
										paddingBlock="0.42rem"
										paddingInline="0.78rem"
										href={`/genres/${genre.slug}`}
									>
										{genre.name}
									</GenrePill>
								))}
							</GenreList>
						) : null}

						{series.description ? (
							<Description>{series.description}</Description>
						) : null}
					</HeroCopy>
				</Hero>

				<Section>
					<SectionTitle>Series books</SectionTitle>
					{series.books.length > 0 ? (
						<BookList>
							{series.books.map((book) => (
								<BookResultCard
									key={book.id}
									book={book}
									closeSearch={noop}
									query=""
									saveRecentSearch={noop}
								/>
							))}
						</BookList>
					) : (
						<StateMessage>No books in this series yet.</StateMessage>
					)}
				</Section>
			</Content>

			{isEditOpen ? (
				<SeriesEditModal
					books={series.books.map((book) => ({
						id: book.id,
						title: book.title,
					}))}
					coverUrl={series.coverUrl}
					isSaving={updateSeriesMutation.isPending}
					title={series.title}
					onClose={() => setIsEditOpen(false)}
					onSave={(payload) => void handleUpdateSeries(payload)}
				/>
			) : null}

			{isDeleteConfirmOpen ? (
				<ConfirmModal
					confirmLabel="Delete"
					confirmLoadingLabel="Deleting..."
					isLoading={deleteSeriesMutation.isPending}
					title="Delete series?"
					onCancel={() => setIsDeleteConfirmOpen(false)}
					onConfirm={() => void handleDeleteSeries()}
				>
					This series will be removed from your library and links to it will no
					longer be available.
				</ConfirmModal>
			) : null}
		</Page>
	);
};

export default SeriesPage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding: clamp(3rem, 5vw, 4.5rem) clamp(1.5rem, 2.78vw, 2.5rem);
`;

const Content = styled.section`
	width: min(65rem, 100%);
	margin: 0 auto;
`;

const BackLink = styled(Link)`
	display: inline-flex;
	margin-bottom: 1.5rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.9375rem;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.bluePrimary};
		outline: none;
	}
`;

const Hero = styled.section`
	display: grid;
	align-items: center;
	gap: clamp(1.2rem, 3vw, 2.2rem);
	grid-template-columns: minmax(8rem, 10rem) minmax(0, 1fr);
	border: 0.0625rem solid rgb(218 142 91 / 0.15);
	border-radius: 1.25rem;
	background: rgb(242 239 237 / 0.78);
	padding: clamp(1.15rem, 2.45vw, 2rem);

	@media (max-width: 42rem) {
		grid-template-columns: 1fr;
	}
`;

const SeriesCover = styled.div<{ $coverUrl?: string }>`
	width: min(100%, 10rem);
	aspect-ratio: 2 / 3;
	border-radius: 0.75rem;
	background:
		linear-gradient(rgb(4 18 26 / 0.08), rgb(4 18 26 / 0.08)),
		url("${({ $coverUrl }) => $coverUrl || "/images/book-placeholder.svg"}")
			center / cover;
	box-shadow: 0 1rem 2rem rgb(4 18 26 / 0.14);
`;

const HeroCopy = styled.div`
	min-width: 0;
`;

const Eyebrow = styled.p`
	margin: 0 0 0.35rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	flex-wrap: wrap;
`;

const Title = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(1.85rem, 3.1vw, 3rem);
	font-weight: 600;
	line-height: 1;
`;

const TitleActions = styled.div`
	display: flex;
	flex: 0 0 auto;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 0.65rem;
`;

const SaveActionButton = styled.button`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border: 0.0625rem solid ${theme.colors.orangeLight};
	border-radius: 999rem;
	background: ${theme.colors.orangeLight};
	padding: 0.68rem 1.15rem;
	box-shadow: 0 0.55rem 1.15rem rgb(218 142 91 / 0.18);
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1.2;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeDark};
		border-color: ${theme.colors.orangeDark};
		outline: none;
	}

	&:disabled {
		cursor: progress;
		opacity: 0.72;
	}
`;

const SavedActionButton = styled.button`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.6);
	border-radius: 999rem;
	background: rgb(255 255 255 / 0.78);
	padding: 0.68rem 1.15rem;
	box-shadow: 0 0.45rem 0.9rem rgb(218 142 91 / 0.12);
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1.2;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.2);
		color: ${theme.colors.orangeDark};
		outline: none;
		transform: translateY(-0.0625rem);
	}

	&:disabled {
		cursor: progress;
		opacity: 0.72;
		transform: none;
	}
`;

const OwnerActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem;
`;

const OwnerActionButton = styled.button`
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.68);
	padding: 0.58rem 0.95rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const DangerActionButton = styled(OwnerActionButton)`
	border-color: rgb(199 83 83 / 0.5);
	color: #a43b3b;

	&:hover,
	&:focus-visible {
		border-color: rgb(199 83 83 / 0.8);
		color: #8f2d2d;
	}
`;

const AuthorLine = styled.div`
	display: flex;
	align-items: center;
	gap: 0.55rem;
	margin-top: 0.8rem;
`;

const AuthorLink = styled(Link)`
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.95rem;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const AuthorName = styled.span`
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.95rem;
`;

const MetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 1.1rem;
`;

const MetaItem = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 0.45rem;
	border-radius: 999px;
	background: rgb(255 255 255 / 0.55);
	padding: 0.45rem 0.75rem;
`;

const MetaValue = styled.span`
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	font-weight: 700;
	line-height: 1;
`;

const MetaLabel = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.82rem;
`;

const GenreList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.55rem;
	margin-top: 1rem;
`;

const Description = styled.p`
	max-width: 44rem;
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.5;
`;

const Section = styled.section`
	margin-top: 1.5rem;
`;

const SectionTitle = styled.h2`
	margin: 0 0 0.85rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.45rem;
	line-height: 1.15;
`;

const BookList = styled.div`
	display: grid;
	gap: 0.35rem;
	border-radius: 1rem;
	background: rgb(255 255 255 / 0.35);
	padding: 0.45rem;
`;

const StateMessage = styled.p`
	margin: 2.5rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
`;
