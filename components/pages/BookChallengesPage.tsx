"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Fragment,
	type FormEvent,
	useCallback,
	useEffect,
	useState,
} from "react";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import styled from "styled-components";

import {
	type IBookChallenge,
	type IChallengePeriodType,
	type IChallengeType,
	type ICreateBookChallengePayload,
	useChallengesQuery,
	useCreateChallengeMutation,
	useDeleteChallengeMutation,
	useUpdateChallengeMutation,
} from "@/shared/api/book-challenge";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";
import { DateField } from "@/shared/ui/DateField";

const periodOptions: Array<{ label: string; value: IChallengePeriodType }> = [
	{ label: "Week", value: "week" },
	{ label: "Month", value: "month" },
	{ label: "Year", value: "year" },
];

const typeOptions: Array<{
	label: string;
	unit: string;
	value: IChallengeType;
}> = [
	{ label: "Books", unit: "books", value: "books" },
	{ label: "Pages", unit: "pages", value: "pages" },
];

interface IChallengeFormState {
	type: IChallengeType;
	periodType: IChallengePeriodType;
	targetValue: string;
	startDate: string;
	endDate: string;
	isActive: boolean;
}

type IChallengeModalMode = "create" | "edit";

const getDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultEndDate = (
	periodType: IChallengePeriodType,
	startDate: string,
) => {
	const endDate = new Date(`${startDate}T00:00:00`);

	if (periodType === "week") {
		endDate.setDate(endDate.getDate() + 6);
	} else if (periodType === "month") {
		endDate.setMonth(endDate.getMonth() + 1);
		endDate.setDate(endDate.getDate() - 1);
	} else {
		endDate.setFullYear(endDate.getFullYear() + 1);
		endDate.setDate(endDate.getDate() - 1);
	}

	return getDateInputValue(endDate);
};

const createDefaultForm = (): IChallengeFormState => {
	const startDate = getDateInputValue(new Date());

	return {
		endDate: getDefaultEndDate("year", startDate),
		isActive: true,
		periodType: "year",
		startDate,
		targetValue: "24",
		type: "books",
	};
};

const getFormFromChallenge = (
	challenge: IBookChallenge,
): IChallengeFormState => ({
	endDate: challenge.endDate.slice(0, 10),
	isActive: challenge.isActive,
	periodType: challenge.periodType,
	startDate: challenge.startDate.slice(0, 10),
	targetValue: String(challenge.targetValue),
	type: challenge.type,
});

const getPayload = (
	form: IChallengeFormState,
): ICreateBookChallengePayload => ({
	endDate: form.endDate,
	isActive: form.isActive,
	periodType: form.periodType,
	startDate: form.startDate,
	targetValue: Math.max(1, Math.round(Number(form.targetValue) || 1)),
	type: form.type,
});

const getPeriodLabel = (period: IChallengePeriodType) =>
	periodOptions.find((option) => option.value === period)?.label ?? period;

const getTypeOption = (type: IChallengeType) =>
	typeOptions.find((option) => option.value === type) ?? typeOptions[0];

const clampPercent = (value?: number) =>
	Math.max(
		0,
		Math.min(100, Number.isFinite(value ?? NaN) ? (value as number) : 0),
	);

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));

const getLocalDate = (value: string) =>
	new Date(`${value.slice(0, 10)}T00:00:00`);

const addDays = (date: Date, days: number) => {
	const nextDate = new Date(date);
	nextDate.setDate(nextDate.getDate() + days);

	return nextDate;
};

const addMonths = (date: Date, months: number) => {
	const nextDate = new Date(date);
	nextDate.setMonth(nextDate.getMonth() + months);

	return nextDate;
};

const getInclusiveDays = (startDate: Date, endDate: Date) =>
	Math.max(
		1,
		Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1,
	);

const getOverlapDays = (startA: Date, endA: Date, startB: Date, endB: Date) => {
	const overlapStart = startA > startB ? startA : startB;
	const overlapEnd = endA < endB ? endA : endB;

	if (overlapEnd < overlapStart) {
		return 0;
	}

	return getInclusiveDays(overlapStart, overlapEnd);
};

interface IChallengeTimelinePoint {
	actual: number | null;
	actualSegment: number | null;
	endDate: Date;
	label: string;
	startDate: Date;
	targetSegment: number;
	target: number;
}

type IPlanGranularity = "day" | "week" | "month";

interface IChallengePlanRange {
	endDate: Date;
	label: string;
	startDate: Date;
}

const getDefaultPlanGranularity = (
	periodType: IChallengePeriodType,
): IPlanGranularity =>
	periodType === "year" ? "month" : periodType === "month" ? "week" : "day";

const getNextPlanGranularity = (
	granularity: IPlanGranularity,
): IPlanGranularity | null =>
	granularity === "month" ? "week" : granularity === "week" ? "day" : null;

const getPlanGranularityLabel = (granularity: IPlanGranularity) =>
	granularity === "month"
		? "by month"
		: granularity === "week"
			? "by week"
			: "by day";

const formatPlanMonth = (date: Date) =>
	new Intl.DateTimeFormat("ru-RU", {
		month: "2-digit",
		year: "2-digit",
	}).format(date);

const formatPlanDay = (date: Date) =>
	new Intl.DateTimeFormat("ru-RU", {
		day: "2-digit",
		month: "2-digit",
	}).format(date);

const formatPlanWeek = (startDate: Date, endDate: Date) =>
	`${formatPlanDay(startDate)}-${formatPlanDay(endDate)}`;

const formatPlanAmount = (value: number) => {
	const rounded = Math.round(value * 10) / 10;

	return Number.isInteger(rounded)
		? String(rounded)
		: rounded.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
};

const createPlanSegments = (
	rangeStartDate: Date,
	rangeEndDate: Date,
	granularity: IPlanGranularity,
) => {
	const totalRangeDays = getInclusiveDays(rangeStartDate, rangeEndDate);

	if (granularity === "day") {
		return Array.from({ length: totalRangeDays }, (_, index) => {
			const date = addDays(rangeStartDate, index);

			return {
				endDate: date,
				label: formatPlanDay(date),
				startDate: date,
			};
		});
	}

	if (granularity === "week") {
		const segments = [];

		for (let offset = 0; offset < totalRangeDays; offset += 7) {
			const segmentStart = addDays(rangeStartDate, offset);
			const segmentEnd = addDays(
				rangeStartDate,
				Math.min(offset + 6, totalRangeDays - 1),
			);

			segments.push({
				endDate: segmentEnd,
				label: formatPlanWeek(segmentStart, segmentEnd),
				startDate: segmentStart,
			});
		}

		return segments;
	}

	const segments = [];
	let cursor = rangeStartDate;

	while (cursor <= rangeEndDate) {
		const nextMonth = addMonths(cursor, 1);
		const segmentEnd = addDays(
			nextMonth > rangeEndDate ? addDays(rangeEndDate, 1) : nextMonth,
			-1,
		);

		segments.push({
			endDate: segmentEnd,
			label: formatPlanMonth(cursor),
			startDate: cursor,
		});

		cursor = addDays(segmentEnd, 1);
	}

	return segments;
};

