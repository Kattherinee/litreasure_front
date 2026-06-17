"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { CollectionRow } from "@/components/pages/ColectionsPage/CollectionsRow";
import { CreateCollectionModal } from "@/components/pages/book-details/CreateCollectionModal";
import {
	useMyCollectionsQuery,
	useSubscribedCollectionsQuery,
} from "@/shared/api/collections";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { AppPagination } from "@/shared/ui/AppPagination";
import { Button } from "@/shared/ui/Button";
import { PageHero } from "@/shared/ui/PageHero";
import { SkeletonBlock } from "@/shared/ui/Skeleton";

const PAGE_SIZE = 27;

const MyCollectionsPage = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);
	const [createdPage, setCreatedPage] = useState(1);
	const [subscribedPage, setSubscribedPage] = useState(1);
	const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
	const {
		data: createdData,
		error: createdError,
		isError: isCreatedError,
		isLoading: isCreatedLoading,
	} = useMyCollectionsQuery(
		{ limit: PAGE_SIZE, page: createdPage },
		{ enabled: Boolean(session) },
	);
	const {
		data: subscribedData,
		error: subscribedError,
		isError: isSubscribedError,
		isLoading: isSubscribedLoading,
	} = useSubscribedCollectionsQuery(
		{ limit: PAGE_SIZE, page: subscribedPage },
		{ enabled: Boolean(session) },
	);
	const createdCollections = createdData?.items ?? [];
	const subscribedCollections = subscribedData?.items ?? [];
	const createdPages = createdData?.pages ?? 1;
	const subscribedPages = subscribedData?.pages ?? 1;
	const createdTotal = createdData?.total ?? 0;
	const subscribedTotal = subscribedData?.total ?? 0;

	useEffect(() => {
		if (!session) {
			router.replace("/?auth=required");
		}
	}, [router, session]);

	if (!session) {
		return null;
	}

	return (
		<Page>
			<PageHero
				actionLabel="Create collection"
				copyWidth={`min(calc(100% - (${theme.layout.contentGutter} * 2)), ${theme.layout.collectionsPageMaxWidth})`}
				text="Shelves you created are shown separately from collections you follow."
				title="My collections"
				onAction={() => setIsCreateCollectionOpen(true)}
			/>

			<Content>
				<CollectionsSection
					action={
						createdCollections.length === 0 ? (
							<Button
								buttonType="containedInverted"
								type="button"
								onClick={() => setIsCreateCollectionOpen(true)}
							>
								Create collection
							</Button>
						) : undefined
					}
					emptyText="Create your first collection for favorite books, moods, and future shelves."
					emptyTitle="No created collections yet"
					error={createdError}
					isError={isCreatedError}
					isLoading={isCreatedLoading}
					page={createdPage}
					pages={createdPages}
					title="Created by me"
					total={createdTotal}
					onPageChange={setCreatedPage}
				>
					{createdCollections.map((collection) => (
						<CollectionRow
							key={collection.id}
							collection={collection}
							showSaveButton={false}
							onAuthRequired={() => undefined}
						/>
					))}
				</CollectionsSection>

				<CollectionsSection
					emptyText="Follow public collections to quickly return to them without adding every book to your library."
					emptyTitle="No subscriptions yet"
					error={subscribedError}
					isError={isSubscribedError}
					isLoading={isSubscribedLoading}
					page={subscribedPage}
					pages={subscribedPages}
					title="Subscriptions"
					total={subscribedTotal}
					onPageChange={setSubscribedPage}
				>
					{subscribedCollections.map((collection) => (
						<CollectionRow
							key={collection.id}
							collection={collection}
							showSaveButton={false}
							onAuthRequired={() => undefined}
						/>
					))}
				</CollectionsSection>
			</Content>

			{isCreateCollectionOpen ? (
				<CreateCollectionModal
					onClose={() => setIsCreateCollectionOpen(false)}
				/>
			) : null}
		</Page>
	);
};

export default MyCollectionsPage;

interface ICollectionsSectionProps {
	action?: React.ReactNode;
	children: React.ReactNode;
	emptyText: string;
	emptyTitle: string;
	error: Error | null;
	isError: boolean;
	isLoading: boolean;
	page: number;
	pages: number;
	title: string;
	total: number;
	onPageChange: (page: number) => void;
}

