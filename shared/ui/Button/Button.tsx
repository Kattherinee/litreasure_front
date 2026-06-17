import MuiButton, {
	type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";
import styled, { css } from "styled-components";

import { theme } from "@/shared/theme";

type IButtonType =
	| "contained"
	| "outlined"
	| "text"
	| "containedInverted"
	| "oxygenPill";

export interface IButtonProps extends Omit<
	MuiButtonProps,
	"disableElevation" | "variant"
> {
	buttonType?: IButtonType;
}

const Button = ({ buttonType = "contained", ...props }: IButtonProps) => {
	const muiVariant =
		buttonType === "containedInverted" || buttonType === "oxygenPill"
			? "contained"
			: buttonType;

	return (
		<StyledButton
			$buttonType={buttonType}
			disableElevation
			variant={muiVariant}
			{...props}
		/>
	);
};

export default Button;

const containedStyles = css`
	background: ${theme.colors.invertedText};
	border-color: ${theme.colors.invertedText};
	color: ${theme.colors.foreground};

	&:hover {
		background: ${theme.colors.orangeLight};
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
	}
`;

const containedInvertedStyles = css`
	background: ${theme.colors.orangeLight};
	border-color: ${theme.colors.orangeLight};
	color: ${theme.colors.invertedText};

	&:hover {
		background: ${theme.colors.bluePrimary};
		border-color: ${theme.colors.bluePrimary};
	}
`;

const outlinedStyles = css`
	background: ${theme.colors.transparent};
	border-color: ${theme.colors.lightText};
	color: ${theme.colors.lightText};

	&:hover {
		border-color: ${theme.colors.orangeDark};
		color: ${theme.colors.orangeDark};
	}
`;

const textStyles = css`
	background: ${theme.colors.transparent};
	border-color: ${theme.colors.transparent};
	color: ${theme.colors.invertedText};

	&:hover {
		background: ${theme.colors.transparent};
		border-color: ${theme.colors.transparent};
		color: ${theme.colors.orangeLight};
	}
`;

const oxygenPillStyles = css`
	min-width: 0;
	background: ${theme.colors.invertedText};
	border-color: ${theme.colors.invertedText};
	padding: 0.6vw 1vw;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.94vw;
	font-weight: 400;
	line-height: 1.25rem;

	&:hover {
		background: ${theme.colors.orangeLight};
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
	}
`;

const StyledButton = styled(MuiButton)<{
	$buttonType: IButtonType;
}>`
	&& {
		border: 1px solid ${theme.colors.transparent};
		border-radius: 50px;
		font-family: ${theme.fonts.serif};
		font-size: 0.98rem;
		font-weight: 500;
		line-height: 1.15vw;
		text-align: center;
		text-transform: none;
		transition:
			background-color 180ms ease,
			border-color 180ms ease,
			color 180ms ease;

		&.Mui-disabled {
			border-color: ${theme.colors.muted};
			background: ${theme.colors.transparent};
			color: ${theme.colors.muted};
			cursor: not-allowed;
		}

		${({ $buttonType }) => {
			if ($buttonType === "outlined") return outlinedStyles;
			if ($buttonType === "text") return textStyles;
			if ($buttonType === "containedInverted") return containedInvertedStyles;
			if ($buttonType === "oxygenPill") return oxygenPillStyles;
			return containedStyles;
		}}
		@media (max-width: ${theme.rubberSize.tablet}) {
			font-size: 0.94rem;
			line-height: 1.25rem;
		}
	}
`;
