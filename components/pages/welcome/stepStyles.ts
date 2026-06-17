import styled from "styled-components";

import { theme } from "@/shared/theme";

export const StepBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

export const StepTitle = styled.h2`
	margin: 0;
	color: #04121a;
	font-family: ${theme.fonts.serif};
	font-size: 1.75rem;
	font-weight: 600;
	line-height: 1.1;
`;

export const StepDescription = styled.p`
	margin-block: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.875rem;
	line-height: 1.5;
`;

export const StepTitleRow = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 1rem;
`;

export const FieldGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

export const FieldLabel = styled.label`
	color: #233d4d;
	font-size: 0.9rem;
	font-weight: 400;
	line-height: 1.5rem;
`;
