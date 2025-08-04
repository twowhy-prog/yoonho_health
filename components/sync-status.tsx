"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, Monitor, FolderSyncIcon as Sync, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { SyncStorage } from "@/lib/sync-storage"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface SyncStatusProps {
  records: any[]
  onDataSync: (data: any[]) => void
}

export function SyncStatus({ records, onDataSync }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("desktop")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // 기기 타입 감지
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setDeviceType(isMobile ? "mobile" : "desktop")

    // 동기화 상태 확인
    const status = SyncStorage.getSyncStatus()
    setSyncStatus(status)

    if (status) {
      setLastSync(new Date(status.timestamp))
    }
  }, [])

  const handleManualSync = () => {
    // 현재 데이터를 동기화 저장소에 저장
    SyncStorage.setItem("yunhoDailyRecords", records)

    const newStatus = SyncStorage.getSyncStatus()
    setSyncStatus(newStatus)
    setLastSync(new Date())
  }

  const handleSyncFromOtherDevice = () => {
    // 다른 기기의 데이터 가져오기
    const syncedData = SyncStorage.getItem("yunhoDailyRecords")
    if (syncedData && Array.isArray(syncedData)) {
      onDataSync(syncedData)
      setLastSync(new Date())
    }
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 현재 기기 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {deviceType === "mobile" ? (
                <Smartphone className="w-5 h-5 text-blue-600" />
              ) : (
                <Monitor className="w-5 h-5 text-blue-600" />
              )}
              <span className="font-medium text-blue-800">현재 기기: {deviceType === "mobile" ? "모바일" : "PC"}</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {records.length}개 기록
              </Badge>
            </div>
          </div>

          {/* 동기화 상태 */}
          {lastSync ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                마지막 동기화: {format(lastSync, "MM월 dd일 HH:mm", { locale: ko })}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                아직 동기화되지 않았습니다. 다른 기기와 데이터를 공유하려면 동기화하세요.
              </AlertDescription>
            </Alert>
          )}

          {/* 동기화 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleManualSync} className="bg-blue-500 hover:bg-blue-600 text-white flex-1">
              <Sync className="w-4 h-4 mr-2" />
              현재 데이터 동기화
            </Button>

            <Button
              onClick={handleSyncFromOtherDevice}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50 flex-1 bg-transparent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다른 기기 데이터 가져오기
            </Button>
          </div>

          {/* 사용법 안내 */}
          <div className="bg-blue-100 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              <Sync className="w-4 h-4" />
              기기간 데이터 공유 방법
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>📱 모바일에서:</strong> "현재 데이터 동기화" 클릭
              </li>
              <li>
                • <strong>💻 PC에서:</strong> "다른 기기 데이터 가져오기" 클릭
              </li>
              <li>
                • <strong>🔄 정기적으로:</strong> 새 기록 추가 후 동기화 권장
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
