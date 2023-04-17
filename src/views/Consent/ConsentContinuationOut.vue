<template>
  <div id="consent-continuation-out">

    <!-- Initial Page Load Transition -->
    <v-fade-transition>
      <div class="loading-container" v-show="showLoadingContainer">
        <div class="loading__content">
          <v-progress-circular color="primary" :size="50" indeterminate />
          <div class="loading-msg">{{loadingMessage}}</div>
        </div>
      </div>
    </v-fade-transition>

    <!-- Main Body -->
    <v-container id="correction-container" class="view-container" v-show="dataLoaded">
      <v-row>
        <v-col cols="12">
          <article id="correction-article">

            <!-- Detail -->
            <section>
              <header>
                <h2 id="correction-step-1-header">1. Detail</h2>
                <p>Enter a detail that will appear on the ledger for this entity.</p>
                <p class="black--text mb-0">{{defaultComment}}</p>
              </header>
              <DetailComment
                v-model="detailComment"
                placeholder="Add a Detail that will appear on the ledger for this entity."
                :maxLength="maxDetailCommentLength"
                @valid="detailCommentValid=$event"
              />
            </section>

            <!-- Certify -->
            <section>
              <header>
                <h2 id="correction-step-2-header">2. Certify</h2>
                <p>Enter the legal name of the person authorized to complete and submit this correction.</p>
              </header>
              <Certify
                :isCertified.sync="isCertified"
                :certifiedBy.sync="certifiedBy"
                :entityDisplay="displayName()"
                :message="certifyText(FilingCodes.ANNUAL_REPORT_OT)"
                @valid="certifyFormValid=$event"
              />
            </section>
          </article>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Watch } from 'vue-property-decorator'
import { Getter, State } from 'vuex-class'
import { StatusCodes } from 'http-status-codes'
import { Navigate } from '@/utils'
import SbcFeeSummary from 'sbc-common-components/src/components/SbcFeeSummary.vue'
import Certify from '@/components/ConsentContinuationOut/Certify.vue'
import DetailComment from '@/components/ConsentContinuationOut/DetailComment.vue'
import { ConfirmDialog } from '@bcrs-shared-components/confirm-dialog'
import { PaymentErrorDialog, SaveErrorDialog } from '@/dialogs'
import { CommonMixin, DateMixin, EnumMixin, ResourceLookupMixin } from '@/mixins'
import { LegalServices } from '@/services/'
import { FilingCodes, FilingStatus, FilingTypes, RouteNames, SaveErrorReasons,
  StaffPaymentOptions } from '@/enums'
import { ConfirmDialogType, FilingDataIF, StaffPaymentIF } from '@/interfaces'

@Component({
  components: {
    Certify,
    ConfirmDialog,
    DetailComment,
    PaymentErrorDialog,
    SaveErrorDialog,
    SbcFeeSummary
  },
  mixins: [
    CommonMixin,
    DateMixin,
    EnumMixin,
    ResourceLookupMixin
  ]
})
export default class ConsentContinuationOut extends Vue {
  // Refs
  $refs!: {
    confirm: ConfirmDialogType
  }

  // FUTURE: change this to a getter
  @State filingData!: Array<FilingDataIF>

  @Getter getAuthWebUrl!: string
  @Getter getFoundingDate!: Date
  @Getter getLegalName!: string
  @Getter getPayApiUrl!: string
  @Getter isRoleStaff!: boolean

  // enum for template
  readonly FilingCodes = FilingCodes

  // variables for DetailComment component
  private detailComment = ''
  private detailCommentValid: boolean = null

  // variables for Certify component
  private certifiedBy = ''
  private isCertified = false
  private certifyFormValid: boolean = null

  // variables for staff payment
  private staffPaymentData = { option: StaffPaymentOptions.NONE } as StaffPaymentIF
  private staffPaymentDialog = false

  // variables for displaying dialogs
  private resumeErrorDialog = false
  private saveErrorReason: SaveErrorReasons = null
  private paymentErrorDialog = false

  // other variables
  private totalFee = 0
  private dataLoaded = false
  private loadingMessage = ''
  private filingId = 0 // id of this correction filing
  private savedFiling: any = null // filing during save
  private saving = false // true only when saving
  private savingResuming = false // true only when saving and resuming
  private filingPaying = false // true only when filing and paying
  private haveChanges = false
  private saveErrors = []
  private saveWarnings = []

  /** True if loading container should be shown, else False. */
  get showLoadingContainer (): boolean {
    // show loading container when data isn't yet loaded and when
    // no dialogs are displayed (otherwise dialogs may be hidden)
    return (!this.dataLoaded && !this.saveErrorReason && !this.paymentErrorDialog)
  }

