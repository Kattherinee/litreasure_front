export type IChallengePeriodType = "month" | "week" | "year";
export type IChallengeType = "books" | "pages";

export interface IBookChallengeProgressSegment {
	percent: number;
	remaining: number;
	target: number;
}

export interface IBookChallengeProgress {
	time: {
		elapsedDays: number;
		totalDays: number;
		remainingDays: number;
		percent: number;
		isStarted: boolean;
		isFinished: boolean;
	};
	books: IBookChallengeProgressSegment & {
		finished: number;
	};
	value: IBookChallengeProgressSegment & {
		current: number;
		unit: IChallengeType;
	};
}

export interface IBookChallenge {
	id: string;
	type: IChallengeType;
	periodType: IChallengePeriodType;
	targetValue: number;
	startDate: string;
	endDate: string;
	isActive: boolean;
	progress?: IBookChallengeProgress;
}

export interface ICreateBookChallengePayload {
	type: IChallengeType;
	periodType: IChallengePeriodType;
	targetValue: number;
	startDate: string;
	endDate: string;
	isActive?: boolean;
}

export type IUpdateBookChallengePayload = Partial<ICreateBookChallengePayload>;

export interface IAverageBookChallenge {
	period: IChallengePeriodType;
	averageTargetValue: number;
	usersCount: number;
	challengesCount: number;
}
