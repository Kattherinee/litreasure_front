import { useState } from "react";
import styled from "styled-components";

import { useAverageChallengeQuery } from "@/shared/api/book-challenge";
import { theme } from "@/shared/theme";

import { StepBody, StepDescription, StepTitle } from "./stepStyles";
import { GOAL_PRESETS, type IGoalStartMode } from "./types";

interface IGoalStepProps {
	goalStartMode: IGoalStartMode;
	yearGoal: number;
	onGoalChange: (value: number) => void;
	onGoalStartModeChange: (value: IGoalStartMode) => void;
}

const clampGoal = (value: number) => Math.min(999, Math.max(1, value));

export const GoalStep = ({
	goalStartMode,
	yearGoal,
	onGoalChange,
	onGoalStartModeChange,
}: IGoalStepProps) => {
	const [draftGoal, setDraftGoal] = useState(yearGoal ? String(yearGoal) : "");
	const {
		data: averageChallenge,
		isError: isAverageError,
		isLoading: isAverageLoading,
	} = useAverageChallengeQuery("year");
	const hasGoal = draftGoal.length > 0 && yearGoal > 0;
	const averageTarget = averageChallenge?.averageTargetValue ?? 0;
	const roundedAverageTarget = Math.round(averageTarget);

	const commitDraftGoal = () => {
		if (!draftGoal) {
			onGoalChange(0);
			return;
		}

		const nextGoal = Number(draftGoal);
		const normalizedGoal = Number.isFinite(nextGoal) ? clampGoal(nextGoal) : 1;
		onGoalChange(normalizedGoal);
		setDraftGoal(String(normalizedGoal));
	};

	const handleDraftChange = (value: string) => {
		const digitsOnly = value.replace(/\D/g, "");
		setDraftGoal(digitsOnly);

		if (digitsOnly) {
			onGoalChange(clampGoal(Number(digitsOnly)));
		} else {
			onGoalChange(0);
		}
	};

	const selectPreset = (preset: number) => {
		setDraftGoal(String(preset));
		onGoalChange(preset);
	};

	return (
		<GoalStepBody>
			<StepTitle>Yearly Goal</StepTitle>
			<StepDescription>
				A reading goal helps keep you motivated. How many books do you want to
				read this year?
			</StepDescription>
			<GoalLayout>
				<GoalLeft>
					<GoalStartField>
						<GoalStartLabel>Start challenge</GoalStartLabel>
						<GoalStartOptions>
							<GoalStartOption
								type="button"
								$isActive={goalStartMode === "yearStart"}
								onClick={() => onGoalStartModeChange("yearStart")}
							>
								From the start of the year
							</GoalStartOption>
							<GoalStartOption
								type="button"
								$isActive={goalStartMode === "today"}
								onClick={() => onGoalStartModeChange("today")}
							>
								From today
							</GoalStartOption>
						</GoalStartOptions>
					</GoalStartField>
					<GoalInputRow>
						<GoalInputColumn>
							<GoalCounter>
								<GoalNumberInput
									aria-label="Number of books per year"
									inputMode="numeric"
									$isEmpty={!draftGoal}
									placeholder="24"
									value={draftGoal}
									onBlur={commitDraftGoal}
									onChange={(event) => handleDraftChange(event.target.value)}
								/>
							</GoalCounter>
						</GoalInputColumn>
						<AverageComparison>
							<AverageLabel>Average reader goal</AverageLabel>
							{isAverageLoading ? (
								<AverageText>Comparing with other goals...</AverageText>
							) : isAverageError || !averageChallenge ? (
								<AverageText>Could not load the average value yet.</AverageText>
							) : (
								<>
									<AverageValue>
										{roundedAverageTarget} books / year
									</AverageValue>
								</>
							)}
						</AverageComparison>
					</GoalInputRow>
					<GoalPresetsRow>
						{GOAL_PRESETS.map((preset) => (
							<GoalPreset
								key={preset}
								type="button"
								$isActive={yearGoal === preset}
								onClick={() => selectPreset(preset)}
							>
								{preset}
							</GoalPreset>
						))}
					</GoalPresetsRow>
					<GoalHint>
						{!hasGoal
							? "For example, two books per month is a great habit"
							: yearGoal <= 12
								? "Great start - one book per month"
								: yearGoal <= 24
									? "Two books per month is a solid habit"
									: yearGoal <= 52
										? "Almost one book per week - true reader mode"
										: "Legendary pace! Are you sure you're ready?"}
					</GoalHint>
				</GoalLeft>
			</GoalLayout>
		</GoalStepBody>
	);
};

