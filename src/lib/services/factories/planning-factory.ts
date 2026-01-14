import { IPlanningService, Organization } from '../interfaces';
import { CrmPlanningService } from '../crm/planning-service';
import { SheetPlanningService } from '../sheet/planning-service';

export function getPlanningService(
  organization: Organization,
  userId: string,
  googleAccessToken?: string
): IPlanningService {
  if (organization.data_mode === 'sheet') {
    return new SheetPlanningService(organization.id, userId, googleAccessToken);
  }
  return new CrmPlanningService(organization.id, userId);
}
