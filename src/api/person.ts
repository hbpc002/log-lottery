import request from './request'
import type { IPersonSubmission } from '@/types/formType'

export function api_submitPerson(data: IPersonSubmission) {
  return request<{ status: string; message?: string; id?: string }>( {
    url: '/submit-person',
    method: 'POST',
    data
  })
}