const GoalStepBody = styled(StepBody)`
	gap: 1.15rem;
`;

const GoalLayout = styled.div`
	display: flex;
	flex: 1;
	align-items: center;
	gap: 2rem;
	margin-top: 0.35rem;
	min-height: 0;
`;

const GoalLeft = styled.div`
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	gap: 1.15rem;
`;

const GoalCounter = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`;

const GoalInputRow = styled.div`
	display: flex;
	width: min(100%, 35rem);
	align-items: center;
	flex-direction: column;
	gap: 1rem;

	@media (max-width: 38rem) {
		grid-template-columns: 1fr;
	}
`;

const GoalInputColumn = styled.div`
	display: grid;
	justify-items: center;
	gap: 0.45rem;
`;

const GoalNumberInput = styled.input<{ $isEmpty: boolean }>`
	width: 5.25rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.18);
	border-radius: 0.75rem;
	background: ${({ $isEmpty }) =>
		$isEmpty ? "rgb(218 142 91 / 0.08)" : "transparent"};
	padding: 0.25rem 0.35rem;
	color: #04121a;
	font-family: ${theme.fonts.serif};
	font-size: 4rem;
	font-weight: 600;
	line-height: 1;
	text-align: center;
	outline: none;
	box-shadow: ${({ $isEmpty }) =>
		$isEmpty ? "0 0 0 0.125rem rgb(218 142 91 / 0.18)" : "none"};
	transition:
		background-color 150ms,
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

const GoalStartField = styled.div`
	display: grid;
	justify-items: center;
	gap: 0.55rem;
`;

const GoalStartLabel = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;
`;

const GoalStartOptions = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.55rem;
`;

const GoalStartOption = styled.button<{ $isActive: boolean }>`
	border: 0.0625rem solid
		${({ $isActive }) => ($isActive ? "#da8e5b" : "rgb(186 183 180 / 0.52)")};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.12)" : "transparent"};
	padding: 0.38rem 0.85rem;
	color: ${({ $isActive }) =>
		$isActive ? "#da8e5b" : theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	font-weight: 700;
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

const GoalPresetsRow = styled.div`
	display: flex;
	gap: 0.65rem;
`;

const GoalPreset = styled.button<{ $isActive: boolean }>`
	border: 0.0625rem solid
		${({ $isActive }) => ($isActive ? "#da8e5b" : "rgb(186 183 180 / 0.6)")};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.12)" : "transparent"};
	padding: 0.3rem 0.85rem;
	color: ${({ $isActive }) => ($isActive ? "#da8e5b" : "#bab7b4")};
	font: inherit;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 150ms,
		border-color 150ms,
		color 150ms;

	&:hover {
		border-color: #da8e5b;
		color: #da8e5b;
	}
`;

const GoalHint = styled.p`
	margin: 0.1rem 0 0.85rem;
	color: ${theme.colors.softForeground};
	font-size: 0.875rem;
	font-style: italic;
	line-height: 1.4;
`;

const AverageComparison = styled.div`
	display: flex;
	flex-direction: column;
	width: fit-content;
	gap: 0.35rem;

	border-radius: 0.75rem;

	padding: 0.25rem 0rem;
`;

const AverageLabel = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;
	line-height: 1.2;
`;

const AverageValue = styled.strong`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.8rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.25rem;
	font-weight: 600;
	line-height: 1.15;
`;

const AverageText = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
	line-height: 1.4;
`;
