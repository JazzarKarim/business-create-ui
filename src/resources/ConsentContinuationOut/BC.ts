import { FilingCodes } from '@/enums'
import { CorpTypeCd } from '@bcrs-shared-components/enums/'
import { GetCorpFullDescription } from '@bcrs-shared-components/corp-type-module'
import { ConsentContinuationOutSteps } from './steps'

export const ConsentContinuationOutResourceBc: any = {
  entityType: CorpTypeCd.BC_COMPANY,
  displayName: GetCorpFullDescription(CorpTypeCd.BC_COMPANY),
  steps: ConsentContinuationOutSteps,
  filingData: [{
    entityType: CorpTypeCd.BC_COMPANY,
    filingTypeCode: FilingCodes.CONSENT_CONTINUATION_OUT
  }],
  detailsTitle: 'Company Details'
}
