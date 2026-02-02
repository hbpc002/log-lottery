import type { IPersonSubmission } from '@/types/formType'
import request from './request'

export function api_submitPerson(data: IPersonSubmission) {
    return request<{ status: string, message?: string, id?: string }>({
        url: '/submit-person',
        method: 'POST',
        data,
    })
}

export function api_deletePerson(data: { name: string, phone: string }) {
    return request<{ status: string, message?: string }>({
        url: '/delete-person',
        method: 'POST',
        data,
    })
}
