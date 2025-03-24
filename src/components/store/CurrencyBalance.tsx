import React from 'react'

export interface CurrencyBalanceProps {
  balance: number
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

export const CurrencyBalance: React.FC<CurrencyBalanceProps> = ({
  balance,
  size = 'medium',
  showLabel = false
}) => {
  // Получаем размеры в зависимости от параметра size
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm'
      case 'large':
        return 'text-xl'
      default:
        return 'text-base'
    }
  }

  return (
    <div className="flex items-center">
      {showLabel && <span className="mr-1 text-gray-600">Баланс:</span>}
      <span className={`font-bold ${getSizeClasses()}`}>
        {balance} <span className="text-yellow-500">⭐</span>
      </span>
    </div>
  )
}
