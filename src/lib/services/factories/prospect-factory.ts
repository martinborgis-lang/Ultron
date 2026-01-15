import { IProspectService, Organization } from '../interfaces';
import { CrmProspectService } from '../crm/prospect-service';
import { SheetProspectService } from '../sheet/prospect-service';

export function getProspectService(organization: Organization): IProspectService {
  if (organization.data_mode === 'sheet') {
    return new SheetProspectService(organization);
  }
  return new CrmProspectService(organization.id);
}