const getChallengeTimelinePoints = (
	challenge: IBookChallenge,
	granularity = getDefaultPlanGranularity(challenge.periodType),
	range?: IChallengePlanRange | null,
): IChallengeTimelinePoint[] => {
	const startDate = getLocalDate(challenge.startDate);
	const endDate = getLocalDate(challenge.endDate);
	const totalDays =
		challenge.progress?.time.totalDays ?? getInclusiveDays(startDate, endDate);
	const elapsedDays = Math.min(
		totalDays,
		Math.max(0, challenge.progress?.time.elapsedDays ?? 0),
	);
	const targetValue = challenge.progress?.value.target ?? challenge.targetValue;
	const currentValue = challenge.progress?.value.current ?? 0;
	const rangeStartDate = range?.startDate ?? startDate;
	const rangeEndDate = range?.endDate ?? endDate;
	const rangeTotalDays = getInclusiveDays(rangeStartDate, rangeEndDate);
	const rangeElapsedDays = Math.min(
		rangeTotalDays,
		getOverlapDays(
			rangeStartDate,
			rangeEndDate,
			startDate,
			addDays(startDate, Math.max(0, elapsedDays - 1)),
		),
	);
	const segments = createPlanSegments(
		rangeStartDate,
		rangeEndDate,
		granularity,
	);
	let remainingTarget = targetValue;
	let remainingSegments = Math.max(1, segments.length);

	return segments.map((segment) => {
		const daysBeforeSegment = Math.max(
			0,
			getInclusiveDays(rangeStartDate, segment.startDate) - 1,
		);
		const daysThroughSegment = Math.min(
			rangeTotalDays,
			getInclusiveDays(rangeStartDate, segment.endDate),
		);
		const targetSegment = remainingTarget / remainingSegments;
		const actualStart =
			rangeElapsedDays <= 0
				? null
				: Math.round(
						(currentValue * Math.min(daysBeforeSegment, rangeElapsedDays)) /
							rangeElapsedDays,
					);
		const actual =
			rangeElapsedDays <= 0 || daysBeforeSegment >= rangeElapsedDays
				? null
				: Math.round(
						(currentValue * Math.min(daysThroughSegment, rangeElapsedDays)) /
							rangeElapsedDays,
					);
		const actualSegment =
			actual === null ? 0 : Math.max(0, actual - (actualStart ?? 0));
		const remainingAfterActual = Math.max(0, remainingTarget - actualSegment);

		remainingTarget = remainingAfterActual;
		remainingSegments = Math.max(1, remainingSegments - 1);

		return {
			actual,
			actualSegment,
			endDate: segment.endDate,
			label: segment.label,
			startDate: segment.startDate,
			target: targetValue,
			targetSegment,
		};
	});
};

