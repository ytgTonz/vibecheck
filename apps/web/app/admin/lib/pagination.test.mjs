import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_PAGE_SIZE, getTargetPageAfterDelete } from "./pagination.mjs";

test("keeps the current page when rows remain after delete", () => {
  const nextPage = getTargetPageAfterDelete(2, 5, 55);
  assert.equal(nextPage, 2);
});

test("moves back one page when deleting the last row on a later page", () => {
  const nextPage = getTargetPageAfterDelete(3, 1, ADMIN_PAGE_SIZE * 2 + 1);
  assert.equal(nextPage, 2);
});

test("never returns a page less than 1", () => {
  const nextPage = getTargetPageAfterDelete(1, 1, 1);
  assert.equal(nextPage, 1);
});
