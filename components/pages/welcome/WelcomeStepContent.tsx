"use client";

import { AvatarStep } from "./AvatarStep";
import { GenresStep } from "./GenresStep";
import { GoalStep } from "./GoalStep";
import { ProfileStep } from "./ProfileStep";
import type { IGoalStartMode, IWelcomeStep } from "./types";

interface IWelcomeStepContentProps {
	activeStep: IWelcomeStep;
	name: string;
	username: string;
	hasUsernameError: boolean;
	avatarUrl: string;
	selectedGenres: string[];
	yearGoal: number;
	goalStartMode: IGoalStartMode;
	onNameChange: (value: string) => void;
	onUsernameChange: (value: string) => void;
	onAvatarChange: (url: string) => void;
	onGenreToggle: (slug: string) => void;
	onGoalChange: (value: number) => void;
	onGoalStartModeChange: (value: IGoalStartMode) => void;
}

export const WelcomeStepContent = ({
	activeStep,
	name,
	username,
	hasUsernameError,
	avatarUrl,
	selectedGenres,
	yearGoal,
	goalStartMode,
	onNameChange,
	onUsernameChange,
	onAvatarChange,
	onGenreToggle,
	onGoalChange,
	onGoalStartModeChange,
}: IWelcomeStepContentProps) => {
	if (activeStep === "profile") {
		return (
			<ProfileStep
				name={name}
				username={username}
				hasUsernameError={hasUsernameError}
				onNameChange={onNameChange}
				onUsernameChange={onUsernameChange}
			/>
		);
	}

	if (activeStep === "avatar") {
		return <AvatarStep avatarUrl={avatarUrl} onAvatarChange={onAvatarChange} />;
	}

	if (activeStep === "genres") {
		return (
			<GenresStep selectedGenres={selectedGenres} onToggle={onGenreToggle} />
		);
	}

	return (
		<GoalStep
			goalStartMode={goalStartMode}
			yearGoal={yearGoal}
			onGoalChange={onGoalChange}
			onGoalStartModeChange={onGoalStartModeChange}
		/>
	);
};