const BookChallengesPage = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);
	const isSessionReady = Boolean(session);
	const {
		data: challenges = [],
		isError,
		isLoading,
	} = useChallengesQuery({
		enabled: isSessionReady,
	});
	const createMutation = useCreateChallengeMutation();
	const updateMutation = useUpdateChallengeMutation();
	const deleteMutation = useDeleteChallengeMutation();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [modalMode, setModalMode] = useState<IChallengeModalMode | null>(null);
	const [form, setForm] = useState<IChallengeFormState>(() =>
		createDefaultForm(),
	);
	const [challengeSliderRef, challengeSliderApi] = useEmblaCarousel({
		align: "center",
		containScroll: false,
		dragFree: false,
		loop: false,
		skipSnaps: false,
	});
	const [canScrollChallengesNext, setCanScrollChallengesNext] = useState(false);
	const [canScrollChallengesPrev, setCanScrollChallengesPrev] = useState(false);
	const isMutating =
		createMutation.isPending ||
		updateMutation.isPending ||
		deleteMutation.isPending;
	const activeIndex = challenges.length
		? Math.min(selectedIndex, challenges.length - 1)
		: 0;
	const selectedChallenge = challenges[activeIndex] ?? null;

	useEffect(() => {
		if (!session) {
			router.replace("/?auth=required");
		}
	}, [router, session]);

	const syncChallengeSlider = useCallback((api: EmblaCarouselType) => {
		setSelectedIndex(api.selectedScrollSnap());
		setCanScrollChallengesPrev(api.canScrollPrev());
		setCanScrollChallengesNext(api.canScrollNext());
	}, []);

	useEffect(() => {
		if (!challengeSliderApi) return;

		challengeSliderApi.on("select", syncChallengeSlider);
		challengeSliderApi.on("reInit", syncChallengeSlider);

		return () => {
			challengeSliderApi.off("select", syncChallengeSlider);
			challengeSliderApi.off("reInit", syncChallengeSlider);
		};
	}, [challengeSliderApi, syncChallengeSlider]);

	useEffect(() => {
		if (!challengeSliderApi || !challenges.length) return;

		challengeSliderApi.reInit();
		const frame = requestAnimationFrame(() => {
			syncChallengeSlider(challengeSliderApi);
		});

		return () => cancelAnimationFrame(frame);
	}, [challengeSliderApi, challenges.length, syncChallengeSlider]);

	if (!session) return null;

	const openCreateModal = () => {
		setForm(createDefaultForm());
		setModalMode("create");
	};

	const openEditModal = (challenge: IBookChallenge) => {
		setForm(getFormFromChallenge(challenge));
		setModalMode("edit");
	};

	const closeModal = () => setModalMode(null);

	const handlePeriodChange = (periodType: IChallengePeriodType) => {
		setForm((current) => ({
			...current,
			endDate: getDefaultEndDate(periodType, current.startDate),
			periodType,
		}));
	};

	const handleStartDateChange = (startDate: string) => {
		setForm((current) => ({
			...current,
			endDate: getDefaultEndDate(current.periodType, startDate),
			startDate,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (modalMode === "edit" && selectedChallenge) {
			updateMutation.mutate(
				{ id: selectedChallenge.id, payload: getPayload(form) },
				{ onSuccess: closeModal },
			);
			return;
		}

		createMutation.mutate(getPayload(form), {
			onSuccess: () => {
				closeModal();
				setSelectedIndex(0);
				challengeSliderApi?.scrollTo(0);
			},
		});
	};

	const handleDelete = () => {
		if (!selectedChallenge) return;

		deleteMutation.mutate(selectedChallenge.id, {
			onSuccess: closeModal,
		});
	};

	const handleActivate = () => {
		if (!selectedChallenge) return;

		updateMutation.mutate({
			id: selectedChallenge.id,
			payload: { isActive: true },
		});
	};

	const goToPrev = () => challengeSliderApi?.scrollPrev();

	const goToNext = () => challengeSliderApi?.scrollNext();

	const selectChallenge = (index: number) => {
		setSelectedIndex(index);
		challengeSliderApi?.scrollTo(index);
	};

	return (
		<Page>
			<Content>
				<Hero>
					<HeroTop></HeroTop>
					<Title>Book challenges</Title>
					<Lead>
						Track goals for books and pages: reading progress and time are shown
						together so you can see not only what is left, but also your pace.
					</Lead>
					<NewButton type="button" onClick={openCreateModal}>
						New challenge
					</NewButton>
				</Hero>

				{isLoading ? (
					<StateMessage>Loading challenges...</StateMessage>
				) : isError ? (
					<StateMessage>Failed to load book challenges.</StateMessage>
				) : challenges.length > 0 && selectedChallenge ? (
					<>
						<ChallengeWorkspace>
							<CarouselStage>
								{canScrollChallengesPrev ? (
									<ArrowButton
										$side="prev"
										type="button"
										aria-label="Previous challenge"
										onClick={goToPrev}
									>
										‹
									</ArrowButton>
								) : null}
								<ChallengeViewport ref={challengeSliderRef}>
									<ChallengeTrack>
										{challenges.map((challenge, index) => (
											<ChallengeSlide
												key={challenge.id}
												$isActive={index === activeIndex}
												$hasPreview={challenges.length > 1}
											>
												<ChallengeSpotlight
													challenge={challenge}
													isMutating={isMutating}
													onActivate={handleActivate}
													onEdit={() => openEditModal(challenge)}
												/>
											</ChallengeSlide>
										))}
									</ChallengeTrack>
								</ChallengeViewport>
								{canScrollChallengesNext ? (
									<ArrowButton
										$side="next"
										type="button"
										aria-label="Next challenge"
										onClick={goToNext}
									>
										›
									</ArrowButton>
								) : null}
							</CarouselStage>

							{challenges.length > 1 ? (
								<CarouselDots aria-label="Challenge selection">
									{challenges.map((challenge, index) => (
										<DotButton
											key={challenge.id}
											type="button"
											$isActive={index === activeIndex}
											aria-label={`Show challenge ${index + 1}`}
											onClick={() => selectChallenge(index)}
										/>
									))}
								</CarouselDots>
							) : null}
						</ChallengeWorkspace>

						<GraphsPanel>
							<ChallengeDetails challenge={selectedChallenge} />
						</GraphsPanel>
					</>
				) : (
					<EmptyState>
						<EmptyTitle>No book challenges yet</EmptyTitle>
						<EmptyText>
							Create your first challenge and choose a goal: period, goal type,
							and the number you want to reach.
						</EmptyText>
						<Button
							buttonType="containedInverted"
							type="button"
							onClick={openCreateModal}
						>
							Create challenge
						</Button>
					</EmptyState>
				)}
			</Content>

			{modalMode ? (
				<ChallengeModal
					form={form}
					isMutating={isMutating}
					mode={modalMode}
					selectedChallenge={selectedChallenge}
					onClose={closeModal}
					onDelete={handleDelete}
					onPeriodChange={handlePeriodChange}
					onStartDateChange={handleStartDateChange}
					onSubmit={handleSubmit}
					onUpdateForm={setForm}
				/>
			) : null}
		</Page>
	);
};

export default BookChallengesPage;

const ChallengeSpotlight = ({
	challenge,
	isMutating,
	onActivate,
	onEdit,
}: {
	challenge: IBookChallenge;
	isMutating: boolean;
	onActivate: () => void;
	onEdit: () => void;
}) => {
	const valuePercent = clampPercent(challenge.progress?.value.percent);
	const timePercent = clampPercent(challenge.progress?.time.percent);
	const typeOption = getTypeOption(challenge.type);
	const currentValue = challenge.progress?.value.current ?? 0;
	const targetValue = challenge.progress?.value.target ?? challenge.targetValue;
	const remainingValue = challenge.progress?.value.remaining ?? targetValue;
	const elapsedDays = challenge.progress?.time.elapsedDays ?? 0;

	return (
		<SpotlightCard>
			<EditSpotlightButton type="button" onClick={onEdit}>
				Edit
			</EditSpotlightButton>
			<RingColumn>
				<RingProgress
					color="#da8e5b"
					label="goal"
					value={valuePercent}
					footnote={`${remainingValue} ${typeOption.unit} left`}
				/>
			</RingColumn>
			<SpotlightCenter>
				<SpotlightEyebrow>
					{typeOption.label} · {getPeriodLabel(challenge.periodType)}
				</SpotlightEyebrow>
				<SpotlightTitle>
					{currentValue} / {targetValue}
				</SpotlightTitle>
				<SpotlightSubtitle>{typeOption.unit}</SpotlightSubtitle>
				<DateRange>
					{formatDate(challenge.startDate)} — {formatDate(challenge.endDate)}
				</DateRange>
				<SpotlightProgressText>
					{elapsedDays} days elapsed
				</SpotlightProgressText>
				{challenge.isActive ? <ActiveBadge>Active</ActiveBadge> : null}
				<SpotlightActions>
					{challenge.isActive ? null : (
						<ActionButton
							disabled={isMutating}
							type="button"
							onClick={onActivate}
						>
							Set active
						</ActionButton>
					)}
				</SpotlightActions>
			</SpotlightCenter>
			<RingColumn>
				<RingProgress
					color="#233d4d"
					label="time"
					value={timePercent}
					footnote={`${challenge.progress?.time.remainingDays ?? 0} days left`}
				/>
			</RingColumn>
		</SpotlightCard>
	);
};

const RingProgress = ({
	color,
	footnote,
	label,
	value,
}: {
	color: string;
	footnote: string;
	label: string;
	value: number;
}) => {
	const radius = 48;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (circumference * value) / 100;

	return (
		<RingBox>
			<RingSvg height="132" viewBox="0 0 132 132" width="132">
				<circle
					cx="66"
					cy="66"
					fill="none"
					r={radius}
					stroke="rgb(35 61 77 / 0.12)"
					strokeWidth="12"
				/>
				<circle
					cx="66"
					cy="66"
					fill="none"
					r={radius}
					stroke={color}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					strokeWidth="12"
				/>
			</RingSvg>
			<RingValue>{Math.round(value)}%</RingValue>
			<RingLabel>{label}</RingLabel>
			<RingFootnote>{footnote}</RingFootnote>
		</RingBox>
	);
};

const ChallengeTimelineChart = ({
	challenge,
}: {
	challenge: IBookChallenge;
}) => {
	const points = getChallengeTimelinePoints(challenge);
	const unit = getTypeOption(challenge.type).unit;
	const width = 720;
	const height = 260;
	const padding = {
		bottom: 42,
		left: 42,
		right: 20,
		top: 22,
	};
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;
	const maxValue = Math.max(
		challenge.targetValue,
		...points.map((point) => Math.max(point.target, point.actual ?? 0)),
		1,
	);
	const getX = (index: number) =>
		padding.left +
		(points.length <= 1 ? 0 : (chartWidth * index) / (points.length - 1));
	const getY = (value: number) =>
		padding.top + chartHeight - (chartHeight * value) / maxValue;
	const getPolyline = (values: Array<number | null>) =>
		values
			.map((value, index) =>
				value === null
					? null
					: `${getX(index).toFixed(1)},${getY(value).toFixed(1)}`,
			)
			.filter(Boolean)
			.join(" ");
	const targetLine = getPolyline(points.map((point) => point.target));
	const actualLine = getPolyline(points.map((point) => point.actual));
	const visibleLabels = points.filter((_, index) => {
		if (challenge.periodType !== "year") return true;

		return index === 0 || index === points.length - 1 || index % 2 === 1;
	});

	return (
		<TimelinePanel>
			<TimelineHeader>
				<TimelineLegend>
					<TimelineLegendItem $color={theme.colors.orangeLight}>
						plan
					</TimelineLegendItem>
					<TimelineLegendItem $color={theme.colors.bluePrimary}>
						read
					</TimelineLegendItem>
				</TimelineLegend>
			</TimelineHeader>
			<TimelineSvg
				role="img"
				aria-label={`Challenge progress line in ${unit}`}
				viewBox={`0 0 ${width} ${height}`}
			>
				<line
					x1={padding.left}
					x2={width - padding.right}
					y1={getY(0)}
					y2={getY(0)}
				/>
				<line
					x1={padding.left}
					x2={padding.left}
					y1={padding.top}
					y2={height - padding.bottom}
				/>
				{[0.25, 0.5, 0.75, 1].map((tick) => {
					const y = getY(maxValue * tick);

					return (
						<g key={tick}>
							<line
								className="grid-line"
								x1={padding.left}
								x2={width - padding.right}
								y1={y}
								y2={y}
							/>
							<text x={padding.left - 10} y={y + 4}>
								{Math.round(maxValue * tick)}
							</text>
						</g>
					);
				})}
				<polyline className="target-line" points={targetLine} />
				{actualLine ? (
					<polyline className="actual-line" points={actualLine} />
				) : null}
				{points.map((point, index) => (
					<g key={`${point.label}-${index}`}>
						<circle
							className="target-dot"
							cx={getX(index)}
							cy={getY(point.target)}
							r="4"
						/>
						{point.actual === null ? null : (
							<circle
								className="actual-dot"
								cx={getX(index)}
								cy={getY(point.actual)}
								r="4"
							/>
						)}
					</g>
				))}
				{visibleLabels.map((point) => {
					const index = points.indexOf(point);

					return (
						<text
							key={`${point.label}-label`}
							className="x-label"
							x={getX(index)}
							y={height - 12}
						>
							{point.label}
						</text>
					);
				})}
			</TimelineSvg>
		</TimelinePanel>
	);
};

const ChallengePlanBreakdown = ({
	challenge,
}: {
	challenge: IBookChallenge;
}) => {
	const [drilldownRange, setDrilldownRange] =
		useState<IChallengePlanRange | null>(null);
	const baseGranularity = getDefaultPlanGranularity(challenge.periodType);
	const activeGranularity = drilldownRange
		? (getNextPlanGranularity(baseGranularity) ?? baseGranularity)
		: baseGranularity;
	const points = getChallengeTimelinePoints(
		challenge,
		activeGranularity,
		drilldownRange,
	);
	const canDrillDown = Boolean(
		!drilldownRange && getNextPlanGranularity(baseGranularity),
	);

	return (
		<PlanPanel>
			<TimelineHeader>
				<PlanTitleGroup>
					<TimelineTitle>
						{drilldownRange
							? `Challenge plan - ${drilldownRange.label}`
							: "Challenge plan"}
					</TimelineTitle>
					{drilldownRange ? (
						<PlanBackButton
							type="button"
							onClick={() => setDrilldownRange(null)}
						>
							Back
						</PlanBackButton>
					) : null}
				</PlanTitleGroup>
				<PlanHint>{getPlanGranularityLabel(activeGranularity)}</PlanHint>
			</TimelineHeader>
			{canDrillDown ? (
				<PlanHelp>
					Click a point to open the selected period breakdown.
				</PlanHelp>
			) : null}
			<PlanLine role="list">
				{points.map((point, i) => (
					<Fragment key={point.startDate.toISOString()}>
						<PlanDotWrap role="listitem">
							<PlanDot
								$done={point.actual !== null}
								$isClickable={canDrillDown}
								aria-label={`Open breakdown: ${point.label}`}
								disabled={!canDrillDown}
								type="button"
								onClick={() =>
									canDrillDown &&
									setDrilldownRange({
										startDate: point.startDate,
										endDate: point.endDate,
										label: point.label,
									})
								}
							/>
							<PlanPeriod>{point.label}</PlanPeriod>
						</PlanDotWrap>

						{i < points.length - 1 && (
							<PlanRail
								$done={point.actual !== null}
								$granularity={activeGranularity}
							>
								<PlanRailLabel $done={point.actual !== null}>
									{formatPlanAmount(point.actualSegment ?? 0)}/
									{formatPlanAmount(point.targetSegment)}
								</PlanRailLabel>
							</PlanRail>
						)}
					</Fragment>
				))}
			</PlanLine>
		</PlanPanel>
	);
};

const ChallengeDetails = ({ challenge }: { challenge: IBookChallenge }) => {
	const progress = challenge.progress;

	if (!progress) {
		return (
			<PanelText>
				Backend has not returned progress for this challenge yet.
			</PanelText>
		);
	}

	return <ChallengePlanBreakdown key={challenge.id} challenge={challenge} />;
};

interface IChallengeModalProps {
	form: IChallengeFormState;
	isMutating: boolean;
	mode: IChallengeModalMode;
	selectedChallenge: IBookChallenge | null;
	onClose: () => void;
	onDelete: () => void;
	onPeriodChange: (periodType: IChallengePeriodType) => void;
	onStartDateChange: (startDate: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onUpdateForm: (
		value:
			| IChallengeFormState
			| ((current: IChallengeFormState) => IChallengeFormState),
	) => void;
}

const ChallengeModal = ({
	form,
	isMutating,
	mode,
	selectedChallenge,
	onClose,
	onDelete,
	onPeriodChange,
	onStartDateChange,
	onSubmit,
	onUpdateForm,
}: IChallengeModalProps) => {
	const target = Math.max(1, Math.round(Number(form.targetValue) || 1));
	const targetPresets =
		form.type === "pages" ? [600, 1200, 2400, 5000] : [12, 24, 36, 52];
	const targetPlaceholder = form.type === "pages" ? "1200" : "24";
	const targetLabel =
		form.type === "pages" ? "Enter page count" : "Enter book count";
	const targetHelp =
		form.type === "pages"
			? "This number will be your pages goal. You can type your own value or choose a preset below."
			: "This number will be your books goal. You can type your own value or choose a preset below.";
	const handleTargetChange = (value: string) => {
		const digitsOnly = value.replace(/\D/g, "");

		onUpdateForm((current) => ({
			...current,
			targetValue: digitsOnly,
		}));
	};

	return (
		<ModalOverlay role="presentation" onMouseDown={onClose}>
			<ModalDialog
				aria-modal="true"
				role="dialog"
				aria-labelledby="challenge-modal-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<ModalHeader>
					<ModalTitle id="challenge-modal-title">
						{mode === "edit" ? "Edit challenge" : "New book challenge"}
					</ModalTitle>
					<CloseButton type="button" aria-label="Close" onClick={onClose}>
						×
					</CloseButton>
				</ModalHeader>
				<Form onSubmit={onSubmit}>
					{/* Books/pages switch is temporarily hidden: page-based challenges are not connected yet. */}

					<PeriodActivityRow>
						<Fieldset>
							<FieldsetLabel>Period</FieldsetLabel>
							<Segmented>
								{periodOptions.map((option) => (
									<SegmentButton
										key={option.value}
										type="button"
										$isActive={form.periodType === option.value}
										onClick={() => onPeriodChange(option.value)}
									>
										{option.label}
									</SegmentButton>
								))}
							</Segmented>
						</Fieldset>
						<ActivityToggle
							type="button"
							aria-pressed={form.isActive}
							$isActive={form.isActive}
							onClick={() =>
								onUpdateForm((current) => ({
									...current,
									isActive: !current.isActive,
								}))
							}
						>
							<ToggleTrack $isActive={form.isActive}>
								<ToggleThumb $isActive={form.isActive} />
							</ToggleTrack>
							<ToggleText>
								<span>{form.isActive ? "Active" : "Inactive"}</span>
							</ToggleText>
						</ActivityToggle>
					</PeriodActivityRow>

					<TargetBox>
						<TargetInputColumn>
							<TargetInputLabel>{targetLabel}</TargetInputLabel>
							<TargetNumberInput
								aria-label={targetLabel}
								inputMode="numeric"
								$isEmpty={!form.targetValue}
								placeholder={targetPlaceholder}
								value={form.targetValue}
								onBlur={() =>
									onUpdateForm((current) => ({
										...current,
										targetValue: String(
											Math.max(1, Math.round(Number(current.targetValue) || 1)),
										),
									}))
								}
								onChange={(event) => handleTargetChange(event.target.value)}
							/>
							<TargetInputHelp>{targetHelp}</TargetInputHelp>
						</TargetInputColumn>
						<TargetPresetsRow>
							{targetPresets.map((preset) => (
								<TargetPreset
									key={preset}
									type="button"
									$isActive={target === preset}
									onClick={() =>
										onUpdateForm((current) => ({
											...current,
											targetValue: String(preset),
										}))
									}
								>
									{preset}
								</TargetPreset>
							))}
						</TargetPresetsRow>
					</TargetBox>

					<DateGrid>
						<DateField
							label="Start date"
							max={form.endDate}
							value={form.startDate}
							onChange={onStartDateChange}
						/>
						<DateField
							label="End date"
							min={form.startDate}
							value={form.endDate}
							onChange={(endDate) =>
								onUpdateForm((current) => ({
									...current,
									endDate,
								}))
							}
						/>
					</DateGrid>

					<ModalActions>
						{mode === "edit" ? (
							<DangerButton
								disabled={!selectedChallenge || isMutating}
								type="button"
								onClick={onDelete}
							>
								Delete
							</DangerButton>
						) : null}
						<SecondaryButton type="button" onClick={onClose}>
							Cancel
						</SecondaryButton>
						<Button
							disabled={isMutating}
							buttonType="containedInverted"
							type="submit"
						>
							{mode === "edit" ? "Save" : "Create"}
						</Button>
					</ModalActions>
				</Form>
			</ModalDialog>
		</ModalOverlay>
	);
};

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding: clamp(2.5rem, 5vw, 4rem) 0 5rem;
`;

const Content = styled.section`
	width: 70vw;
	margin: 0 auto;
	@media (max-width: 720px) {
		width: min(95vw, ${theme.layout.contentMaxWidth});
	}
`;

const Hero = styled.header`
	position: relative;
	margin-bottom: 1.5rem;
	padding-right: min(13rem, 42vw);

	@media (max-width: 42rem) {
		padding-right: 0;
		padding-top: 2rem;
	}
`;

const HeroTop = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 1rem;
`;

const BackLink = styled(Link)`
	color: ${theme.colors.orangeDark};
	font-size: 0.9rem;
	font-weight: 700;
	text-decoration: none;
`;

const NewButton = styled.button`
	position: absolute;
	top: 1.95rem;
	right: 0;
	border: 0.0625rem solid rgb(218 142 91 / 0.45);
	border-radius: 999px;
	background: rgb(218 142 91 / 0.1);
	padding: 0.7rem 1.1rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-weight: 700;

	@media (max-width: 42rem) {
		position: static;
		margin-top: 0.9rem;
	}
`;

const Title = styled.h1`
	margin: 0.45rem 0 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(2.2rem, 3.6vw, 3.8rem);
	line-height: 1;
`;

const Lead = styled.p`
	max-width: 48rem;
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1.05rem;
	line-height: 1.55;
`;

const StateMessage = styled.p`
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;

const ChallengeWorkspace = styled.section`
	width: 100vw;
	margin-left: calc(50% - 50vw);
	padding: clamp(0.5rem, 2vw, 1rem) 0;
`;

const CarouselStage = styled.section`
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	align-items: center;
	gap: 1rem;
	width: 100vw;
	margin: 0;
	overflow: visible;

	@media (max-width: 48rem) {
		grid-template-columns: 1fr;
	}
`;

const ChallengeViewport = styled.div`
	overflow: hidden;
	width: 100vw;
`;

const ChallengeTrack = styled.div`
	display: flex;
	align-items: stretch;
`;

const ChallengeSlide = styled.div<{ $hasPreview: boolean; $isActive: boolean }>`
	flex: 0 0
		${({ $hasPreview }) =>
			$hasPreview ? "clamp(34rem, 54vw, 50rem)" : "min(100%, 50rem)"};
	min-width: 0;
	margin-inline: clamp(0.65rem, 1.1vw, 1.15rem);
	border-radius: 1.25rem;
	background: rgb(242 239 237 / 0.32);
	padding: clamp(0.85rem, 2vw, 1.25rem);
	opacity: ${({ $isActive }) => ($isActive ? 1 : 0.38)};
	pointer-events: ${({ $isActive }) => ($isActive ? "auto" : "none")};
	transform: scale(${({ $isActive }) => ($isActive ? 1 : 0.94)});
	transition:
		opacity 180ms ease,
		transform 180ms ease;

	@media (max-width: 48rem) {
		flex-basis: 90%;
		padding-inline: 0;
		opacity: 1;
		transform: none;
	}
`;

const ArrowButton = styled.button<{ $side: "next" | "prev" }>`
	position: absolute;
	top: 50%;
	z-index: 5;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.875rem;
	height: 1.875rem;
	border: 0.0625rem solid ${theme.colors.orangeDark};
	border-radius: 999px;
	background: ${theme.colors.transparent};
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.serif};
	font-size: 2rem;
	line-height: 1;
	transform: translateY(-50%);
	transition:
		background 180ms ease,
		border-color 180ms ease,
		color 180ms ease,
		opacity 180ms ease,
		transform 180ms ease;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangePrimary};
		border-color: ${theme.colors.orangePrimary};
		color: ${theme.colors.white};
		outline: none;
		transform: translateY(calc(-50% - 0.0625rem));
	}

	${({ $side }) =>
		$side === "prev"
			? "left: max(0.25rem, calc(50% - 27.5rem));"
			: "right: max(0.25rem, calc(50% - 27.5rem));"}

	@media (max-width: 48rem) {
		display: none;
	}
