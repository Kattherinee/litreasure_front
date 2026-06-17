export type IWelcomeStep = "profile" | "avatar" | "genres" | "goal";
export type IGoalStartMode = "yearStart" | "today";

export interface IStepConfig {
	id: IWelcomeStep;
	label: string;
	skippable?: boolean;
}

export const STEPS: IStepConfig[] = [
	{ id: "profile", label: "Profile" },
	{ id: "avatar", label: "Avatar" },
	{ id: "genres", label: "Genres", skippable: true },
	{ id: "goal", label: "Goal", skippable: true },
];

export const MIN_SELECTED_GENRES = 5;
export const GOAL_PRESETS = [12, 24, 36, 52];
export const ONBOARDING_STORAGE_KEY = "litreasure-onboarding-draft";

export const STEP_IMAGES: Record<IWelcomeStep, string> = {
	profile: "/images/welcomePage/dracobook2.png",
	avatar: "/images/welcomePage/dracoFire.png",
	genres: "/images/welcomePage/dracoWitch1.png",
	goal: "/images/welcomePage/dracoSword2.png",
};

export const STEP_SUBTITLES: Record<IWelcomeStep, string> = {
	profile: "Every story starts with a name",
	avatar: "",
	genres:
		"Choose at least 5 genres you like. First open one or more groups, then pick genres inside them.",
	goal: "Read more. Live deeper.",
};
