import type { IBookSort } from "@/shared/api/books";
import GenrePage from "@/components/pages/GenrePage";

interface IPageProps {
	params: Promise<{
		slug: string;
	}>;
	searchParams: Promise<{
		sort?: string;
	}>;
}

const isBookSort = (sort?: string): sort is IBookSort =>
	sort === "newest" || sort === "popular" || sort === "rating";

export default async function GenreRoute({ params, searchParams }: IPageProps) {
	const { slug } = await params;
	const { sort } = await searchParams;

	return <GenrePage slug={slug} sort={isBookSort(sort) ? sort : undefined} />;
}
