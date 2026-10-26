/**
 * 货币格式化工具函数
 * 
 * 功能:
 * - 根据货币代码格式化价格显示
 * - 支持多种货币符号和格式
 * - 提供统一的货币显示接口
 */

/**
 * 货币符号映射表
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CNY: '¥',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KRW: '₩',
  HKD: 'HK$',
  TWD: 'NT$',
}

/**
 * 货币显示名称映射表
 */
const CURRENCY_NAMES: Record<string, { zh: string; en: string }> = {
  USD: { zh: '美元', en: 'USD' },
  CNY: { zh: '人民币', en: 'CNY' },
  EUR: { zh: '欧元', en: 'EUR' },
  GBP: { zh: '英镑', en: 'GBP' },
  JPY: { zh: '日元', en: 'JPY' },
  KRW: { zh: '韩元', en: 'KRW' },
  HKD: { zh: '港币', en: 'HKD' },
  TWD: { zh: '台币', en: 'TWD' },
}

/**
 * 格式化货币显示
 * 
 * @param amount - 金额数值
 * @param currency - 货币代码（如 'USD', 'CNY'）
 * @param options - 格式化选项
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options: {
    showSymbol?: boolean      // 是否显示货币符号，默认 true
    showCode?: boolean        // 是否显示货币代码，默认 false
    decimals?: number         // 小数位数，默认 2
    locale?: string          // 本地化设置，默认 'en-US'
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimals = 2
  } = options

  // 格式化数值
  const formattedAmount = amount.toFixed(decimals)
  
  // 获取货币符号
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency
  
  // 构建显示字符串
  let result = ''
  
  if (showSymbol) {
    // 对于某些货币，符号放在前面
    if (['USD', 'EUR', 'GBP', 'HKD', 'TWD'].includes(currency.toUpperCase())) {
      result = `${symbol}${formattedAmount}`
    } else {
      // 对于 CNY, JPY, KRW 等，符号可以放在前面或后面
      result = `${symbol}${formattedAmount}`
    }
  } else {
    result = formattedAmount
  }
  
  if (showCode) {
    result += ` ${currency.toUpperCase()}`
  }
  
  return result
}

/**
 * 获取货币符号
 * 
 * @param currency - 货币代码
 * @returns 货币符号
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency
}

/**
 * 获取货币名称
 * 
 * @param currency - 货币代码
 * @param locale - 语言设置 ('zh' | 'en')
 * @returns 货币名称
 */
export function getCurrencyName(currency: string, locale: 'zh' | 'en' = 'en'): string {
  const currencyInfo = CURRENCY_NAMES[currency.toUpperCase()]
  if (!currencyInfo) {
    return currency.toUpperCase()
  }
  return currencyInfo[locale]
}

/**
 * 检查是否为有效的货币代码
 * 
 * @param currency - 货币代码
 * @returns 是否为有效货币代码
 */
export function isValidCurrency(currency: string): boolean {
  return currency.toUpperCase() in CURRENCY_SYMBOLS
}

/**
 * 获取所有支持的货币列表
 * 
 * @returns 货币代码数组
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(CURRENCY_SYMBOLS)
}

/**
 * 格式化价格范围显示
 * 
 * @param minAmount - 最小金额
 * @param maxAmount - 最大金额
 * @param currency - 货币代码
 * @returns 格式化后的价格范围字符串
 */
export function formatPriceRange(
  minAmount: number,
  maxAmount: number,
  currency: string = 'USD'
): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${minAmount.toFixed(2)} - ${symbol}${maxAmount.toFixed(2)}`
}

/**
 * 计算折扣后价格并格式化显示
 * 
 * @param originalPrice - 原价
 * @param discountAmount - 折扣金额
 * @param currency - 货币代码
 * @returns 包含原价和折扣后价格的对象
 */
export function formatDiscountPrice(
  originalPrice: number,
  discountAmount: number,
  currency: string = 'USD'
) {
  const finalPrice = originalPrice - discountAmount
  
  return {
    original: formatCurrency(originalPrice, currency),
    discount: formatCurrency(discountAmount, currency),
    final: formatCurrency(finalPrice, currency),
    finalAmount: finalPrice
  }
}
