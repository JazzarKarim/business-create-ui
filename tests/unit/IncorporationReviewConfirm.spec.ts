import { shallowWrapperFactory } from '../jest-wrapper-factory'
import IncorporationReviewConfirm from '@/views/Incorporation/IncorporationReviewConfirm.vue'
import { IncorporationResources } from '@/resources/'
import SummaryDefineCompany from '@/components/Incorporation/SummaryDefineCompany.vue'
import ListPeopleAndRoles from '@/components/common/ListPeopleAndRoles.vue'
import Certify from '@/components/common/Certify.vue'

// Test Case Data
const reviewConfirmTestCases = [
  {
    entityType: 'CP'
  },
  {
    entityType: 'BEN'
  },
  {
    entityType: 'ULC'
  },
  {
    entityType: 'BC'
  },
  {
    entityType: 'CC'
  }
]

for (const test of reviewConfirmTestCases) {
  describe(`Review Confirm view for a ${test.entityType}`, () => {
    let wrapper: any

    it('renders the component properly', () => {
      wrapper = shallowWrapperFactory(IncorporationReviewConfirm, null, { entityType: test.entityType })

      // verify page content
      expect(wrapper.find('h2').text()).toBe('Review and Confirm')

      // verify Define company component displayed
      expect(wrapper.findComponent(SummaryDefineCompany).exists()).toBe(true)

      // verify People and roles component displayed
      expect(wrapper.findComponent(ListPeopleAndRoles).exists()).toBe(true)

      // verify Certify component displayed
      expect(wrapper.findComponent(Certify).exists()).toBe(true)
    })

    it('displays Certify section', () => {
      wrapper = shallowWrapperFactory(
        IncorporationReviewConfirm,
        null,
        { entityType: test.entityType },
        null,
        IncorporationResources
      )

      expect(wrapper.find('#certify-section').exists()).toBe(true)
    })

    it('displays Court Order and Plan of Arrangement section only for BEN, ULC, CC, BC', () => {
      wrapper = shallowWrapperFactory(
        IncorporationReviewConfirm,
        null,
        {
          entityType: test.entityType
        },
        null,
        IncorporationResources
      )

      expect(wrapper.find('#court-order-poa-section').exists()).toBe(['BEN', 'ULC', 'CC', 'BC']
        .includes(test.entityType))
    })

    // FUTURE: Expand unit testing for validation on step 5. Include routing to appropriate steps from error links.
  })
}
