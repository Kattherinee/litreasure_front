import SeriesPage from "@/components/pages/SeriesPage";

interface IPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function SeriesRoute({ params }: IPageProps) {
	const { id } = await params;

	return <SeriesPage id={id} />;
}
