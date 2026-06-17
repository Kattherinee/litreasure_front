import styled from "styled-components";
import { theme } from "@/shared/theme";

const InfoChip = styled.span`
	display: inline-flex;
	align-items: center;
	max-width: 100%;
	min-height: 2rem;
	gap: 0.42rem;
	border: 0.0625rem solid rgb(255 255 255 / 0.24);
	border-radius: 62.4375rem;
	background: rgb(174 176 178 / 0.82);
	padding: 0.34rem 0.72rem;
	box-shadow: 0 0.25rem 0.85rem rgb(4 18 26 / 0.05);
`;

export const InfoChipLabel = styled.span`
	color: rgb(255 255 255 / 0.7);
	font-size: 0.7rem;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

export const InfoChipValue = styled.span`
	min-width: 0;
	overflow: hidden;
	color: ${theme.colors.white};
	font-size: 0.9rem;
	font-weight: 800;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export default InfoChip;
