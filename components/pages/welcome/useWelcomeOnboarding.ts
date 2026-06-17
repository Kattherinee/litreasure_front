"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createChallenge } from "@/shared/api/book-challenge";
import { checkUsernameAvailability } from "@/shared/api/auth";
import { updateUserGenres, updateUserProfile } from "@/shared/api/users";
import { useAuthStore } from "@/shared/store/auth-store";

import {
	canOpenWelcomeOnboarding,
	markWelcomeOnboardingCompleted,
} from "./onboardingStorage";
import {
	type IGoalStartMode,
	MIN_SELECTED_GENRES,
	STEPS,
	type IWelcomeStep,
} from "./types";

const getDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getGoalDateRange = (startMode: IGoalStartMode) => {
	const today = new Date();
	const startDate =
		startMode === "yearStart" ? new Date(today.getFullYear(), 0, 1) : today;
	const endDate =
		startMode === "yearStart"
			? new Date(today.getFullYear(), 11, 31)
			: (() => {
					const nextDate = new Date(startDate);
					nextDate.setFullYear(nextDate.getFullYear() + 1);
					nextDate.setDate(nextDate.getDate() - 1);
					return nextDate;
				})();

	return {
		endDate: getDateInputValue(endDate),
		startDate: getDateInputValue(startDate),
	};
};

export const useWelcomeOnboarding = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);
	const setSession = useAuthStore((state) => state.setSession);

	const [canRenderWelcome, setCanRenderWelcome] = useState(false);
	const [activeStep, setActiveStep] = useState<IWelcomeStep>("profile");
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [avatarUrl, setAvatarUrl] = useState("");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [yearGoal, setYearGoal] = useState(0);
	const [goalStartMode, setGoalStartMode] =
		useState<IGoalStartMode>("yearStart");
	const [formError, setFormError] = useState("");
	const [hasUsernameError, setHasUsernameError] = useState(false);
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const userId = session?.user?.id;
	const activeStepIndex = STEPS.findIndex((step) => step.id === activeStep);
	const activeStepConfig = STEPS[activeStepIndex];

	useEffect(() => {
		if (!session) {
			router.replace("/");
			return;
		}

		if (!canOpenWelcomeOnboarding(session.user)) {
			router.replace("/");
			return;
		}

		setCanRenderWelcome(true);
	}, [router, session]);

	const isNextDisabled =
		(activeStep === "profile" &&
			(!name.trim() || username.trim().length < 3)) ||
		(activeStep === "avatar" && !avatarUrl) ||
		(activeStep === "genres" && selectedGenres.length < MIN_SELECTED_GENRES) ||
		Boolean(formError) ||
		isCheckingUsername ||
		isSavingProfile;

	const clearError = () => {
		setFormError("");
		setHasUsernameError(false);
	};

	const changeName = (value: string) => {
		setName(value);
		setFormError("");
	};

	const changeUsername = (value: string) => {
		setUsername(value);
		clearError();
	};

	const changeAvatar = (url: string) => {
		setAvatarUrl(url);
		setFormError("");
	};

	const changeYearGoal = (value: number) => {
		setYearGoal(value);
		setFormError("");
	};

	const changeGoalStartMode = (value: IGoalStartMode) => {
		setGoalStartMode(value);
		setFormError("");
	};

	const selectStep = (step: IWelcomeStep) => {
		setActiveStep(step);
		clearError();
	};

	const toggleGenre = (slug: string) => {
		setSelectedGenres((current) =>
			current.includes(slug)
				? current.filter((genre) => genre !== slug)
				: [...current, slug],
		);
	};

	const goNext = async () => {
		clearError();

		if (activeStep === "profile") {
			try {
				setIsCheckingUsername(true);
				const available = await checkUsernameAvailability(username.trim());
				if (!available) {
					setHasUsernameError(true);
					setFormError("This username is already taken. Try another one.");
					return;
				}
			} finally {
				setIsCheckingUsername(false);
			}

			if (!userId) {
				setFormError("Session not found. Please sign in again.");
				return;
			}

			try {
				setIsSavingProfile(true);
				await updateUserProfile(userId, {
					name: name.trim() || undefined,
					username: username.trim() || undefined,
				});
				if (session) {
					setSession({
						...session,
						user: {
							...session.user,
							name: name.trim() || undefined,
							username: username.trim() || undefined,
						},
					});
				}
				setActiveStep("avatar");
			} catch (error) {
				setHasUsernameError(true);
				setFormError(
					error instanceof Error
						? error.message
						: "Could not save profile. Please try again.",
				);
			} finally {
				setIsSavingProfile(false);
			}
			return;
		}

		if (activeStep === "avatar") {
			if (!userId) {
				setFormError("Session not found. Please sign in again.");
				return;
			}

			try {
				setIsSavingProfile(true);
				await updateUserProfile(userId, {
					avatarUrl: avatarUrl || undefined,
				});
				if (session) {
					setSession({
						...session,
						user: {
							...session.user,
							avatarUrl: avatarUrl || undefined,
						},
					});
				}
				setActiveStep("genres");
			} catch (error) {
				setFormError(
					error instanceof Error
						? error.message
						: "Could not save avatar. Please try again.",
				);
			} finally {
				setIsSavingProfile(false);
			}
			return;
		}

		if (activeStep === "genres") {
			setActiveStep("goal");
		}
	};

	const skipStep = () => {
		clearError();
		const next = STEPS[activeStepIndex + 1];
		if (next) setActiveStep(next.id);
	};

	const goBack = () => {
		clearError();
		const prev = STEPS[activeStepIndex - 1];
		if (prev) setActiveStep(prev.id);
	};

	const finishOnboarding = async () => {
		clearError();

		if (activeStep !== "goal") {
			return;
		}

		if (!yearGoal) {
			setFormError("Enter a yearly goal.");
			return;
		}

		if (!userId) {
			setFormError("Session not found. Please sign in again.");
			return;
		}

		try {
			setIsSubmitting(true);

			const genresPromise =
				selectedGenres.length >= MIN_SELECTED_GENRES
					? updateUserGenres(userId, { genreIds: selectedGenres }).catch(
							() => {},
						)
					: Promise.resolve();

			const challengePromise =
				yearGoal > 0
					? (() => {
							const { endDate, startDate } = getGoalDateRange(goalStartMode);
							return createChallenge({
								type: "books",
								periodType: "year",
								targetValue: yearGoal,
								startDate,
								endDate,
								isActive: true,
							}).catch(() => {});
						})()
					: Promise.resolve();

			await Promise.all([genresPromise, challengePromise]);

			markWelcomeOnboardingCompleted(session.user);
			router.replace("/");
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Could not complete registration. Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		activeStep,
		activeStepConfig,
		activeStepIndex,
		avatarUrl,
		canRenderWelcome,
		formError,
		hasUsernameError,
		isCheckingUsername,
		isNextDisabled,
		isSavingProfile,
		isSubmitting,
		goalStartMode,
		name,
		selectedGenres,
		username,
		yearGoal,
		goBack,
		goNext,
		finishOnboarding,
		selectStep,
		setAvatarUrl: changeAvatar,
		setName: changeName,
		setUsername: changeUsername,
		setYearGoal: changeYearGoal,
		setGoalStartMode: changeGoalStartMode,
		skipStep,
		toggleGenre,
	};
};