`;
const PlanLine = styled.div`
	display: flex;
	align-items: center;
	width: 100%;
	overflow: visible;
	padding: 1.25rem 0.6rem 1rem 0.25rem;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}

	@media (max-width: 48rem) {
		overflow-x: auto;
	}
`;

const PlanDotWrap = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 0 0 0;
	width: 0;
	position: relative;
	z-index: 2;
	/* Keep spacing controlled manually instead of relying on gap. */
`;

const PlanDot = styled.button<{ $done: boolean; $isClickable: boolean }>`
	width: 14px;
	height: 14px;
	border: 0;
	border-radius: 50%;
	flex-shrink: 0;
	/* Keep margin at zero to avoid layout shifts. */
	margin: 0;
	padding: 0;
	position: relative;
	z-index: 3;
	cursor: ${({ $isClickable }) => ($isClickable ? "pointer" : "default")};
	background: ${({ $done }) =>
		$done ? theme.colors.bluePrimary : theme.colors.orangeLight};
	box-shadow:
		0 0 0 3px ${theme.colors.background},
		0 0 0 5px
			${({ $done }) =>
				$done ? theme.colors.bluePrimary : theme.colors.orangeLight};
	transition: transform 0.15s;

	&:not(:disabled):hover,
	&:not(:disabled):focus-visible {
		outline: none;
		transform: scale(1.3);
	}
`;

