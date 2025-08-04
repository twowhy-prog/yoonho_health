"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Cloud, CloudUpload, CloudDownload, CheckCircle, AlertCircle, Calendar, FileText } from "lucide-react"
import { format } from "date-fns"

interface BackupManagerProps {
  records: any[]
  onRestore: (records: any[]) => void
}

export function BackupManager({ records, onRestore }: BackupManagerProps) {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupStatus, setBackupStatus] = useState<"idle" | "success" | "error">("idle")
  const [backupMessage, setBackupMessage] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleBackup = async () => {
    setIsBackingUp(true)
    setBackupStatus("idle")

    try {
      const backupData = {
        records,
        backupDate: new Date().toISOString(),
        appVersion: "1.0.0",
        recordCount: records.length,
      }

      const dataStr = JSON.stringify(backupData, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `윤호랑-하루하루-백업-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`
      a.click()
      window.URL.revokeObjectURL(url)

      // 시뮬레이션: 1초 후 성공
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setBackupStatus("success")
      setBackupMessage(`${records.length}개의 기록이 성공적으로 백업되었습니다!`)
    } catch (error) {
      setBackupStatus("error")
      setBackupMessage("백업 중 오류가 발생했습니다.")
    } finally {
      setIsBackingUp(false)
      setTimeout(() => setBackupStatus("idle"), 5000)
    }
  }

  const handleRestore = async (file: File) => {
    setIsRestoring(true)
    setBackupStatus("idle")

    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      if (backupData.records && Array.isArray(backupData.records)) {
        onRestore(backupData.records)
        setBackupStatus("success")
        setBackupMessage(`${backupData.records.length}개의 기록이 성공적으로 복원되었습니다!`)
        setIsDialogOpen(false)
      } else {
        throw new Error("잘못된 백업 파일 형식입니다.")
      }
    } catch (error) {
      setBackupStatus("error")
      setBackupMessage("복원 중 오류가 발생했습니다. 올바른 백업 파일인지 확인해주세요.")
    } finally {
      setIsRestoring(false)
      setTimeout(() => setBackupStatus("idle"), 5000)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleRestore(file)
    }
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Cloud className="w-5 h-5" />
          클라우드 백업 & 복원
        </CardTitle>
        <CardDescription className="text-blue-700">
          소중한 기록을 안전하게 백업하고 다른 기기에서 복원하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 백업 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">데이터 백업</span>
            </div>
            <p className="text-sm text-blue-700">현재 {records.length}개의 기록을 백업할 수 있습니다.</p>
            <Button
              onClick={handleBackup}
              disabled={isBackingUp || records.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isBackingUp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  백업 중...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 mr-2" />
                  지금 백업하기
                </>
              )}
            </Button>
          </div>

          {/* 복원 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CloudDownload className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-indigo-800">데이터 복원</span>
            </div>
            <p className="text-sm text-indigo-700">백업 파일을 선택하여 기록을 복원하세요.</p>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-indigo-200 hover:bg-indigo-50 bg-transparent"
                  disabled={isRestoring}
                >
                  <CloudDownload className="w-4 h-4 mr-2" />
                  백업에서 복원
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-indigo-800">데이터 복원</DialogTitle>
                  <DialogDescription>
                    백업 파일을 선택하여 기록을 복원합니다. 기존 데이터는 새로운 데이터로 교체됩니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-indigo-200 rounded-lg p-6 text-center">
                    <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-3">백업 파일(.json)을 선택해주세요</p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isRestoring}
                      />
                      <Button
                        variant="outline"
                        disabled={isRestoring}
                        className="border-indigo-200 hover:bg-indigo-50 bg-transparent"
                      >
                        {isRestoring ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
                            복원 중...
                          </>
                        ) : (
                          "파일 선택"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 백업 상태 메시지 */}
        {backupStatus !== "idle" && (
          <Alert
            className={`${backupStatus === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            {backupStatus === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={backupStatus === "success" ? "text-green-800" : "text-red-800"}>
              {backupMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* 백업 안내 */}
        <div className="bg-blue-100 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-800 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            백업 권장사항
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 정기적으로 백업하여 데이터 손실을 방지하세요</li>
            <li>• 백업 파일은 안전한 곳에 보관하세요</li>
            <li>• 새 기기에서 복원할 때 백업 파일을 사용하세요</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
