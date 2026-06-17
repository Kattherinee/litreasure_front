import type { InputHTMLAttributes } from "react";
import styled from "styled-components";

export interface IInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	disabled?: boolean;
	"aria-label"?: string;
	$height?: string;
	$width?: string;
}

const InputField = ({ disabled = false, ...props }: IInputFieldProps) => (
	<StyledInput {...props} disabled={disabled} />
);

export default InputField;

const StyledInput = styled.input<{ $height?: string; $width?: string }>`
	width: ${({ $width }) => $width ?? "100%"};
	min-height: ${({ $height }) => $height ?? "2.375rem"};
	border: 0.0625rem solid #bab7b4;
	border-radius: 20px;
	background: #ddd6d2;
	padding: 0.375vw 0.875vw;
	color: #04121a;
	font: inherit;
	font-size: 1rem;
	line-height: 1.12;
	outline: none;
	transition:
		background-color 180ms ease,
		border-color 180ms ease,
		color 180ms ease;

	&::placeholder {
		color: #9a9390;
		opacity: 1;
	}

	&:hover:not(:disabled) {
		border-color: #da8e5b;
		background: #ddd6d2;
	}

	&:focus,
	&:focus-visible {
		border-color: #da8e5b;
		background: #ddd6d2;
		color: #04121a;
	}

	&:disabled {
		border-color: #bab7b4;
		background: transparent;
		color: #8e8e8e;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		min-height: ${({ $height }) => $height ?? "3rem"};
	}
`;
