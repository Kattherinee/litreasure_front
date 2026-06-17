"use client";

import styled from "styled-components";

import { theme } from "@/shared/theme";

import type { IWelcomeStep } from "./types";
import { STEPS } from "./types";

interface IProps {
	activeStep: IWelcomeStep;
	activeStepIndex: number;
	canSkip?: boolean;
	onStepClick: (step: IWelcomeStep) => void;
	onSkip?: () => void;
}

export const StepTabs = ({
	activeStep,
	activeStepIndex,
	canSkip = false,
	onStepClick,
	onSkip,
}: IProps) => (
	<Header>
		<Tabs aria-label="Registration steps">
			{STEPS.map((step, index) => {
				const isActive = step.id === activeStep;
				const isComplete = index < activeStepIndex;
				return (
					<TabButton
						key={step.id}
						type="button"
						$isActive={isActive}
						$isComplete={isComplete}
						onClick={() => {
							if (index <= activeStepIndex) onStepClick(step.id);
						}}
					>
						<TabLine $isActive={isActive} $isComplete={isComplete} />
					</TabButton>
				);
			})}
		</Tabs>
		{canSkip && onSkip ? (
			<SkipButton type="button" onClick={onSkip}>
				Skip
			</SkipButton>
		) : null}
	</Header>
);

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-top: 1rem;
`;

const Tabs = styled.div`
	display: flex;
	flex: 1;
	align-items: flex-start;
	gap: 0.5rem;
`;

const SkipButton = styled.button`
	border: 0;
	background: transparent;
	padding: 0;
	color: #a3a09e;
	font: inherit;
	font-size: 0.875rem;
	white-space: nowrap;
	cursor: pointer;

	&:hover {
		color: ${theme.colors.softForeground};
	}
`;

const TabButton = styled.button<{ $isActive: boolean; $isComplete: boolean }>`
	display: flex;
	flex: ${({ $isActive }) => ($isActive ? 3 : 1)};
	flex-direction: column;
	align-items: stretch;
	border: 0;
	background: transparent;
	padding: 0;
	cursor: ${({ $isComplete, $isActive }) =>
		$isComplete || $isActive ? "pointer" : "default"};
	transition: flex 300ms ease;
`;

const TabLine = styled.span<{ $isActive: boolean; $isComplete: boolean }>`
	display: block;
	width: 100%;
	height: 0.1875rem;
	border-radius: 999px;
	background: ${({ $isActive, $isComplete }) =>
		$isActive ? "#da8e5b" : $isComplete ? "rgb(218 142 91 / 0.5)" : "#ddd6d2"};
	transition: background 200ms ease;
`;
