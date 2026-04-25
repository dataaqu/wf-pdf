export type PageItem = number | "ellipsis";

export function getPaginationItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result: PageItem[] = [1];
  const start = Math.max(2, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);

  if (start > 2) result.push("ellipsis");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < totalPages - 1) result.push("ellipsis");
  result.push(totalPages);

  return result;
}