const PlanPeriod = styled.span`
	position: absolute;
	top: 1.35rem;
	left: 50%;
	transform: translateX(-50%);
	margin: 0;
	font-size: 0.72rem;
	color: ${theme.colors.softForeground};
	white-space: nowrap;
`;

const PlanRail = styled.div<{
	$done: boolean;
	$granularity: IPlanGranularity;
}>`
	height: 3px;
	flex: 1 0
		${({ $granularity }) =>
			$granularity === "month"
				? "5.95rem"
				: $granularity === "week"
					? "clamp(3.15rem, 5vw, 4.6rem)"
					: "clamp(2.35rem, 4vw, 3.35rem)"};
	border-radius: 2px;
	background: ${({ $done }) =>
		$done ? theme.colors.bluePrimary : "rgb(35 61 77 / 0.16)"};
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const PlanRailLabel = styled.span<{ $done: boolean }>`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 2;
	border-radius: 999px;
	background: ${theme.colors.background};
	padding: 0.08rem 0.4rem;
	font-family: ${theme.fonts.sans};
	font-size: 0.78rem;
	font-weight: 600;
	line-height: 1.15;
	color: ${({ $done }) =>
		$done ? theme.colors.bluePrimary : theme.colors.softForeground};
	white-space: nowrap;
`;

const SpotlightCard = styled.article`
	position: relative;
	display: grid;
	grid-template-columns: minmax(7rem, 0.58fr) minmax(11rem, 0.9fr) minmax(
			7rem,
			0.7fr
		);
	align-items: center;
	gap: clamp(0.65rem, 1.8vw, 1.25rem);
	padding: clamp(0.35rem, 1.4vw, 0.75rem);

	@media (max-width: 42rem) {
		grid-template-columns: 1fr;
		text-align: center;
	}
