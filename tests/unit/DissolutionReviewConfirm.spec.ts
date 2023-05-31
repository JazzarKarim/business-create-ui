import { shallowWrapperFactory, wrapperFactory } from '../jest-wrapper-factory'
import DissolutionReviewConfirm from '@/views/Dissolution/DissolutionReviewConfirm.vue'
import { DissolutionResources } from '@/resources/'

// Test Case Data
const reviewConfirmTestCases = [
  {
    entityType: 'CP',
    isPremium: false,
    isStaff: true
  },
  {
    entityType: 'CP',
    isPremium: true,
    isStaff: false
  },
  {
    entityType: 'CP',
    isPremium: false,
    isStaff: false
  },
  {
    entityType: 'BEN',
    isPremium: false,
    isStaff: true
  },
  {
    entityType: 'BEN',
    isPremium: true,
    isStaff: false
  },
  {
    entityType: 'BEN',
    isPremium: false,
    isStaff: false
  }
]

for (const test of reviewConfirmTestCases) {
  const type = test.isPremium ? 'premium' : test.isStaff ? 'staff' : 'regular'

  describe(`Review Confirm view for a ${test.entityType} as a ${type} user`, () => {
    let wrapper: any

    it('renders the component properly', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        { entityType: test.entityType },
        null,
        DissolutionResources
      )

      // verify page content
      expect(wrapper.find('h2').text()).toBe('Review and Confirm')

      wrapper.destroy()
    })

    it('displays Effective Date Time section for corp', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        {
          entityType: test.entityType
        },
        null,
        DissolutionResources
      )

      const expected = (test.entityType !== 'CP')
      expect(wrapper.find('#effective-date-time-container').exists()).toBe(expected)

      wrapper.destroy()
    })

    it('displays Affidavit section', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        { entityType: test.entityType },
        null,
        DissolutionResources
      )

      expect(wrapper.find('#affidavit-summary').exists()).toBe(true)

      wrapper.destroy()
    })

    it('displays Resolution section', () => {
      wrapper = wrapperFactory(
        DissolutionReviewConfirm,
        null,
        { entityType: test.entityType },
        null,
        DissolutionResources
      )

      expect(wrapper.find('#resolution-summary').exists()).toBe(true)

      wrapper.destroy()
    })

    it('displays Documents Delivery section', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        { entityType: test.entityType },
        null,
        DissolutionResources
      )

      expect(wrapper.find('#document-delivery-section').exists()).toBe(true)

      wrapper.destroy()
    })

    it('displays Folio Number section only for premium', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        {
          entityType: test.entityType,
          accountInformation: { accountType: test.isPremium ? 'PREMIUM' : 'BASIC' }
        },
        null,
        DissolutionResources
      )

      expect(wrapper.find('#folio-number-section').exists()).toBe(test.isPremium)

      wrapper.destroy()
    })

    it('displays Certify section', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        { entityType: test.entityType },
        null,
        DissolutionResources
      )

      expect(wrapper.find('#certify-section').exists()).toBe(true)

      wrapper.destroy()
    })

    it('displays Court Order and Plan of Arrangement section only for staff', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        {
          entityType: test.entityType,
          tombstone: { keycloakRoles: test.isStaff ? ['staff'] : [] }
        },
        null,
        DissolutionResources
      )

      expect(wrapper.find('#court-order-poa-section').exists()).toBe(test.isStaff)

      wrapper.destroy()
    })

    it('displays Staff Payment section only for staff', () => {
      wrapper = shallowWrapperFactory(
        DissolutionReviewConfirm,
        null,
        {
          entityType: test.entityType,
          tombstone: { keycloakRoles: test.isStaff ? ['staff'] : [] }
        },
        null,
        DissolutionResources
      )

      expect(wrapper.find('#staff-payment-section').exists()).toBe(test.isStaff)

      wrapper.destroy()
    })

    // FUTURE: Expand unit testing for validation on step 5. Include routing to appropriate steps from error links.
  })
}
