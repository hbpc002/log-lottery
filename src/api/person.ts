import type { IPersonSubmission } from '@/types/formType'
import request from './request'

export function api_submitPerson(data: IPersonSubmission) {
    return request<{ status: string, message?: string, id?: string }>({
        url: '/submit-person',
        method: 'POST',
        data,
    })
}