`;

const EditSpotlightButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	border: 0;
	background: transparent;
	padding: 0.25rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.78rem;
	font-weight: 700;
	line-height: 1.2;

	&:hover,
	&:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.16rem;
		outline: none;
	}
	@media screen {
		font-size: 1.08rem;
	}
`;

const RingColumn = styled.div`
	display: flex;
	justify-content: center;
`;

const SpotlightCenter = styled.div`
	display: grid;
	justify-items: center;
	text-align: center;
`;

const SpotlightActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.6rem;
	margin-top: 0.85rem;
`;

const SpotlightEyebrow = styled.span`
	color: ${theme.colors.orangeDark};
	font-size: 0.78rem;
	font-weight: 700;
	text-transform: uppercase;
`;

const SpotlightTitle = styled.strong`
	margin-top: 0.35rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(2.7rem, 5.8vw, 4.9rem);
	line-height: 0.9;
`;

const SpotlightSubtitle = styled.span`
	margin-top: 0.25rem;
	color: ${theme.colors.foreground};
	font-size: 1.05rem;
	font-weight: 700;
`;

const DateRange = styled.span`
	margin-top: 0.75rem;
	color: ${theme.colors.softForeground};
	font-size: 0.9rem;
`;

const SpotlightProgressText = styled.span`
	margin-top: 0.35rem;
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
`;

const ActiveBadge = styled.span`
	margin-top: 0.85rem;
	border-radius: 999px;
	background: rgb(35 61 77 / 0.1);
	padding: 0.3rem 0.7rem;
	color: ${theme.colors.bluePrimary};
	font-size: 0.78rem;
	font-weight: 700;
