import { getAdminExampleManagement } from "./admin-example-management.mock";
import { getSupportManagement } from "./admin-support-management.mock";

export function resolveAdminExampleManagement() {
  return getAdminExampleManagement();
}

export function resolveSupportManagement() {
  return getSupportManagement();
}
