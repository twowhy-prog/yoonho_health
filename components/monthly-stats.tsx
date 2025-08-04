"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Activity, Award } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns"
import { ko } from "date-fns/locale"

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
}

interface MonthlyStatsProps {
  records: DailyRecord[]
}

export function MonthlyStats({ records }: MonthlyStatsProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // 선택된 월의 기록들 필터링
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)

  const monthlyRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= monthStart && recordDate <= monthEnd
  })

  // 이전 달 기록들
  const prevMonth = subMonths(selectedMonth, 1)
  const prevMonthStart = startOfMonth(prevMonth)
  const prevMonthEnd = endOfMonth(prevMonth)

  const prevMonthRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= prevMonthStart && recordDate <= prevMonthEnd
  })

  // 음식별 통계 계산
  const foodStats = monthlyRecords.reduce(
    (acc, record) => {
      if (!record.food || record.symptoms === "없음") return acc

      if (!acc[record.food]) {
        acc[record.food] = {
          food: record.food,
          totalReactions: 0,
          totalRecords: 0,
          severitySum: 0,
          maxSeverity: 0,
          symptoms: new Set(),
        }
      }

      acc[record.food].totalRecords++
      if (record.symptoms !== "없음") {
        acc[record.food].totalReactions++
        acc[record.food].severitySum += record.severity || 0
        acc[record.food].maxSeverity = Math.max(acc[record.food].maxSeverity, record.severity || 0)
        acc[record.food].symptoms.add(record.symptoms)
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const foodStatsArray = Object.values(foodStats)
    .map((stat: any) => ({
      ...stat,
      reactionRate: stat.totalRecords > 0 ? (stat.totalReactions / stat.totalRecords) * 100 : 0,
      avgSeverity: stat.totalReactions > 0 ? stat.severitySum / stat.totalReactions : 0,
      symptoms: Array.from(stat.symptoms),
    }))
    .sort((a, b) => b.reactionRate - a.reactionRate)

  // 월간 요약 통계
  const totalReactions = monthlyRecords.filter((r) => r.symptoms !== "없음").length
  const avgSeverity =
    monthlyRecords.length > 0
      ? monthlyRecords.reduce((sum, r) => sum + (r.severity || 0), 0) / monthlyRecords.length
      : 0

  const prevTotalReactions = prevMonthRecords.filter((r) => r.symptoms !== "없음").length
  const prevAvgSeverity =
    prevMonthRecords.length > 0
      ? prevMonthRecords.reduce((sum, r) => sum + (r.severity || 0), 0) / prevMonthRecords.length
      : 0

  // 일별 트렌드 데이터
  const dailyTrend = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => {
    const dayRecords = monthlyRecords.filter(
      (r) => format(new Date(r.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
    )
    const reactions = dayRecords.filter((r) => r.symptoms !== "없음")

    return {
      date: format(day, "MM/dd"),
      reactions: reactions.length,
      avgSeverity:
        reactions.length > 0 ? reactions.reduce((sum, r) => sum + (r.severity || 0), 0) / reactions.length : 0,
    }
  })

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"]

  return (
    <div className="space-y-6">
      {/* 월 선택 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-orange-800">월간 통계</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
            이전 달
          </Button>
          <span className="font-medium px-4">{format(selectedMonth, "yyyy년 MM월", { locale: ko })}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
            disabled={selectedMonth >= startOfMonth(new Date())}
          >
            다음 달
          </Button>
        </div>
      </div>

      {/* 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 반응 횟수</p>
                <p className="text-2xl font-bold">{totalReactions}회</p>
                {prevTotalReactions !== 0 && (
                  <p
                    className={`text-sm flex items-center gap-1 ${
                      totalReactions < prevTotalReactions ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totalReactions < prevTotalReactions ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    전월 대비 {Math.abs(totalReactions - prevTotalReactions)}회
                  </p>
                )}
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 심각도</p>
                <p className="text-2xl font-bold">{avgSeverity.toFixed(1)}점</p>
                {prevAvgSeverity !== 0 && (
                  <p
                    className={`text-sm flex items-center gap-1 ${
                      avgSeverity < prevAvgSeverity ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {avgSeverity < prevAvgSeverity ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    전월 대비 {Math.abs(avgSeverity - prevAvgSeverity).toFixed(1)}점
                  </p>
                )}
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">위험 음식</p>
                <p className="text-2xl font-bold">{foodStatsArray.filter((f) => f.reactionRate > 50).length}개</p>
                <p className="text-sm text-gray-500">반응률 50% 이상</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">안전 음식</p>
                <p className="text-2xl font-bold">{foodStatsArray.filter((f) => f.reactionRate < 20).length}개</p>
                <p className="text-sm text-gray-500">반응률 20% 미만</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="food-analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="food-analysis">음식별 분석</TabsTrigger>
          <TabsTrigger value="daily-trend">일별 추이</TabsTrigger>
          <TabsTrigger value="recommendations">개선 제안</TabsTrigger>
        </TabsList>

        <TabsContent value="food-analysis" className="space-y-4">
          {/* 음식별 위험도 랭킹 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                음식별 위험도 랭킹
              </CardTitle>
              <CardDescription>반응률과 평균 심각도를 기준으로 정렬</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {foodStatsArray.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">이번 달 기록이 없습니다.</p>
                ) : (
                  foodStatsArray.map((food, index) => (
                    <div key={food.food} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0
                              ? "bg-red-500"
                              : index === 1
                                ? "bg-orange-500"
                                : index === 2
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{food.food}</h3>
                          <p className="text-sm text-gray-600">
                            {food.totalRecords}회 섭취 중 {food.totalReactions}회 반응
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              food.reactionRate > 70 ? "destructive" : food.reactionRate > 30 ? "secondary" : "default"
                            }
                          >
                            {food.reactionRate.toFixed(0)}% 반응률
                          </Badge>
                          <Badge variant="outline">평균 {food.avgSeverity.toFixed(1)}점</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">주요 증상: {food.symptoms.join(", ")}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 반응률 차트 */}
          {foodStatsArray.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>음식별 반응률</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={foodStatsArray.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="food" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, "반응률"]} />
                    <Bar dataKey="reactionRate" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="daily-trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>일별 반응 추이</CardTitle>
              <CardDescription>이번 달 일별 알레르기 반응 패턴</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="reactions" stroke="#f97316" strokeWidth={2} name="반응 횟수" />
                  <Line type="monotone" dataKey="avgSeverity" stroke="#ef4444" strokeWidth={2} name="평균 심각도" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                이번 달 발견사항 & 제안
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {foodStatsArray.length === 0 ? (
                <p className="text-center text-gray-500 py-8">분석할 데이터가 부족합니다.</p>
              ) : (
                <>
                  {/* 위험 음식 경고 */}
                  {foodStatsArray.filter((f) => f.reactionRate > 70).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">⚠️ 주의가 필요한 음식</h4>
                      <ul className="space-y-1">
                        {foodStatsArray
                          .filter((f) => f.reactionRate > 70)
                          .map((food) => (
                            <li key={food.food} className="text-sm text-red-700">
                              • <strong>{food.food}</strong>: {food.reactionRate.toFixed(0)}% 반응률 (평균{" "}
                              {food.avgSeverity.toFixed(1)}점)
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* 안전 음식 */}
                  {foodStatsArray.filter((f) => f.reactionRate < 20 && f.totalRecords >= 3).length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ 비교적 안전한 음식</h4>
                      <ul className="space-y-1">
                        {foodStatsArray
                          .filter((f) => f.reactionRate < 20 && f.totalRecords >= 3)
                          .map((food) => (
                            <li key={food.food} className="text-sm text-green-700">
                              • <strong>{food.food}</strong>: {food.reactionRate.toFixed(0)}% 반응률 (
                              {food.totalRecords}회 섭취)
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* 개선 트렌드 */}
                  {prevAvgSeverity > 0 && avgSeverity < prevAvgSeverity && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📈 좋은 소식!</h4>
                      <p className="text-sm text-blue-700">
                        이번 달 평균 심각도가 지난달 대비 {(prevAvgSeverity - avgSeverity).toFixed(1)}점 감소했어요.
                        관리가 잘 되고 있는 것 같아요!
                      </p>
                    </div>
                  )}

                  {/* 병원 방문 제안 */}
                  {foodStatsArray.some((f) => f.maxSeverity >= 8) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">🏥 전문의 상담 권장</h4>
                      <p className="text-sm text-yellow-700">
                        이번 달 심각도 8점 이상의 반응이 있었어요. 소아과나 알레르기 전문의와 상담해보시는 것을
                        권장합니다.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