`;

const RingBox = styled.div`
	position: relative;
	display: grid;
	justify-items: center;
	color: ${theme.colors.foreground};
`;

const RingSvg = styled.svg`
	transform: rotate(-90deg);
`;

const RingValue = styled.strong`
	position: absolute;
	top: 2.95rem;
	font-family: ${theme.fonts.serif};
	font-size: 1.45rem;
	line-height: 1;
`;

const RingLabel = styled.span`
	position: absolute;
	top: 4.45rem;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	text-transform: uppercase;
`;

const RingFootnote = styled.span`
	margin-top: 0.15rem;
	color: ${theme.colors.softForeground};
	font-size: 0.83rem;
	text-align: center;
`;

const CarouselDots = styled.div`
	display: flex;
	justify-content: center;
	gap: 0.45rem;
	margin-top: 1rem;
`;

const DotButton = styled.button<{ $isActive: boolean }>`
	width: ${({ $isActive }) => ($isActive ? "1.7rem" : "0.55rem")};
	height: 0.55rem;
	border: 0;
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeLight : "rgb(35 61 77 / 0.18)"};
	cursor: pointer;
	transition:
		width 180ms ease,
		background 180ms ease;
`;

const ActionButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.32);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.58);
	padding: 0.62rem 1rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-weight: 700;

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;

const GraphsPanel = styled.section`
	width: 100vw;
	margin: 0.7rem 0 0 calc(50% - 50vw);
	padding-inline: clamp(0.75rem, 3vw, 1.5rem);
	box-sizing: border-box;

	@media (max-width: 720px) {
		display: none;
	}
`;

const TimelineDisclosure = styled.section`
	width: min(100%, 54rem);
	margin: 1rem auto 0;
`;

const TimelineToggle = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	width: 100%;
	border: 0;
	background: transparent;
	padding: 0.8rem 1rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;

	span:first-child {
		font-family: ${theme.fonts.serif};
		font-size: 1.2rem;
		font-weight: 700;
	}

	span:last-child {
		color: ${theme.colors.orangeDark};
		font-size: 0.82rem;
		font-weight: 700;
	}

	&:hover,
	&:focus-visible {
		outline: none;

		span:last-child {
			color: ${theme.colors.orangeLight};
		}
	}
`;

const TimelinePanel = styled.section`
	width: 100%;
	margin: 0 auto;
	border-radius: 1rem;
	background: transparent;
	padding: 1rem;
`;

const TimelineHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 0.75rem;
`;

const TimelineTitle = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	line-height: 1.15;
`;

const TimelineLegend = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem;
`;

const TimelineLegendItem = styled.span<{ $color: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;

	&::before {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 50%;
		background: ${({ $color }) => $color};
		content: "";
	}
`;

const TimelineSvg = styled.svg`
	display: block;
	width: 100%;
	height: auto;
	overflow: visible;

	line {
		stroke: rgb(35 61 77 / 0.18);
		stroke-width: 1.5;
	}

	.grid-line {
		stroke: rgb(35 61 77 / 0.08);
	}

	text {
		fill: ${theme.colors.softForeground};
		font-family: ${theme.fonts.sans};
		font-size: 0.68rem;
		text-anchor: end;
	}

	.x-label {
		text-anchor: middle;
	}

	.target-line,
	.actual-line {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 4;
	}

	.target-line {
		stroke: ${theme.colors.orangeLight};
	}

	.actual-line {
		stroke: ${theme.colors.bluePrimary};
	}

	.target-dot {
		fill: ${theme.colors.orangeLight};
	}

	.actual-dot {
		fill: ${theme.colors.bluePrimary};
	}
`;

const PlanPanel = styled.section`
	width: min(80vw, ${theme.layout.contentMaxWidth});
	margin: 0 auto 1.1rem;
	border-radius: 1rem;
	background: transparent;
	padding: 0.35rem 0 1rem;
	overflow: visible;

	@media (max-width: 48rem) {
		overflow-x: auto;
		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}
	}
`;

const PlanHint = styled.span`
	display: inline-flex;
	align-items: center;
	border: 0.0625rem solid rgb(218 142 91 / 0.34);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.38);
	padding: 0.26rem 0.62rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.78rem;
	font-weight: 700;
`;

const PlanTitleGroup = styled.div`
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.55rem;
`;

const PlanHelp = styled.p`
	margin: -0.2rem 0 0.15rem;
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
	line-height: 1.35;
`;

const PlanBackButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.4);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.42);
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.76rem;
	font-weight: 700;
	padding: 0.24rem 0.62rem;
	transition:
		background 160ms ease,
		border-color 160ms ease,
		color 160ms ease;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(255 255 255 / 0.72);
		color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const PanelText = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;

