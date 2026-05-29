/**
 * SM-2 алгоритм интервального повторения (как в Anki)
 * quality: 0 = полный провал, 5 = идеально
 */
export function calculateNextReview(
  quality: number,
  easeFactor: number,
  intervalDays: number,
  repetitions: number
) {
  // Не даём easeFactor упасть ниже 1.3
  const newEase = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  let newInterval: number
  let newRepetitions = repetitions

  if (quality < 3) {
    // Провал — начинаем заново
    newInterval = 1
    newRepetitions = 0
  } else {
    newRepetitions++
    if (repetitions === 0) newInterval = 1
    else if (repetitions === 1) newInterval = 6
    else newInterval = Math.round(intervalDays * newEase)
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    easeFactor: Math.round(newEase * 100) / 100,
    intervalDays: newInterval,
    repetitions: newRepetitions,
    nextReviewAt: nextReview.toISOString(),
  }
}

// Конвертация оценки пользователя (1-4) в качество SM-2 (0-5)
export function ratingToQuality(rating: 1 | 2 | 3 | 4): number {
  const map = { 1: 0, 2: 2, 3: 4, 4: 5 }
  return map[rating]
}

// Метки для кнопок повторения
export const REVIEW_LABELS = {
  1: { text: 'Не знал', color: '#E24B4A', days: 'завтра' },
  2: { text: 'Трудно', color: '#BA7517', days: 'через 3 дня' },
  3: { text: 'Хорошо', color: '#378ADD', days: 'через неделю' },
  4: { text: 'Отлично!', color: '#1D9E75', days: 'через 2 недели' },
}
