"use client";

import { useRouter } from "next/navigation";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { CreateAuthorModal } from "@/components/pages/author/CreateAuthorModal";
import { CreateCollectionModal } from "@/components/pages/book-details/CreateCollectionModal";
import { CreateBookModal } from "@/components/pages/my-books/CreateBookModal";
import { CreateSeriesModal } from "@/components/pages/series/CreateSeriesModal";
import { MyBooksBlock } from "@/components/pages/my-treasures/MyBooksBlock";
import { ReadingSummaryBlock } from "@/components/pages/my-treasures/ReadingSummaryBlock";
import { TreasuresTabsBlock } from "@/components/pages/my-treasures/tabs/TreasuresTabsBlock";
import type {
	ICollectionTreasureFilter,
	ITreasureTab,
} from "@/components/pages/my-treasures/types";
import { useMyAuthorsQuery } from "@/shared/api/authors";
import { useBookCardsQuery } from "@/shared/api/books";
import { useChallengesQuery } from "@/shared/api/book-challenge";
import {
	useMyCollectionsQuery,
	useSubscribedCollectionsQuery,
} from "@/shared/api/collections";
import { useMySeriesQuery } from "@/shared/api/series";
import { usePaperBookStatusCountsQuery } from "@/shared/api/paper-books";
import {
	useUserBookStatusCountsQuery,
	useUserBooksQuery,
	type IUserBookStatus,
} from "@/shared/api/user-books";
import { useUserGenresQuery } from "@/shared/api/users";
import { useAuthStore } from "@/shared/store/auth-store";
import { AUTH_STORAGE_KEY, type IAuthSession } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { AppNotification } from "@/shared/ui/AppNotification";

type IMyBooksFilter = IUserBookStatus | "all" | "created";