const EmptyState = styled.section`
	width: min(100%, 34rem);
	margin: 2rem auto 0;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 1.2rem;
	background: rgb(255 255 255 / 0.58);
	padding: 2rem;
	text-align: center;
`;

const EmptyTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.8rem;
`;

const EmptyText = styled.p`
	margin: 0.75rem 0 1.25rem;
	color: ${theme.colors.softForeground};
	line-height: 1.5;
`;

const ModalOverlay = styled.div`
	position: fixed;
	z-index: 60;
	inset: 0;
	display: grid;
	place-items: center;
	overflow-y: auto;
	background: rgb(4 18 26 / 0.48);
	padding: 1rem;
`;

const ModalDialog = styled.section`
	width: min(100%, 36rem);
	border: 0.0625rem solid #eeb38d;
	border-radius: 1.1rem;
	background: #e8e2de;
	padding: 1.35rem;
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.16);
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
	margin: 0;
	color: #04121a;
	font-family: ${theme.fonts.serif};
	font-size: 1.6rem;
	font-weight: 600;
	line-height: 1.2;
`;

const CloseButton = styled.button`
	border: 0;
	background: transparent;
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 1.6rem;
	line-height: 1;
`;

const Form = styled.form`
	display: grid;
	gap: 1rem;
`;

const Fieldset = styled.div`
	display: grid;
	gap: 0.5rem;
`;

const FieldsetLabel = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.82rem;
	font-weight: 700;
`;

const PeriodActivityRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: stretch;
	gap: 0.9rem;

	@media (max-width: 34rem) {
		grid-template-columns: 1fr;
	}
`;

const ActivityToggle = styled.button<{ $isActive: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: flex-start;
	gap: 0.65rem;
	align-self: end;
	min-height: 2.7rem;
	border: 0.0625rem solid
		${({ $isActive }) =>
			$isActive ? "rgb(218 142 91 / 0.5)" : "rgb(211 202 196 / 0.82)"};
	border-radius: 0.9rem;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.14)" : "rgb(242 239 237 / 0.72)"};
	padding: 0.42rem 0.8rem 0.42rem 0.55rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	font-weight: 700;
	transition:
		background 150ms,
		border-color 150ms,
		color 150ms,
		transform 150ms;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.12);
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}

	&:active {
		transform: translateY(0.0625rem);
	}
`;

const ToggleTrack = styled.span<{ $isActive: boolean }>`
	position: relative;
	flex: 0 0 auto;
	width: 2.45rem;
	height: 1.3rem;
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeLight : "rgb(186 183 180 / 0.56)"};
	box-shadow: inset 0 0 0 0.0625rem rgb(4 18 26 / 0.04);
	transition:
		background 150ms,
		box-shadow 150ms;
`;

const ToggleThumb = styled.span<{ $isActive: boolean }>`
	position: absolute;
	top: 0.18rem;
	left: ${({ $isActive }) => ($isActive ? "1.3rem" : "0.18rem")};
	width: 0.94rem;
	height: 0.94rem;
	border-radius: 50%;
	background: ${theme.colors.background};
	box-shadow: 0 0.0625rem 0.18rem rgb(4 18 26 / 0.18);
	transition: left 150ms;
`;

const ToggleText = styled.span`
	display: grid;
	gap: 0.05rem;
	text-align: left;
	white-space: nowrap;
`;

const Segmented = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const SegmentButton = styled.button<{ $isActive: boolean }>`
	border: 0.0625rem solid
		${({ $isActive }) => ($isActive ? "#da8e5b" : "rgb(211 202 196 / 0.82)")};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.16)" : "rgb(242 239 237 / 0.72)"};
	padding: 0.58rem 0.95rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-weight: 600;
`;

const TargetBox = styled.div`
	display: grid;
	justify-items: center;
	gap: 0.75rem;
	border-radius: 1rem;
	background: rgb(242 239 237 / 0.72);
	padding: 1rem;
`;

const TargetInputColumn = styled.div`
	display: grid;
	justify-items: center;
	gap: 0.45rem;
`;

const TargetInputLabel = styled.span`
	color: ${theme.colors.foreground};
	font-size: 0.86rem;
	font-weight: 700;
	text-align: center;
`;

const TargetNumberInput = styled.input<{ $isEmpty: boolean }>`
	width: 5.25rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.18);
	border-radius: 0.75rem;
	background: ${({ $isEmpty }) =>
		$isEmpty ? "rgb(218 142 91 / 0.08)" : "transparent"};
	padding: 0.25rem 0.35rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 3.25rem;
	font-weight: 600;
	line-height: 1;
	text-align: center;
	outline: none;
	box-shadow: ${({ $isEmpty }) =>
		$isEmpty ? "0 0 0 0.125rem rgb(218 142 91 / 0.18)" : "none"};
	transition:
		background-color 150ms,
		border-color 150ms,
		box-shadow 150ms;

	&:hover,
	&:focus {
		border-color: rgb(218 142 91 / 0.28);
		background: rgb(218 142 91 / 0.08);
		box-shadow: 0 0 0 0.125rem rgb(218 142 91 / 0.18);
	}

	&::placeholder {
		color: rgb(4 18 26 / 0.26);
	}
`;

const TargetInputHelp = styled.p`
	max-width: 22rem;
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	line-height: 1.35;
	text-align: center;
`;

const TargetPresetsRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.55rem;
`;

const TargetPreset = styled.button<{ $isActive: boolean }>`
	border: 0.0625rem solid
		${({ $isActive }) => ($isActive ? "#da8e5b" : "rgb(186 183 180 / 0.6)")};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.12)" : "transparent"};
	padding: 0.3rem 0.85rem;
	color: ${({ $isActive }) => ($isActive ? "#da8e5b" : "#bab7b4")};
	cursor: pointer;
	font: inherit;
	font-size: 0.875rem;
	font-weight: 600;
	transition:
		background 150ms,
		border-color 150ms,
		color 150ms;

	&:hover,
	&:focus-visible {
		border-color: #da8e5b;
		color: #da8e5b;
		outline: none;
	}
`;

const DateGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem;

	@media (max-width: 34rem) {
		grid-template-columns: 1fr;
	}
`;

const ModalActions = styled.div`
	display: flex;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: 0.65rem;
	margin-top: 0.25rem;
`;

const SecondaryButton = styled.button`
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.58);
	padding: 0.58rem 0.95rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-weight: 700;
`;

const DangerButton = styled(SecondaryButton)`
	margin-right: auto;
	border-color: rgb(160 52 52 / 0.32);
	color: #a03434;

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;