const CollectionsSection = ({
	action,
	children,
	emptyText,
	emptyTitle,
	error,
	isError,
	isLoading,
	page,
	pages,
	title,
	total,
	onPageChange,
}: ICollectionsSectionProps) => (
	<Section>
		<SectionHeader>
			<SectionTitle>{title}</SectionTitle>
			<SectionSummary>
				{total} total{pages > 1 ? `. Page ${page} of ${pages}.` : ""}
			</SectionSummary>
		</SectionHeader>
		{isLoading ? (
			<CollectionList aria-label={`Loading: ${title}`}>
				{Array.from({ length: 4 }, (_, index) => (
					<CollectionSkeleton key={index} />
				))}
			</CollectionList>
		) : isError ? (
			<StateMessage>
				Failed to load collections: {error?.message ?? "request error"}
			</StateMessage>
		) : total === 0 ? (
			<EmptyState>
				<EmptyTitle>{emptyTitle}</EmptyTitle>
				<EmptyText>{emptyText}</EmptyText>
				{action}
			</EmptyState>
		) : (
			<>
				<CollectionList>{children}</CollectionList>
				{pages > 1 ? (
					<AppPagination count={pages} page={page} onChange={onPageChange} />
				) : null}
			</>
		)}
	</Section>
);

const CollectionSkeleton = () => (
	<SkeletonRow aria-hidden="true">
		<SkeletonCopy>
			<SkeletonBlock $height="1.25rem" $width="min(100%, 22rem)" />
			<SkeletonBlock $height="1rem" $width="7rem" />
			<SkeletonBlock $height="1.75rem" $radius="50px" $width="7rem" />
		</SkeletonCopy>
		<SkeletonPreview>
			{Array.from({ length: 5 }, (_, index) => (
				<SkeletonBlock
					key={index}
					$height="5rem"
					$radius="0.625rem"
					$width="3.75rem"
				/>
			))}
		</SkeletonPreview>
	</SkeletonRow>
);

const Page = styled.div`
	min-height: 100dvh;
	background:
		radial-gradient(
			circle at 88% 12%,
			${theme.alpha.orangeGlow},
			${theme.colors.transparent} 26%
		),
		linear-gradient(
			180deg,
			${theme.colors.backgroundTop} 0%,
			${theme.colors.background} 100%
		);
	padding-bottom: clamp(3rem, 5vw, 4.5rem);
`;

const Content = styled.section`
	width: min(
		calc(100% - (${theme.layout.contentGutter} * 2)),
		${theme.layout.collectionsPageMaxWidth}
	);
	margin: 0 auto;
	padding-top: clamp(2.5rem, 5vw, 4rem);

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: calc(100% - 2rem);
		padding-top: 1.5rem;
	}
`;

const Section = styled.section`
	& + & {
		margin-top: 2rem;
	}
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
	}
`;

const SectionTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.75rem;
	font-weight: 600;
	line-height: 1.1;
`;

const SectionSummary = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.4;

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 0.84rem;
	}
`;

const CollectionList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
`;

const StateMessage = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;

const EmptyState = styled.section`
	border: 0.0625rem dashed ${theme.colors.border};
	border-radius: 1rem;
	background: rgb(255 255 255 / 0.54);
	padding: 1.5rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding: 1rem;
	}
`;

const EmptyTitle = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.5rem;
	line-height: 1.15;
`;

const EmptyText = styled.p`
	max-width: 36rem;
	margin: 0.5rem 0 1rem;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;

const SkeletonRow = styled.article`
	display: flex;
	min-height: 7.5rem;
	align-items: center;
	justify-content: space-between;
	gap: 3.75rem;
	border-radius: 1rem;
	background: ${theme.colors.white};
	padding: 1.25rem;

	@media (max-width: 42rem) {
		flex-direction: column;
		align-items: stretch;
	}
`;

const SkeletonCopy = styled.div`
	display: flex;
	flex: 1 1 22.375rem;
	min-width: 0;
	max-width: 22.375rem;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.32vw;
`;

const SkeletonPreview = styled.div`
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
`;
