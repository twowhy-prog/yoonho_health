"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CalendarIcon,
  Download,
  Edit,
  Plus,
  Search,
  Trash2,
  Camera,
  Heart,
  Baby,
  Cloud,
  CloudDownload,
  CloudUpload,
  CheckCircle,
  AlertCircle,
  BarChart3,
  User,
  Pill,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { MonthlyStats } from "@/components/monthly-stats"
import { MedicationReminder } from "@/components/medication-reminder"
import { ThemeToggle } from "@/components/theme-toggle"
import { SyncStatus } from "@/components/sync-status"
import { SyncStorage } from "@/lib/sync-storage"

interface DailyRecord {
  id: string
  date: string
  time: string
  food: string
  symptoms: string
  severity?: number
  medication: string
  memo: string
  photos: string[]
  author: string
}

const symptomOptions = [
  "없음",
  "발진",
  "가려움",
  "구토",
  "설사",
  "두드러기",
  "부종",
  "호흡곤란",
  "콧물",
  "눈물",
  "복통",
  "기타",
]

const authorOptions = ["아빠", "엄마"]

export default function YunhoDaily() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"today" | "all" | "stats" | "medication">("today")
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupStatus, setBackupStatus] = useState<"idle" | "success" | "error">("idle")
  const [backupMessage, setBackupMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<string>("아빠")

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    food: "",
    symptoms: "",
    severity: 1,
    medication: "",
    memo: "",
    photos: [] as string[],
    author: currentUser,
  })

  // Load records from localStorage on mount
  useEffect(() => {
    const savedRecords = SyncStorage.getItem("yunhoDailyRecords")
    if (savedRecords) {
      setRecords(savedRecords)
    }

    // 저장된 사용자 불러오기
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setCurrentUser(savedUser)
      setFormData((prev) => ({ ...prev, author: savedUser }))
    }
  }, [])

  // Save records to localStorage whenever records change
  useEffect(() => {
    SyncStorage.setItem("yunhoDailyRecords", records)
  }, [records])

  // Save current user
  useEffect(() => {
    localStorage.setItem("currentUser", currentUser)
    setFormData((prev) => ({ ...prev, author: currentUser }))
  }, [currentUser])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newPhotos: string[] = []
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (event) => {
            if (event.target?.result) {
              newPhotos.push(event.target.result as string)
              if (newPhotos.length === files.length) {
                setFormData((prev) => ({
                  ...prev,
                  photos: [...prev.photos, ...newPhotos].slice(0, 2), // 최대 2장
                }))
              }
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  // 백업 함수
  const backupToLocal = async () => {
    setIsBackingUp(true)
    setBackupStatus("idle")

    try {
      const backupData = {
        records,
        backupDate: new Date().toISOString(),
        appVersion: "1.0.0",
        recordCount: records.length,
      }

      const fileName = `윤호랑-하루하루-백업-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`
      const fileContent = JSON.stringify(backupData, null, 2)

      const blob = new Blob([fileContent], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)

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

  // 복원 함수
  const restoreFromFile = async (file: File) => {
    setIsRestoring(true)
    setBackupStatus("idle")

    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      if (backupData.records && Array.isArray(backupData.records)) {
        setRecords(backupData.records)
        setBackupStatus("success")
        setBackupMessage(`${backupData.records.length}개의 기록이 복원되었습니다!`)
      } else {
        throw new Error("잘못된 백업 파일 형식입니다.")
      }
    } catch (error) {
      setBackupStatus("error")
      setBackupMessage("복원 중 오류가 발생했습니다.")
    } finally {
      setIsRestoring(false)
      setTimeout(() => setBackupStatus("idle"), 5000)
    }
  }

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      restoreFromFile(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingRecord) {
      setRecords((prev) =>
        prev.map((record) => (record.id === editingRecord.id ? { ...formData, id: editingRecord.id } : record)),
      )
      setEditingRecord(null)
      setIsEditDialogOpen(false)
    } else {
      const newRecord: DailyRecord = {
        ...formData,
        id: Date.now().toString(),
      }
      setRecords((prev) => [newRecord, ...prev])
    }

    // Reset form
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      food: "",
      symptoms: "",
      severity: 1,
      medication: "",
      memo: "",
      photos: [],
      author: currentUser,
    })
  }

  const handleEdit = (record: DailyRecord) => {
    setEditingRecord(record)
    setFormData(record)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== id))
  }

  const exportToCSV = () => {
    const headers = ["날짜", "시간", "음식", "증상", "심각도", "약", "메모", "작성자", "사진수"]
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map((record) =>
        [
          record.date,
          record.time,
          record.food,
          record.symptoms,
          record.severity?.toString() || "",
          record.medication,
          record.memo,
          record.author || "미상",
          record.photos.length.toString(),
        ]
          .map((field) => `"${field.replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `윤호랑-하루하루-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter records
  const filteredRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (viewMode === "today") {
      recordDate.setHours(0, 0, 0, 0)
      if (recordDate.getTime() !== today.getTime()) return false
    }

    if (filterDate) {
      const filterDateOnly = new Date(filterDate)
      filterDateOnly.setHours(0, 0, 0, 0)
      recordDate.setHours(0, 0, 0, 0)
      if (recordDate.getTime() !== filterDateOnly.getTime()) return false
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        record.food.toLowerCase().includes(searchLower) ||
        record.symptoms.toLowerCase().includes(searchLower) ||
        record.medication.toLowerCase().includes(searchLower) ||
        record.memo.toLowerCase().includes(searchLower) ||
        (record.author && record.author.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  // 통계 페이지
  if (viewMode === "stats") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-3 py-6">
            <div className="flex items-center justify-center gap-3">
              <Baby className="w-8 h-8 text-orange-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                윤호랑 하루하루
              </h1>
              <Heart className="w-6 h-6 text-pink-500 fill-current" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">매일의 사랑, 매일의 기록</p>
          </div>

          <div className="flex justify-center">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
              <TabsList className="bg-orange-100 dark:bg-gray-800">
                <TabsTrigger value="today" className="data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                  오늘 기록
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                  전체 기록
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                  월간 통계
                </TabsTrigger>
                <TabsTrigger
                  value="medication"
                  className="data-[state=active]:bg-orange-400 data-[state=active]:text-white"
                >
                  투약 관리
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <MonthlyStats records={records} />
        </div>
      </div>
    )
  }

  // 투약 관리 페이지
  if (viewMode === "medication") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-3 py-6">
            <div className="flex items-center justify-center gap-3">
              <Baby className="w-8 h-8 text-orange-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                윤호랑 하루하루
              </h1>
              <Heart className="w-6 h-6 text-pink-500 fill-current" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">매일의 사랑, 매일의 기록</p>
          </div>

          <div className="flex justify-center">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
              <TabsList className="bg-orange-100 dark:bg-gray-800">
                <TabsTrigger value="today" className="data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                  오늘 기록
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                  전체 기록
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-orange-400 data-[state=active]:text-white">
                  월간 통계
                </TabsTrigger>
                <TabsTrigger
                  value="medication"
                  className="data-[state=active]:bg-orange-400 data-[state=active]:text-white"
                >
                  <Pill className="w-4 h-4 mr-1" />
                  투약 관리
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <MedicationReminder currentUser={currentUser} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 py-6">
          <div className="flex items-center justify-center gap-3">
            <Baby className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              윤호랑 하루하루
            </h1>
            <Heart className="w-6 h-6 text-pink-500 fill-current" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">매일의 사랑, 매일의 기록</p>

          {/* 사용자 선택 & 테마 토글 */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <Select value={currentUser} onValueChange={setCurrentUser}>
                <SelectTrigger className="w-24 h-8 border-orange-200 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {authorOptions.map((author) => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Add New Record Form */}
        <Card className="border-2 border-orange-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-gray-800 dark:to-gray-700">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <Plus className="w-5 h-5" />
              새로운 기록 추가
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-400">
              윤호의 소중한 하루를 기록해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-700 dark:text-gray-300 font-medium">
                    날짜
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-gray-700 dark:text-gray-300 font-medium">
                    시간
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                    required
                    className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author" className="text-gray-700 dark:text-gray-300 font-medium">
                    작성자
                  </Label>
                  <Select
                    value={formData.author}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, author: value }))}
                  >
                    <SelectTrigger className="border-orange-200 dark:border-gray-600 focus:border-orange-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {authorOptions.map((author) => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="food" className="text-gray-700 dark:text-gray-300 font-medium">
                  먹은 음식
                </Label>
                <Input
                  id="food"
                  placeholder="예: 바나나, 우유, 이유식"
                  value={formData.food}
                  onChange={(e) => setFormData((prev) => ({ ...prev, food: e.target.value }))}
                  required
                  className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms" className="text-gray-700 dark:text-gray-300 font-medium">
                  알러지 증상
                </Label>
                <Select
                  value={formData.symptoms}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, symptoms: value }))}
                >
                  <SelectTrigger className="border-orange-200 dark:border-gray-600 focus:border-orange-400">
                    <SelectValue placeholder="증상을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {symptomOptions.map((symptom) => (
                      <SelectItem key={symptom} value={symptom}>
                        {symptom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.symptoms && formData.symptoms !== "없음" && (
                <div className="space-y-2">
                  <Label htmlFor="severity" className="text-gray-700 dark:text-gray-300 font-medium">
                    증상 심각도 (1-10점)
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, severity: score }))}
                          className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
                            formData.severity === score
                              ? score <= 3
                                ? "bg-green-500 border-green-500 text-white"
                                : score <= 6
                                  ? "bg-yellow-500 border-yellow-500 text-white"
                                  : "bg-red-500 border-red-500 text-white"
                              : score <= 3
                                ? "border-green-300 hover:bg-green-50 dark:hover:bg-green-900"
                                : score <= 6
                                  ? "border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900"
                                  : "border-red-300 hover:bg-red-50 dark:hover:bg-red-900"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formData.severity <= 3 && "🟢 가벼움"}
                      {formData.severity > 3 && formData.severity <= 6 && "🟡 보통"}
                      {formData.severity > 6 && "🔴 심각"}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    1-3점: 가벼운 증상 | 4-6점: 보통 증상 | 7-10점: 심각한 증상
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="medication" className="text-gray-700 dark:text-gray-300 font-medium">
                  복용한 약 (선택사항)
                </Label>
                <Input
                  id="medication"
                  placeholder="예: 베나드릴 5ml, 해열제"
                  value={formData.medication}
                  onChange={(e) => setFormData((prev) => ({ ...prev, medication: e.target.value }))}
                  className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo" className="text-gray-700 dark:text-gray-300 font-medium">
                  메모
                </Label>
                <Textarea
                  id="memo"
                  placeholder="오늘 윤호의 특별한 순간이나 관찰사항을 적어주세요..."
                  value={formData.memo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                  rows={3}
                  className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 font-medium">사진 (최대 2장)</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                      disabled={formData.photos.length >= 2}
                    />
                    <Camera className="w-5 h-5 text-orange-500" />
                  </div>
                  {formData.photos.length > 0 && (
                    <div className="flex gap-2">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`업로드된 사진 ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-orange-200 dark:border-gray-600"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                            onClick={() => removePhoto(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium py-3"
              >
                {editingRecord ? "기록 수정하기" : "기록 저장하기"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* View Controls */}
        <Card className="border-orange-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                  <TabsList className="bg-orange-100 dark:bg-gray-800">
                    <TabsTrigger
                      value="today"
                      className="data-[state=active]:bg-orange-400 data-[state=active]:text-white"
                    >
                      오늘 기록
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-orange-400 data-[state=active]:text-white"
                    >
                      전체 기록
                    </TabsTrigger>
                    <TabsTrigger
                      value="stats"
                      className="data-[state=active]:bg-orange-400 data-[state=active]:text-white"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      월간 통계
                    </TabsTrigger>
                    <TabsTrigger
                      value="medication"
                      className="data-[state=active]:bg-orange-400 data-[state=active]:text-white"
                    >
                      <Pill className="w-4 h-4 mr-1" />
                      투약 관리
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="기록 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64 border-orange-200 dark:border-gray-600 focus:border-orange-400"
                    />
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start border-orange-200 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-gray-800 bg-transparent"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDate ? format(filterDate, "MM월 dd일", { locale: ko }) : "날짜 필터"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus locale={ko} />
                      <div className="p-3 border-t">
                        <Button variant="outline" size="sm" onClick={() => setFilterDate(undefined)} className="w-full">
                          필터 해제
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    className="border-orange-200 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-gray-800 bg-transparent"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV 내보내기
                  </Button>
                </div>
              </div>

              {/* 백업 및 복원 섹션 */}
              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">클라우드 백업</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      onClick={backupToLocal}
                      disabled={isBackingUp}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isBackingUp ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          백업 중...
                        </>
                      ) : (
                        <>
                          <CloudUpload className="w-4 h-4 mr-2" />
                          백업하기
                        </>
                      )}
                    </Button>

                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileRestore}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isRestoring}
                      />
                      <Button
                        variant="outline"
                        disabled={isRestoring}
                        className="border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-800 bg-transparent w-full"
                      >
                        {isRestoring ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            복원 중...
                          </>
                        ) : (
                          <>
                            <CloudDownload className="w-4 h-4 mr-2" />
                            복원하기
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 백업 상태 메시지 */}
                {backupStatus !== "idle" && (
                  <Alert
                    className={`mt-3 ${backupStatus === "success" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}
                  >
                    {backupStatus === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <AlertDescription
                      className={
                        backupStatus === "success"
                          ? "text-green-800 dark:text-green-300"
                          : "text-red-800 dark:text-red-300"
                      }
                    >
                      {backupMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <SyncStatus records={records} onDataSync={setRecords} />

        {/* Records Table */}
        <Card className="border-orange-200 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <CardTitle className="text-orange-800 dark:text-orange-300">
              기록 목록 ({filteredRecords.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Baby className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                <p className="text-lg mb-2">아직 기록이 없어요</p>
                <p className="text-sm">윤호의 첫 번째 기록을 추가해보세요!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-orange-800 dark:text-orange-300">날짜</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">시간</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">음식</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">증상</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">심각도</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">약</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">메모</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">작성자</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300">사진</TableHead>
                      <TableHead className="text-orange-800 dark:text-orange-300 w-20">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-orange-50 dark:hover:bg-gray-800">
                        <TableCell className="font-medium">
                          {format(new Date(record.date), "MM월 dd일", { locale: ko })}
                        </TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell className="max-w-32 truncate">{record.food}</TableCell>
                        <TableCell>
                          {record.symptoms && record.symptoms !== "없음" && (
                            <Badge
                              variant={record.symptoms === "없음" ? "secondary" : "destructive"}
                              className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            >
                              {record.symptoms}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.severity && record.symptoms !== "없음" && (
                            <div className="flex items-center gap-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  record.severity <= 3
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : record.severity <= 6
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {record.severity}점
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-24 truncate">{record.medication}</TableCell>
                        <TableCell className="max-w-32 truncate">{record.memo}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {record.author || "미상"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.photos.length > 0 && (
                            <div className="flex gap-1">
                              {record.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo || "/placeholder.svg"}
                                  alt={`사진 ${index + 1}`}
                                  className="w-8 h-8 object-cover rounded cursor-pointer border border-orange-200 dark:border-gray-600 hover:border-orange-400"
                                  onClick={() => setSelectedPhoto(photo)}
                                />
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(record)}
                              className="hover:bg-orange-100 dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(record.id)}
                              className="hover:bg-red-100 dark:hover:bg-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Preview Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>사진 미리보기</DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <div className="flex justify-center">
                <img
                  src={selectedPhoto || "/placeholder.svg"}
                  alt="확대된 사진"
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-orange-800 dark:text-orange-300">기록 수정</DialogTitle>
              <DialogDescription>윤호의 기록을 수정해보세요.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">날짜</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">시간</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                    required
                    className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-author">작성자</Label>
                  <Select
                    value={formData.author}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, author: value }))}
                  >
                    <SelectTrigger className="border-orange-200 dark:border-gray-600 focus:border-orange-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {authorOptions.map((author) => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-food">먹은 음식</Label>
                <Input
                  id="edit-food"
                  value={formData.food}
                  onChange={(e) => setFormData((prev) => ({ ...prev, food: e.target.value }))}
                  required
                  className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-symptoms">알러지 증상</Label>
                <Select
                  value={formData.symptoms}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, symptoms: value }))}
                >
                  <SelectTrigger className="border-orange-200 dark:border-gray-600 focus:border-orange-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {symptomOptions.map((symptom) => (
                      <SelectItem key={symptom} value={symptom}>
                        {symptom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.symptoms && formData.symptoms !== "없음" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-severity">증상 심각도 (1-10점)</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, severity: score }))}
                          className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
                            formData.severity === score
                              ? score <= 3
                                ? "bg-green-500 border-green-500 text-white"
                                : score <= 6
                                  ? "bg-yellow-500 border-yellow-500 text-white"
                                  : "bg-red-500 border-red-500 text-white"
                              : score <= 3
                                ? "border-green-300 hover:bg-green-50 dark:hover:bg-green-900"
                                : score <= 6
                                  ? "border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900"
                                  : "border-red-300 hover:bg-red-50 dark:hover:bg-red-900"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formData.severity <= 3 && "🟢 가벼움"}
                      {formData.severity > 3 && formData.severity <= 6 && "🟡 보통"}
                      {formData.severity > 6 && "🔴 심각"}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-medication">복용한 약</Label>
                <Input
                  id="edit-medication"
                  value={formData.medication}
                  onChange={(e) => setFormData((prev) => ({ ...prev, medication: e.target.value }))}
                  className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-memo">메모</Label>
                <Textarea
                  id="edit-memo"
                  value={formData.memo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                  rows={3}
                  className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label>사진</Label>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="border-orange-200 dark:border-gray-600 focus:border-orange-400"
                    disabled={formData.photos.length >= 2}
                  />
                  {formData.photos.length > 0 && (
                    <div className="flex gap-2">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`사진 ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-orange-200 dark:border-gray-600"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                            onClick={() => removePhoto(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500"
                >
                  수정 완료
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
