// src/components/Savings.tsx
import React from 'react'
import { ArrowUpRightIcon } from '@heroicons/react/24/outline'
import { useData } from '../context/DataContext'

const Savings = () => {
  const { lists } = useData()

  const totalSavings = lists.reduce((acc, list) => {
    return (
      acc +
      list.items.reduce((sum: number, item: any) => {
        return sum + (item.originalPrice && item.currentPrice
          ? item.originalPrice - item.currentPrice
          : 0)
      }, 0)
    )
  }, 0)

  return (
    <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
      {/* Ícone circular */}
      <div className="bg-yellow-100 rounded-full p-3">
        <ArrowUpRightIcon className="h-6 w-6 text-yellow-500" />
      </div>

      {/* Texto */}
      <div>
        <p className="text-gray-500 text-sm">Economia total</p>
        <p className="text-2xl font-bold text-gray-900">
          R$ {totalSavings.toFixed(2)}
        </p>
      </div>
    </div>
  )
}

export default Savings
