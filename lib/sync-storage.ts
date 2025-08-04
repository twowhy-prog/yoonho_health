"use client"

// 실시간 동기화를 위한 유틸리티
export class SyncStorage {
  private static SYNC_KEY = "yunho_sync_data"
  private static listeners: Array<(data: any) => void> = []

  // 데이터 저장 (동기화 포함)
  static setItem(key: string, data: any) {
    const syncData = {
      key,
      data,
      timestamp: new Date().toISOString(),
      deviceId: this.getDeviceId(),
    }

    // 로컬 스토리지에 저장
    localStorage.setItem(key, JSON.stringify(data))

    // 동기화 데이터 저장
    localStorage.setItem(this.SYNC_KEY, JSON.stringify(syncData))

    // 리스너들에게 알림
    this.notifyListeners(syncData)
  }

  // 데이터 가져오기
  static getItem(key: string) {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }

  // 기기 ID 생성
  static getDeviceId() {
    let deviceId = localStorage.getItem("device_id")
    if (!deviceId) {
      deviceId = "device_" + Math.random().toString(36).substr(2, 9)
      localStorage.setItem("device_id", deviceId)
    }
    return deviceId
  }

  // 동기화 상태 확인
  static getSyncStatus() {
    const syncData = localStorage.getItem(this.SYNC_KEY)
    return syncData ? JSON.parse(syncData) : null
  }

  // 리스너 등록
  static addListener(callback: (data: any) => void) {
    this.listeners.push(callback)
  }

  // 리스너들에게 알림
  static notifyListeners(data: any) {
    this.listeners.forEach((callback) => callback(data))
  }
}
