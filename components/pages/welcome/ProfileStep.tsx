import styled from "styled-components";

import { InputField } from "@/shared/ui/InputField";

import {
	FieldGroup,
	FieldLabel,
	StepBody,
	StepDescription,
	StepTitle,
} from "./stepStyles";

interface IProfileStepProps {
	name: string;
	username: string;
	hasUsernameError: boolean;
	onNameChange: (value: string) => void;
	onUsernameChange: (value: string) => void;
}

export const ProfileStep = ({
	name,
	username,
	hasUsernameError,
	onNameChange,
	onUsernameChange,
}: IProfileStepProps) => (
	<StepBody>
		<StepTitle>How should we call you?</StepTitle>
		<StepDescription>
			Your username is your unique name in Litreasure.
		</StepDescription>
		<FieldGroup>
			<FieldLabel htmlFor="welcome-name">Name</FieldLabel>
			<ProfileInput
				id="welcome-name"
				autoComplete="name"
				required
				value={name}
				onChange={(e) => onNameChange(e.target.value)}
			/>
		</FieldGroup>
		<FieldGroup>
			<FieldLabel htmlFor="welcome-username">Username</FieldLabel>
			<ProfileInput
				id="welcome-username"
				autoComplete="username"
				aria-invalid={hasUsernameError}
				$hasError={hasUsernameError}
				minLength={3}
				required
				value={username}
				onChange={(e) => onUsernameChange(e.target.value)}
			/>
		</FieldGroup>
	</StepBody>
);

const ProfileInput = styled(InputField)<{ $hasError?: boolean }>`
	&& {
		border-color: ${({ $hasError }) => ($hasError ? "#e7a29a" : undefined)};
		box-shadow: ${({ $hasError }) =>
			$hasError ? "0 0 0 0.1875rem rgb(231 162 154 / 0.2)" : undefined};

		&:hover:not(:disabled),
		&:focus,
		&:focus-visible {
			border-color: ${({ $hasError }) => ($hasError ? "#d97970" : undefined)};
		}
	}
`;
