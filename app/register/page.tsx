'use client'
import { useState } from 'react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  return <div>REGISTER OK — {email}</div>
}
