import { RouteNames, Views } from '@/enums'

/**
 * The Restoration step template.
 */
export const ConsentContinuationOutSteps = [
  {
    id: 'step-1-btn',
    step: 1,
    icon: 'mdi-domain-plus',
    text: 'Six Month Consent\nto Continue Out',
    to: RouteNames.CONSENT_CONTINUATION_OUT,
    component: Views.CONSENT_CONTINUATION_OUT
  }
]
