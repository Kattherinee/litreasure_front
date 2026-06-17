"use client";

import styled from "styled-components";

import { ChipTabs } from "@/shared/ui/ChipTabs";

export type IMyCreatorsTab = "all" | "public" | "mine";

interface IMyCreatorsTabsProps {
	activeTab: IMyCreatorsTab;
	allCount: number;
	mineCount: number;
	publicCount: number;
	className?: string;
	onChange: (tab: IMyCreatorsTab) => void;
}

export const MyCreatorsTabs = ({
	activeTab,
	allCount,
	mineCount,
	publicCount,
	className,
	onChange,
}: IMyCreatorsTabsProps) => (
	<Wrap className={className}>
		<ChipTabs
			activeId={activeTab}
			ariaLabel="Creator visibility"
			items={[
				{ count: allCount, id: "all", label: "All" },
				{ count: publicCount, id: "public", label: "Public" },
				{ count: mineCount, id: "mine", label: "Created by me" },
			]}
			onChange={(id) => onChange(id as IMyCreatorsTab)}
	/>
</Wrap>
);

const Wrap = styled.div`
	flex: 1 1 auto;
	min-width: 0;
`;
