import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import type { IPersonConfig } from '@/types/storeType'

export function generateRandomAvatar(name: string): string {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b']
  // 根据名字计算颜色，固定颜色避免闪烁
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % colors.length
  const randomColor = colors[colorIndex]
  
  const firstChar = name ? name.charAt(0).toUpperCase() : '?'
  
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${randomColor}" rx="15" />
    <text x="50" y="50" dy=".35em" text-anchor="middle" fill="white" font-size="50" font-family="sans-serif" font-weight="bold">${firstChar}</text>
  </svg>`
  
  // 处理中文编码问题
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

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
    avatar: generateRandomAvatar(name),
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
