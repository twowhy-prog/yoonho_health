"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Plus, Trash2, Pill, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface MedicationReminder {
  id: string
  name: string
  dosage: string
  time: string
  isActive: boolean
  lastTaken?: string
  createdBy: string
}

interface MedicationReminderProps {
  currentUser: string
}

export function MedicationReminder({ currentUser }: MedicationReminderProps) {
  const [reminders, setReminders] = useState<MedicationReminder[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    time: "",
  })

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1분마다 업데이트

    return () => clearInterval(timer)
  }, [])

  // 로컬 스토리지에서 알림 불러오기
  useEffect(() => {
    const savedReminders = localStorage.getItem("medicationReminders")
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders))
    }
  }, [])

  // 알림 저장
  useEffect(() => {
    localStorage.setItem("medicationReminders", JSON.stringify(reminders))
  }, [reminders])

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // 알림 체크
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      const currentTimeStr = format(now, "HH:mm")

      // 테스트를 위해 초 단위 체크도 추가
      const currentTimeWithSeconds = format(now, "HH:mm:ss")

      reminders.forEach((reminder) => {
        if (reminder.isActive && reminder.time === currentTimeStr) {
          const lastTaken = reminder.lastTaken ? new Date(reminder.lastTaken) : null
          const today = format(now, "yyyy-MM-dd")
          const lastTakenDate = lastTaken ? format(lastTaken, "yyyy-MM-dd") : null

          if (lastTakenDate !== today) {
            showNotification(reminder)
          }
        }
      })
    }

    const timer = setInterval(checkReminders, 10000) // 10초마다 체크 (원래는 60000)
    return () => clearInterval(timer)
  }, [reminders])

  const showNotification = (reminder: MedicationReminder) => {
    // 브라우저 알림
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`💊 투약 시간이에요!`, {
        body: `${reminder.name} ${reminder.dosage}을(를) 복용할 시간입니다.`,
        icon: "/favicon.ico",
      })
    }

    // 사운드 알림 (선택사항)
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
    )
    audio.play().catch(() => {}) // 에러 무시
  }

  const addReminder = () => {
    if (formData.name && formData.dosage && formData.time) {
      const newReminder: MedicationReminder = {
        id: Date.now().toString(),
        name: formData.name,
        dosage: formData.dosage,
        time: formData.time,
        isActive: true,
        createdBy: currentUser,
      }

      setReminders((prev) => [...prev, newReminder])
      setFormData({ name: "", dosage: "", time: "" })
      setIsDialogOpen(false)
    }
  }

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder)),
    )
  }

  const markAsTaken = (id: string) => {
    setReminders((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, lastTaken: new Date().toISOString() } : reminder)),
    )
  }

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id))
  }

  const getNextReminderTime = () => {
    const activeReminders = reminders.filter((r) => r.isActive)
    if (activeReminders.length === 0) return null

    const now = new Date()
    const today = format(now, "yyyy-MM-dd")

    let nextReminder = null
    let minTimeDiff = Number.POSITIVE_INFINITY

    activeReminders.forEach((reminder) => {
      const reminderTime = new Date(`${today} ${reminder.time}`)
      const timeDiff = reminderTime.getTime() - now.getTime()

      if (timeDiff > 0 && timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff
        nextReminder = reminder
      }
    })

    return nextReminder
  }

  const nextReminder = getNextReminderTime()

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Pill className="w-5 h-5" />
          투약 알림 관리
        </CardTitle>
        <CardDescription className="text-purple-700">정시에 약을 복용할 수 있도록 알림을 설정하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 다음 알림 정보 */}
        {nextReminder && (
          <Alert className="border-purple-200 bg-purple-50">
            <Bell className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>다음 투약:</strong> {nextReminder.name} {nextReminder.dosage} - {nextReminder.time}
            </AlertDescription>
          </Alert>
        )}

        {/* 알림 추가 버튼 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
              <Plus className="w-4 h-4 mr-2" />새 투약 알림 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-purple-800">투약 알림 추가</DialogTitle>
              <DialogDescription>새로운 투약 알림을 설정하세요.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="med-name">약 이름</Label>
                <Input
                  id="med-name"
                  placeholder="예: 베나드릴, 해열제"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-dosage">용량</Label>
                <Input
                  id="med-dosage"
                  placeholder="예: 5ml, 1정"
                  value={formData.dosage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dosage: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-time">복용 시간</Label>
                <Input
                  id="med-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={addReminder} className="bg-purple-500 hover:bg-purple-600">
                  추가
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          onClick={() => {
            // 테스트용 즉시 알림
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`🧪 테스트 알림!`, {
                body: `알림 기능이 정상적으로 작동합니다!`,
                icon: "/favicon.ico",
              })
            } else {
              alert("브라우저 알림 권한을 허용해주세요!")
            }
          }}
          variant="outline"
          className="w-full border-green-200 hover:bg-green-50 text-green-700"
        >
          🧪 알림 테스트 (즉시 실행)
        </Button>

        {/* 알림 목록 */}
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Pill className="w-12 h-12 mx-auto mb-3 text-purple-300" />
              <p>설정된 투약 알림이 없습니다.</p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const lastTaken = reminder.lastTaken ? new Date(reminder.lastTaken) : null
              const today = format(new Date(), "yyyy-MM-dd")
              const lastTakenToday = lastTaken && format(lastTaken, "yyyy-MM-dd") === today

              return (
                <div
                  key={reminder.id}
                  className={`p-4 border rounded-lg ${
                    reminder.isActive ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${reminder.isActive ? "text-gray-900" : "text-gray-500"}`}>
                          {reminder.name}
                        </h3>
                        <Badge variant={reminder.isActive ? "default" : "secondary"}>
                          {reminder.isActive ? "활성" : "비활성"}
                        </Badge>
                        {lastTakenToday && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            복용완료
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {reminder.dosage} • {reminder.time} • 설정자: {reminder.createdBy}
                      </p>
                      {lastTaken && (
                        <p className="text-xs text-gray-500 mt-1">
                          마지막 복용: {format(lastTaken, "MM월 dd일 HH:mm", { locale: ko })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {reminder.isActive && !lastTakenToday && (
                        <Button
                          size="sm"
                          onClick={() => markAsTaken(reminder.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          복용완료
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleReminder(reminder.id)}
                        className={reminder.isActive ? "hover:bg-gray-100" : "hover:bg-purple-50"}
                      >
                        {reminder.isActive ? "비활성화" : "활성화"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReminder(reminder.id)}
                        className="hover:bg-red-100 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 알림 안내 */}
        <div className="bg-purple-100 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-purple-800 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            알림 설정 안내
          </h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• 브라우저 알림 권한을 허용해주세요</li>
            <li>• 정확한 시간에 알림을 받으려면 브라우저를 열어두세요</li>
            <li>• 복용 완료 버튼을 눌러 기록을 남기세요</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
