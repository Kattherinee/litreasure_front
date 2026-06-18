"use client";

import styled from "styled-components";

import { Button } from "@/shared/ui/Button";

interface IWelcomeActionsProps {
	canGoBack: boolean;
	isFinalStep: boolean;
	isNextDisabled: boolean;
	isSubmitting: boolean;
	isCheckingUsername: boolean;
	isSavingProfile: boolean;
	onBack: () => void;
	onFinish: () => void;
	onNext: () => void;
}

export const WelcomeActions = ({
	canGoBack,
	isFinalStep,
	isNextDisabled,
	isSubmitting,
	isCheckingUsername,
	isSavingProfile,
	onBack,
	onFinish,
	onNext,
}: IWelcomeActionsProps) => (
	<Actions $hasBackButton={canGoBack}>
		{canGoBack ? (
			<SecondaryButton type="button" buttonType="outlined" onClick={onBack}>
				Back
			</SecondaryButton>
		) : null}
		<RightActions>
			{isFinalStep ? (
				<PrimaryButton
					disabled={isSubmitting}
					type="button"
					buttonType="containedInverted"
					onClick={onFinish}
				>
					Finish
				</PrimaryButton>
			) : (
				<PrimaryButton
					disabled={isNextDisabled}
					type="button"
					buttonType="containedInverted"
					onClick={onNext}
				>
					{isCheckingUsername
						? "Checking..."
						: isSavingProfile
							? "Saving..."
							: "Next"}
				</PrimaryButton>
			)}
		</RightActions>
	</Actions>
);

const Actions = styled.div<{ $hasBackButton: boolean }>`
	display: flex;
	align-items: center;
	justify-content: ${({ $hasBackButton }) =>
		$hasBackButton ? "space-between" : "flex-end"};
	gap: 0.75rem;
	padding-top: 0.5rem;

	@media (max-width: 30rem) {
		justify-content: ${({ $hasBackButton }) =>
			$hasBackButton ? "space-between" : "flex-end"};
	}
`;

const RightActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const PrimaryButton = styled(Button)`
	&& {
		white-space: nowrap;
	}
`;

const SecondaryButton = styled(Button)`
	&& {
		white-space: nowrap;
	}
`;
