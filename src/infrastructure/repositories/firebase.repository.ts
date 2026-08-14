import { firebaseAdmin } from "@/lib/firebase"

export const verifyFirebaseToken = async (idToken: string) => {
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
    return decoded
  } catch {
    return null
  }
}