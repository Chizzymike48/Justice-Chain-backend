export const validators = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  isPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\d{10,}$/
    return phoneRegex.test(phone)
  },
}

export default validators
