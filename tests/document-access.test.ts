import assert from "node:assert/strict";
import test from "node:test";
import { canManageDocument, canReadDocument, canReviewDocument } from "../lib/document-access";

const program = {
  client: { leadId: "lead-1" },
  members: [{ userId: "member-1", isActive: true }, { userId: "member-2", isActive: false }],
};
const normal = { category: "DELIVERABLE", uploadedById: "member-1", program };
const proof = { ...normal, category: "PAYMENT_PROOF" };

test("payment proof is limited to Admin and Finance regardless of program membership", () => {
  for (const user of [{ id: "lead-1", role: "LEAD" }, { id: "member-1", role: "CMO" }] as const) {
    assert.equal(canReadDocument(user, proof), false);
    assert.equal(canManageDocument(user, proof), false);
    assert.equal(canReviewDocument(user, proof), false);
  }
  for (const user of [{ id: "admin-1", role: "ADMIN" }, { id: "finance-1", role: "FINANCE" }] as const) {
    assert.equal(canReadDocument(user, proof), true);
    assert.equal(canReviewDocument(user, proof), true);
  }
});

test("Finance cannot inspect operational documents", () => {
  const finance = { id: "finance-1", role: "FINANCE" } as const;
  assert.equal(canReadDocument(finance, normal), false);
  assert.equal(canManageDocument(finance, normal), false);
});

test("members can manage only their own uploads in active programs", () => {
  const owner = { id: "member-1", role: "CMO" } as const;
  const other = { id: "member-3", role: "CMO" } as const;
  const inactive = { id: "member-2", role: "CMO" } as const;
  assert.equal(canManageDocument(owner, normal), true);
  assert.equal(canReviewDocument(owner, normal), false);
  assert.equal(canManageDocument(other, normal), false);
  assert.equal(canReadDocument(inactive, normal), false);
  assert.equal(canManageDocument(owner, { ...normal, uploadedById: "admin-1" }), false);
});
