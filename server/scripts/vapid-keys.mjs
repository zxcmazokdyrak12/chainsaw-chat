// prints a fresh VAPID key pair for push notifications: `npm run vapid:keys`
import crypto from 'node:crypto'
const ecdh = crypto.createECDH('prime256v1')
ecdh.generateKeys()
console.log(`VAPID_PUBLIC_KEY=${ecdh.getPublicKey().toString('base64url')}`)
console.log(`VAPID_PRIVATE_KEY=${ecdh.getPrivateKey().toString('base64url')}`)
console.log('VAPID_SUBJECT=mailto:you@example.com')
