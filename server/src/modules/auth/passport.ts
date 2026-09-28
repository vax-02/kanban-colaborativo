import passport from 'passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { config } from '../../config'

passport.use(
  'google',
  new Strategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    (_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback) => {
      done(null, profile)
    }
  )
)

// El módulo se ejecuta como side-effect para registrar la estrategia.
// Se exporta un objeto vacío para satisfacer importadores que esperan un default.
export default {}