const MyTreasuresPage = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const hasAuth = Boolean(session) || isAuthenticated;
	const [activeStatus, setActiveStatus] = useState<IMyBooksFilter>("all");
	const [activeCollectionFilter, setActiveCollectionFilter] =
		useState<ICollectionTreasureFilter>("all");
	const [activeTreasureTab, setActiveTreasureTab] =
		useState<ITreasureTab>("collections");
	const [selectedChallengeIndex, setSelectedChallengeIndex] = useState(0);
	const [challengeCanScrollPrev, setChallengeCanScrollPrev] = useState(false);
	const [challengeCanScrollNext, setChallengeCanScrollNext] = useState(false);
	const [selectedReadingIndex, setSelectedReadingIndex] = useState(0);
	const [readingCanScrollPrev, setReadingCanScrollPrev] = useState(false);
	const [readingCanScrollNext, setReadingCanScrollNext] = useState(false);
	const [isCreateBookOpen, setIsCreateBookOpen] = useState(false);
	const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
	const [isCreateAuthorOpen, setIsCreateAuthorOpen] = useState(false);
	const [isCreateSeriesOpen, setIsCreateSeriesOpen] = useState(false);
	const [isAuthHydrated, setIsAuthHydrated] = useState(
		() => useAuthStore.persist?.hasHydrated?.() ?? false,
	);
	const [collectionRailControls, setCollectionRailControls] = useState({
		canScrollNext: false,
		canScrollPrev: false,
		hasOverflow: false,
	});
	const [bookCarouselControls, setBookCarouselControls] = useState<{
		canScrollNext: boolean;
		canScrollPrev: boolean;
		scrollNext: () => void;
		scrollPrev: () => void;
	} | null>(null);
	const [notification, setNotification] = useState<{
		message: string;
		open: boolean;
		severity: "error" | "success";
	}>({ message: "", open: false, severity: "success" });

	const [readingSliderRef, readingSliderApi] = useEmblaCarousel({
		align: "center",
		containScroll: false,
		dragFree: false,
		duration: 30,
		loop: false,
	});
	const [challengeSliderRef, challengeSliderApi] = useEmblaCarousel({
		align: "center",
		containScroll: false,
		dragFree: false,
		duration: 30,
		loop: false,
	});
	const collectionsRailRef = useRef<HTMLDivElement | null>(null);

	const isSessionReady = Boolean(session);
	const activeStatusParam =
		activeStatus === "all" || activeStatus === "created"
			? undefined
			: activeStatus;
	const { data: challenges = [] } = useChallengesQuery({
		enabled: isSessionReady,
	});
	const { data: readingBooksData, isLoading: isReadingBooksLoading } =
		useUserBooksQuery(
			{ limit: 8, status: "reading" },
			{ enabled: isSessionReady },
		);
	const {
		data: userBooksData,
		isError: isUserBooksError,
		isLoading: isUserBooksLoading,
	} = useUserBooksQuery(
		{ limit: 20, status: activeStatusParam },
		{ enabled: isSessionReady && activeStatus !== "created" },
	);
	const {
		data: createdBooksData,
		isError: isCreatedBooksError,
		isLoading: isCreatedBooksLoading,
	} = useBookCardsQuery(
		{ limit: 20, onlyMine: true },
		{ enabled: isSessionReady },
	);
	const { data: statusCounts } = useUserBookStatusCountsQuery({
		enabled: isSessionReady,
	});
	const { data: paperBookCounts } = usePaperBookStatusCountsQuery({
		enabled: isSessionReady,
	});
	const { data: myCollectionsData, isLoading: isMyCollectionsLoading } =
		useMyCollectionsQuery({ limit: 5 }, { enabled: isSessionReady });
	const {
		data: subscribedCollectionsData,
		isLoading: isSubscribedCollectionsLoading,
	} = useSubscribedCollectionsQuery({ limit: 5 }, { enabled: isSessionReady });
	const { data: myAuthorsData, isLoading: isMyAuthorsLoading } =
		useMyAuthorsQuery({ limit: 8 }, { enabled: isSessionReady });
	const { data: mySeriesData } = useMySeriesQuery(
		{ limit: 8 },
		{ enabled: isSessionReady },
	);
	const { data: myGenres = [], isLoading: isMyGenresLoading } =
		useUserGenresQuery(session?.user.id, { enabled: isSessionReady });

	const activeChallenges = challenges
		.filter((challenge) => challenge.isActive)
		.sort(
			(a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
		);
	const activeChallengeIndex = activeChallenges.length
		? Math.min(selectedChallengeIndex, activeChallenges.length - 1)
		: 0;
	const readingBooks = readingBooksData?.items ?? [];
	const readingBooksCount = readingBooks.length;
	const trackedBooks = userBooksData?.items ?? [];
	const createdBooks = createdBooksData?.items ?? [];
	const myCollections = myCollectionsData?.items ?? [];
	const myCollectionsTotal = myCollectionsData?.total ?? 0;
	const subscribedCollections = subscribedCollectionsData?.items ?? [];
	const subscribedCollectionsTotal = subscribedCollectionsData?.total ?? 0;
	const visibleCollections =
		activeCollectionFilter === "created"
			? myCollections
			: activeCollectionFilter === "subscribed"
				? subscribedCollections
				: Array.from(
						new Map(
							[...myCollections, ...subscribedCollections].map((collection) => [
								collection.id,
								collection,
							]),
						).values(),
					);
	const visibleCollectionsTotal =
		activeCollectionFilter === "created"
			? myCollectionsTotal
			: activeCollectionFilter === "subscribed"
				? subscribedCollectionsTotal
				: myCollectionsTotal + subscribedCollectionsTotal;
	const isCollectionsLoading =
		isMyCollectionsLoading || isSubscribedCollectionsLoading;
	const myAuthors = myAuthorsData?.items ?? [];
	const mySeries = mySeriesData?.items ?? [];
	const resourceTabs = [
		{
			id: "authors" as const,
			label: "My authors",
			count: myAuthorsData?.total ?? 0,
		},
		{
			id: "series" as const,
			label: "My series",
			count: mySeriesData?.total ?? 0,
		},
		{ id: "genres" as const, label: "My genres", count: myGenres.length },
		{
			id: "collections" as const,
			label: "My collections",
			count: visibleCollectionsTotal,
		},
		{
			id: "paper-books" as const,
			label: "Paper books",
			count: paperBookCounts?.total ?? 0,
		},
	];
	const shouldShowAllBooksLink =
		(activeStatus === "created"
			? (createdBooksData?.total ?? 0) > createdBooks.length
			: (userBooksData?.total ?? 0) > trackedBooks.length) ||
		(activeStatus === "created" ? createdBooks.length : trackedBooks.length) >
			6;
	const bookCarouselItems =
		activeStatus === "created"
			? createdBooks
			: trackedBooks.map((item) => ({
					...item.book,
					isTracked: true,
					myStatus: item.status,
				}));
	const hasBookCarouselControls = Boolean(
		bookCarouselControls?.canScrollPrev || bookCarouselControls?.canScrollNext,
	);
	const getStatusCount = (status: IUserBookStatus | "all") =>
		status === "all"
			? (statusCounts?.total ?? userBooksData?.total ?? 0)
			: (statusCounts?.[status] ?? 0);

	const updateReadingSliderIndex = useCallback((api: EmblaCarouselType) => {
		setSelectedReadingIndex(api.selectedScrollSnap());
		setReadingCanScrollPrev(api.canScrollPrev());
		setReadingCanScrollNext(api.canScrollNext());
	}, []);
	const updateChallengeSliderIndex = useCallback((api: EmblaCarouselType) => {
		setSelectedChallengeIndex(api.selectedScrollSnap());
		setChallengeCanScrollPrev(api.canScrollPrev());
		setChallengeCanScrollNext(api.canScrollNext());
	}, []);
	const showChallenge = (direction: "next" | "prev") => {
		if (!challengeSliderApi) return;
		if (direction === "next") {
			if (!challengeSliderApi.canScrollNext()) return;
			challengeSliderApi.scrollNext();
			return;
		}
		if (!challengeSliderApi.canScrollPrev()) return;
		challengeSliderApi.scrollPrev();
	};
	const showReadingBook = (direction: "next" | "prev") => {
		if (!readingSliderApi) return;
		if (direction === "next") {
			if (!readingSliderApi.canScrollNext()) return;
			readingSliderApi.scrollNext();
			return;
		}
		if (!readingSliderApi.canScrollPrev()) return;
		readingSliderApi.scrollPrev();
	};

	const updateCollectionRailControls = () => {
		const rail = collectionsRailRef.current;
		if (!rail) {
			setCollectionRailControls({
				canScrollNext: false,
				canScrollPrev: false,
				hasOverflow: false,
			});
			return;
		}
		const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
		const hasOverflow = maxScrollLeft > 1;
		setCollectionRailControls({
			hasOverflow,
			canScrollPrev: hasOverflow && rail.scrollLeft > 1,
			canScrollNext: hasOverflow && rail.scrollLeft < maxScrollLeft - 1,
		});
	};
	const scrollCollectionsRail = (direction: "next" | "prev") => {
		const rail = collectionsRailRef.current;
		if (!rail) return;
		rail.scrollBy({
			behavior: "smooth",
			left:
				direction === "next"
					? rail.clientWidth * 0.82
					: -rail.clientWidth * 0.82,
		});
		window.requestAnimationFrame(updateCollectionRailControls);
		window.setTimeout(updateCollectionRailControls, 260);
	};

	useEffect(() => {
		const persistApi = useAuthStore.persist;
		if (!persistApi) return;
		if (persistApi.hasHydrated()) {
			const frame = window.requestAnimationFrame(() => setIsAuthHydrated(true));
			return () => window.cancelAnimationFrame(frame);
		}
		const unsubHydrate = persistApi.onHydrate(() => setIsAuthHydrated(false));
		const unsubFinish = persistApi.onFinishHydration(() =>
			setIsAuthHydrated(true),
		);
		return () => {
			unsubHydrate();
			unsubFinish();
		};
	}, []);

	useEffect(() => {
		if (!isAuthHydrated || hasAuth) return;
		try {
			const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as {
					state?: { session?: IAuthSession | null };
				};
				const persistedSession = parsed.state?.session;
				if (persistedSession?.user?.email) {
					useAuthStore.getState().setSession(persistedSession);
					return;
				}
			}
		} catch {}
		router.replace("/?auth=required");
	}, [hasAuth, isAuthHydrated, router]);

	useEffect(() => {
		if (!challengeSliderApi) return;
		challengeSliderApi.on("select", updateChallengeSliderIndex);
		challengeSliderApi.on("reInit", updateChallengeSliderIndex);
		const frame = window.requestAnimationFrame(() =>
			updateChallengeSliderIndex(challengeSliderApi),
		);
		return () => {
			window.cancelAnimationFrame(frame);
			challengeSliderApi.off("select", updateChallengeSliderIndex);
			challengeSliderApi.off("reInit", updateChallengeSliderIndex);
		};
	}, [challengeSliderApi, updateChallengeSliderIndex]);

	useEffect(() => {
		if (!readingSliderApi) return;
		readingSliderApi.on("select", updateReadingSliderIndex);
		readingSliderApi.on("reInit", updateReadingSliderIndex);
		const frame = window.requestAnimationFrame(() =>
			updateReadingSliderIndex(readingSliderApi),
		);
		return () => {
			window.cancelAnimationFrame(frame);
			readingSliderApi.off("select", updateReadingSliderIndex);
			readingSliderApi.off("reInit", updateReadingSliderIndex);
		};
	}, [readingSliderApi, updateReadingSliderIndex]);

	useEffect(() => {
		if (!challengeSliderApi) return;
		challengeSliderApi.reInit();
	}, [activeChallenges.length, challengeSliderApi]);

	useEffect(() => {
		if (!readingSliderApi) return;
		readingSliderApi.reInit();
	}, [readingBooksCount, readingSliderApi]);

	useEffect(() => {
		const rail = collectionsRailRef.current;
		if (!rail || activeTreasureTab !== "collections") return;
		const frame = window.requestAnimationFrame(updateCollectionRailControls);
		rail.addEventListener("scroll", updateCollectionRailControls, {
			passive: true,
		});
		return () => {
			window.cancelAnimationFrame(frame);
			rail.removeEventListener("scroll", updateCollectionRailControls);
		};
	}, [
		activeTreasureTab,
		isCollectionsLoading,
		visibleCollections.length,
		visibleCollectionsTotal,
	]);

	if (!isAuthHydrated || !hasAuth || !session) return null;

	return (
		<Page>
			<Content>
				<ReadingSummaryBlock
					activeChallengeIndex={activeChallengeIndex}
					activeChallenges={activeChallenges}
					challengeCanScrollNext={challengeCanScrollNext}
					challengeCanScrollPrev={challengeCanScrollPrev}
					challengeSliderRef={challengeSliderRef}
					isReadingBooksLoading={isReadingBooksLoading}
					readingBooks={readingBooks}
					readingBooksCount={readingBooksCount}
					readingCanScrollNext={readingCanScrollNext}
					readingCanScrollPrev={readingCanScrollPrev}
					readingSliderRef={readingSliderRef}
					selectedReadingIndex={selectedReadingIndex}
					showChallenge={showChallenge}
					showReadingBook={showReadingBook}
				/>
				<MyBooksBlock
					activeStatus={activeStatus}
					bookCarouselControls={bookCarouselControls}
					bookCarouselItems={bookCarouselItems}
					createdBooksCount={createdBooksData?.total ?? 0}
					getStatusCount={getStatusCount}
					hasBookCarouselControls={hasBookCarouselControls}
					isUserBooksError={
						activeStatus === "created" ? isCreatedBooksError : isUserBooksError
					}
					isUserBooksLoading={
						activeStatus === "created"
							? isCreatedBooksLoading
							: isUserBooksLoading
					}
					shouldShowAllBooksLink={shouldShowAllBooksLink}
					onChangeStatus={setActiveStatus}
					onCreateBook={() => setIsCreateBookOpen(true)}
					onControlsChange={setBookCarouselControls}
				/>
				<TreasuresTabsBlock
					activeCollectionFilter={activeCollectionFilter}
					activeTreasureTab={activeTreasureTab}
					collectionRailControls={collectionRailControls}
					collectionsRailRef={collectionsRailRef}
					isCollectionsLoading={isCollectionsLoading}
					isMyAuthorsLoading={isMyAuthorsLoading}
					isMyGenresLoading={isMyGenresLoading}
					myAuthors={myAuthors}
					myGenres={myGenres}
					mySeries={mySeries}
					resourceTabs={resourceTabs}
					visibleCollections={visibleCollections}
					visibleCollectionsTotal={visibleCollectionsTotal}
					onChangeCollectionFilter={setActiveCollectionFilter}
					onChangeTab={setActiveTreasureTab}
					onCreateAuthor={() => setIsCreateAuthorOpen(true)}
					onCreateCollection={() => setIsCreateCollectionOpen(true)}
					onCreateSeries={() => setIsCreateSeriesOpen(true)}
					onOpenCollection={(id) => router.push(`/collections/${id}`)}
					onScrollCollections={scrollCollectionsRail}
				/>

				{isCreateCollectionOpen ? (
					<CreateCollectionModal
						onClose={() => setIsCreateCollectionOpen(false)}
					/>
				) : null}
				{isCreateBookOpen ? (
					<CreateBookModal
						onClose={() => setIsCreateBookOpen(false)}
						onCreated={() => {
							setIsCreateBookOpen(false);
							setNotification({
								message: "Book created successfully.",
								open: true,
								severity: "success",
							});
						}}
						onCreateError={(message) => {
							setNotification({ message, open: true, severity: "error" });
						}}
					/>
				) : null}
				{isCreateAuthorOpen ? (
					<CreateAuthorModal onClose={() => setIsCreateAuthorOpen(false)} />
				) : null}
				{isCreateSeriesOpen ? (
					<CreateSeriesModal onClose={() => setIsCreateSeriesOpen(false)} />
				) : null}
				<AppNotification
					message={notification.message}
					open={notification.open}
					severity={notification.severity}
					onClose={() =>
						setNotification((current) => ({ ...current, open: false }))
					}
				/>
			</Content>
		</Page>
	);
};

export default MyTreasuresPage;

const Page = styled.div`
	min-height: calc(100dvh - 4rem);
	background: ${theme.colors.background};
	padding: 4rem 0 6rem;
`;
const Content = styled.div`
	width: 70vw;
	margin: 0 auto;

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 95vw;
	}
`;
