import { VuetifyRuleFunction } from '@/types'

export const MiddleNameRules: Array<VuetifyRuleFunction> = [
  v => !/^\s/g.test(v) || 'Invalid spaces', // leading spaces
  v => !/\s$/g.test(v) || 'Invalid spaces', // trailing spaces
  v => (!v || v.length <= 20) || 'Cannot exceed 20 characters' // maximum character count
]
