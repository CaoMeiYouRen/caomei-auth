import { auth } from '@/lib/auth'

export default defineEventHandler((event) => auth.handler(toWebRequest(event)))
