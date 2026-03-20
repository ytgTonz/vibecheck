export const ADMIN_PAGE_SIZE = 50;

export function getTargetPageAfterDelete(currentPage, itemCount, totalCount, pageSize = ADMIN_PAGE_SIZE) {
  const nextTotal = Math.max(0, totalCount - 1);
  const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));

  if (itemCount <= 1 && currentPage > 1) {
    return Math.min(currentPage - 1, nextTotalPages);
  }

  return Math.min(currentPage, nextTotalPages);
}
