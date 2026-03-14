// Backend Validators stub
export const validateString = (value: string, minLength = 0): boolean => {
  return typeof value === 'string' && value.length >= minLength
}

export const validateNumber = (value: unknown): boolean => {
  return typeof value === 'number' && !isNaN(value)
}