  /** Default comment (ie, the first line of the detail comment). */
  get defaultComment (): string {
    return 'Six Month Consent to Continue Out'
  }

  /** Maximum length of detail comment. */
  get maxDetailCommentLength (): number {
    // = (max size in db) - (default comment length) - (Carriage Return)
    return 2000 - this.defaultComment.length - 1
  }

  /** The Base URL string. */
  get baseUrl (): string {
    return sessionStorage.getItem('BASE_URL')
  }

  /** True if page is valid, else False. */
  get isPageValid (): boolean {
    return (this.detailCommentValid && this.certifyFormValid)
  }

  /** True when saving, saving and resuming, or filing and paying. */
  get busySaving (): boolean {
    return (this.saving || this.savingResuming || this.filingPaying)
  }

  /** True if payment is required, else False. */
  get isPayRequired (): boolean {
    // FUTURE: modify rule here as needed
    return (this.totalFee > 0)
  }

  /** Called when component is created. */
  protected created (): void {
    // init
    this.setFilingData([])

    // before unloading this page, if there are changes then prompt user
    window.onbeforeunload = (event) => {
      if (this.haveChanges) {
        event.preventDefault()
        // NB: custom text is not supported in all browsers
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    // this is the id of THIS filing
    // if 0, this is a new filing
    // otherwise it's a draft filing
    this.filingId = +this.$route.params.filingId // number or NaN

    // if required data isn't set, go back to dashboard
    if (!this.getIdentifier || isNaN(this.filingId)) {
      this.$router.push({ name: RouteNames.DASHBOARD })
    }
  }

  /** Called when component is mounted. */
  async mounted (): Promise<void> {
    // wait until entire view is rendered (including all child components)
    // see https://v3.vuejs.org/api/options-lifecycle-hooks.html#mounted
    await this.$nextTick()

    if (this.filingId > 0) {
      this.loadingMessage = `Resuming Your Correction`
    } else {
      this.loadingMessage = `Preparing Your Correction`
    }

    // fetch draft (which may overwrite some properties)
    if (this.filingId > 0) {
      await this.fetchDraftFiling()
    }

    this.dataLoaded = true

    // always include correction code
    // use existing Priority and Waive Fees flags
    this.updateFilingData('add', FilingCodes.CONSENT_CONTINUATION_OUT, this.staffPaymentData.isPriority,
      (this.staffPaymentData.option === StaffPaymentOptions.NO_FEE))
  }

  /** Fetches the draft correction filing. */
  async fetchDraftFiling (): Promise<void> {
    const url = `businesses/${this.getIdentifier}/filings/${this.filingId}`
    await LegalServices.fetchFiling(url).then(filing => {
      // verify data
      if (!filing) throw new Error('Missing filing')
      if (!filing.header) throw new Error('Missing header')
      if (!filing.business) throw new Error('Missing business')
      if (!filing.consentContinuationOut) throw new Error('Missing consent continuation out object')
      if (filing.header.name !== FilingTypes.CONSENT_CONTINUATION_OUT) throw new Error('Invalid filing type')
      if (filing.header.status !== FilingStatus.DRAFT) throw new Error('Invalid filing status')
      if (filing.business.identifier !== this.getIdentifier) throw new Error('Invalid business identifier')
      if (filing.business.legalName !== this.getLegalName) throw new Error('Invalid business legal name')

      // load Certified By (but not Date)
      this.certifiedBy = filing.header.certifiedBy

      // load Staff Payment properties
      if (filing.header.routingSlipNumber) {
        this.staffPaymentData = {
          option: StaffPaymentOptions.FAS,
          routingSlipNumber: filing.header.routingSlipNumber,
          isPriority: filing.header.priority
        } as StaffPaymentIF
      } else if (filing.header.bcolAccountNumber) {
        this.staffPaymentData = {
          option: StaffPaymentOptions.BCOL,
          bcolAccountNumber: filing.header.bcolAccountNumber,
          datNumber: filing.header.datNumber,
          folioNumber: filing.header.folioNumber,
          isPriority: filing.header.priority
        } as StaffPaymentIF
      } else if (filing.header.waiveFees) {
        this.staffPaymentData = {
          option: StaffPaymentOptions.NO_FEE
        } as StaffPaymentIF
      } else {
        this.staffPaymentData = {
          option: StaffPaymentOptions.NONE
        } as StaffPaymentIF
      }

      // load Detail Comment, removing the first line (default comment)
      const comment: string = filing.consentContinuationOut.comment || ''
      this.detailComment = comment.split('\n').slice(1).join('\n')
    }).catch(error => {
      // eslint-disable-next-line no-console
      console.log('fetchDraftFiling() error =', error)
      this.resumeErrorDialog = true
    })
  }

  /** Builds and saves the filing. NB: Caller needs to catch exceptions. */
  async saveFiling (isDraft): Promise<any> {
    this.saveErrors = []
    this.saveWarnings = []

    // if this is a new filing, ensure there are no pending tasks
    if (this.filingId === 0) {
      const hasPendingTasks = await LegalServices.hasPendingTasks(this.getIdentifier)
        .catch(() => {
          this.saveErrors = [{ error: 'Unable to check server for pending tasks.' }]
          throw new Error()
        })

      if (hasPendingTasks) {
        this.saveErrors = [
          { error: 'Another draft filing already exists. Please complete it before creating a new filing.' }
        ]
        throw new Error()
      }
    }

    const header: any = {
      header: {
        name: FilingTypes.CONSENT_CONTINUATION_OUT,
        certifiedBy: this.certifiedBy || '',
        email: 'no_one@never.get',
        date: this.getCurrentDate // NB: API will reassign this date according to its clock
      }
    }

    switch (this.staffPaymentData.option) {
      case StaffPaymentOptions.FAS:
        header.header['routingSlipNumber'] = this.staffPaymentData.routingSlipNumber
        header.header['priority'] = this.staffPaymentData.isPriority
        break

      case StaffPaymentOptions.BCOL:
        header.header['bcolAccountNumber'] = this.staffPaymentData.bcolAccountNumber
        header.header['datNumber'] = this.staffPaymentData.datNumber
        header.header['folioNumber'] = this.staffPaymentData.folioNumber
        header.header['priority'] = this.staffPaymentData.isPriority
        break

      case StaffPaymentOptions.NO_FEE:
        header.header['waiveFees'] = true
        break

      case StaffPaymentOptions.NONE: // should never happen
        break
    }

    const business: any = {
      business: {
        foundingDate: this.dateToApi(this.getFoundingDate),
        identifier: this.getIdentifier,
        legalName: this.getLegalName,
        legalType: this.getLegalType
      }
    }

    const data: any = {
      [FilingTypes.CONSENT_CONTINUATION_OUT]: {
        // FUTURE: add more filing properties below
        details: `${this.defaultComment}\n${this.detailComment}`
      }
    }

    // build filing
    const filing = Object.assign({}, header, business, data)
    try {
      let ret
      if (this.filingId > 0) {
        // we have a filing id, so update an existing filing
        ret = await LegalServices.updateFiling(this.getIdentifier, filing, this.filingId, isDraft)
      } else {
        // filing id is 0, so create a new filing
        ret = await LegalServices.createFiling(this.getIdentifier, filing, isDraft)
      }
      return ret
    } catch (error) {
      // save errors or warnings, if any
      this.saveErrors = error?.response?.data?.errors || []
      this.saveWarnings = error?.response?.data?.warnings || []
      throw error
    }
  }

  @Watch('detailCommentValid')
  onDetailCommentValidChanged (): void {
    this.haveChanges = true
  }

  @Watch('certifyFormValid')
  onCertifyFormValidChanged (): void {
    this.haveChanges = true
  }

  @Watch('staffPaymentData')
  onStaffPaymentDataChanged (val: StaffPaymentIF): void {
    const waiveFees = (val.option === StaffPaymentOptions.NO_FEE)

    // apply Priority flag to CRCTN filing code only
    // simply re-add the CRCTN code with the updated Priority flag and existing Waive Fees flag
    this.updateFilingData('add', FilingCodes.CORRECTION, val.isPriority, waiveFees)

    // add/remove Waive Fees flag to all filing codes
    this.updateFilingData(waiveFees ? 'add' : 'remove', undefined, undefined, true)

    this.haveChanges = true
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/theme.scss';

.text-black {
  color: rgba(0,0,0,.87);
}

article {
  .v-card {
    line-height: 1.2rem;
    font-size: $px-14;
  }
}

header p,
section p {
  color: $gray6;
}

section + section {
  margin-top: 3rem;
}

h1 {
  margin-bottom: 1.25rem;
  line-height: 2rem;
  letter-spacing: -0.01rem;
}

h2 {
  margin-bottom: 0.25rem;
  margin-top: 3rem;
  font-size: 1.125rem;
}
</style>
