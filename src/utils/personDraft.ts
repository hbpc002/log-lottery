import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import type { IPersonConfig } from '@/types/storeType'

export function createDraftPerson(name: string, phone?: string): IPersonConfig {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const id = Date.now()
  return {
    id,
    uid: `U${id}`,
    uuid: uuidv4(),
    name,
    department: '',
    identity: '',
    avatar: '',
    isWin: false,
    x: 0,
    y: 0,
    createTime: now,
    updateTime: now,
    prizeName: [],
    prizeId: [],
    prizeTime: [],
    phone: phone ?? '',
  }
}
