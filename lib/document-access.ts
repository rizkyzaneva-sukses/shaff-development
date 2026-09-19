type DocumentUser = { id: string; role: "ADMIN" | "LEAD" | "FINANCE" | "CMO" | "COO" };
import { isExecutor } from "@/lib/roles";
type ScopedDocument = {
  category: string;
  uploadedById: string;
  program: {
    client: { leadId: string | null };
    members: Array<{ userId: string; isActive: boolean }>;
  };
};

export function canReadDocument(user: DocumentUser, document: ScopedDocument) {
  if (document.category === "PAYMENT_PROOF") return user.role === "ADMIN" || user.role === "FINANCE";
  if (user.role === "ADMIN") return true;
  if (user.role === "LEAD") return document.program.client.leadId === user.id;
  if (isExecutor(user.role)) return document.program.members.some((member) => member.userId === user.id && member.isActive);
  return false;
}

export function canManageDocument(user: DocumentUser, document: ScopedDocument) {
  if (!canReadDocument(user, document)) return false;
  if (isExecutor(user.role)) return document.uploadedById === user.id;
  return true;
}

export function canReviewDocument(user: DocumentUser, document: ScopedDocument) {
  return canReadDocument(user, document) && !isExecutor(user.role);
}
