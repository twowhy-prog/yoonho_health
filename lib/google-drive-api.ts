// Google Drive API 유틸리티 함수들

declare global {
  interface Window {
    gapi: any
  }
}

export interface BackupData {
  records: any[]
  backupDate: string
  appVersion: string
}

export class GoogleDriveBackup {
  private static instance: GoogleDriveBackup
  private isInitialized = false

  static getInstance(): GoogleDriveBackup {
    if (!GoogleDriveBackup.instance) {
      GoogleDriveBackup.instance = new GoogleDriveBackup()
    }
    return GoogleDriveBackup.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Google Drive API는 브라우저에서만 사용 가능합니다."))
        return
      }

      // Google API 스크립트 로드
      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => {
        window.gapi.load("auth2", () => {
          window.gapi.auth2
            .init({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
            })
            .then(() => {
              this.isInitialized = true
              resolve()
            })
            .catch(reject)
        })
      }
      script.onerror = () => reject(new Error("Google API 로드 실패"))
      document.head.appendChild(script)
    })
  }

  async signIn(): Promise<boolean> {
    try {
      await this.initialize()
      const authInstance = window.gapi.auth2.getAuthInstance()
      const user = await authInstance.signIn({
        scope: "https://www.googleapis.com/auth/drive.file",
      })
      return user.isSignedIn()
    } catch (error) {
      console.error("Google 로그인 실패:", error)
      return false
    }
  }

  async uploadBackup(data: BackupData): Promise<string> {
    try {
      const isSignedIn = await this.signIn()
      if (!isSignedIn) {
        throw new Error("Google 로그인이 필요합니다.")
      }

      // 실제 Google Drive API 호출 (데모용으로 로컬 다운로드)
      const dataStr = JSON.stringify(data, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `윤호랑-하루하루-백업-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)

      return "backup-file-id"
    } catch (error) {
      console.error("백업 업로드 실패:", error)
      throw error
    }
  }

  async downloadBackup(fileId: string): Promise<BackupData> {
    try {
      const isSignedIn = await this.signIn()
      if (!isSignedIn) {
        throw new Error("Google 로그인이 필요합니다.")
      }

      // 실제 환경에서는 Google Drive API를 사용하여 파일 다운로드
      // 데모용으로 빈 데이터 반환
      return {
        records: [],
        backupDate: new Date().toISOString(),
        appVersion: "1.0.0",
      }
    } catch (error) {
      console.error("백업 다운로드 실패:", error)
      throw error
    }
  }

  async listBackups(): Promise<Array<{ id: string; name: string; createdTime: string }>> {
    try {
      const isSignedIn = await this.signIn()
      if (!isSignedIn) {
        throw new Error("Google 로그인이 필요합니다.")
      }

      // 실제 환경에서는 Google Drive API를 사용하여 백업 파일 목록 조회
      return []
    } catch (error) {
      console.error("백업 목록 조회 실패:", error)
      throw error
    }
  }
}
