"use client";

import styled from "styled-components";

import { StepTabs } from "./welcome/StepTabs";
import { WelcomeActions } from "./welcome/WelcomeActions";
import { WelcomeLayout } from "./welcome/WelcomeLayout";
import { WelcomeStepContent } from "./welcome/WelcomeStepContent";
import { useWelcomeOnboarding } from "./welcome/useWelcomeOnboarding";

const WelcomePage = () => {
	const {
		activeStep,
		activeStepConfig,
		activeStepIndex,
		avatarUrl,
		canRenderWelcome,
		formError,
		goalStartMode,
		hasUsernameError,
		isCheckingUsername,
		isNextDisabled,
		isSavingProfile,
		isSubmitting,
		name,
		selectedGenres,
		username,
		yearGoal,
		goBack,
		goNext,
		finishOnboarding,
		selectStep,
		setAvatarUrl,
		setName,
		setUsername,
		setGoalStartMode,
		setYearGoal,
		skipStep,
		toggleGenre,
	} = useWelcomeOnboarding();

	if (!canRenderWelcome) {
		return null;
	}

	return (
		<WelcomeLayout activeStep={activeStep} activeStepIndex={activeStepIndex}>
			<StepTabs
				activeStep={activeStep}
				activeStepIndex={activeStepIndex}
				canSkip={Boolean(activeStepConfig?.skippable)}
				onStepClick={selectStep}
				onSkip={skipStep}
			/>

			<OnboardingForm
				$step={activeStep}
				onSubmit={(event) => event.preventDefault()}
			>
				<WelcomeStepContent
					activeStep={activeStep}
					name={name}
					username={username}
					hasUsernameError={hasUsernameError}
					avatarUrl={avatarUrl}
					selectedGenres={selectedGenres}
					yearGoal={yearGoal}
					goalStartMode={goalStartMode}
					onNameChange={setName}
					onUsernameChange={setUsername}
					onAvatarChange={setAvatarUrl}
					onGenreToggle={toggleGenre}
					onGoalChange={setYearGoal}
					onGoalStartModeChange={setGoalStartMode}
				/>

				{formError ? <ErrorText role="alert">{formError}</ErrorText> : null}

				<WelcomeActions
					canGoBack={activeStepIndex > 0}
					isFinalStep={activeStep === "goal"}
					isNextDisabled={isNextDisabled}
					isSubmitting={isSubmitting}
					isCheckingUsername={isCheckingUsername}
					isSavingProfile={isSavingProfile}
					onBack={goBack}
					onFinish={finishOnboarding}
					onNext={goNext}
				/>
			</OnboardingForm>
		</WelcomeLayout>
	);
};

export default WelcomePage;

const OnboardingForm = styled.form<{ $step: string }>`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	margin-top: ${({ $step }) => ($step === "genres" ? "0.75rem" : "2rem")};
	min-height: 0;
`;

const ErrorText = styled.p`
	margin: 0;
	color: #d4641c;
	font-size: 0.875rem;
	line-height: 1.4;
`;
