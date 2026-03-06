import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcryptjs";
import { config } from "../config.js";
import { User } from "../models/User.js";

function normalizeEmail(raw, fallback) {
  if (raw && typeof raw === "string") return raw.trim().toLowerCase();
  return fallback;
}

async function findOrCreateOAuthUser({ provider, email, username, avatarUrl }) {
  let user = await User.findOne({ email });

  if (!user) {
    const passwordHash = await bcrypt.hash(`${provider}-oauth`, 10);
    user = await User.create({
      email,
      passwordHash,
      username,
      avatar_url: avatarUrl || "",
    });
  }

  if (avatarUrl && !user.avatar_url) {
    user.avatar_url = avatarUrl;
    await user.save();
  }

  return user;
}

export function configurePassport() {
  if (config.googleClientId && config.googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.googleClientId,
          clientSecret: config.googleClientSecret,
          callbackURL: config.googleCallbackUrl,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = normalizeEmail(profile.emails?.[0]?.value, `google_${profile.id}@oauth.local`);
            const username = profile.displayName || `google_${profile.id}`;
            const avatarUrl = profile.photos?.[0]?.value || "";
            const user = await findOrCreateOAuthUser({ provider: "google", email, username, avatarUrl });
            done(null, user);
          } catch (error) {
            done(error, false);
          }
        }
      )
    );
  }

  if (config.githubClientId && config.githubClientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.githubClientId,
          clientSecret: config.githubClientSecret,
          callbackURL: config.githubCallbackUrl,
          scope: ["user:email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = normalizeEmail(
              profile.emails?.[0]?.value,
              `github_${profile.id}@oauth.local`
            );
            const username = profile.username || profile.displayName || `github_${profile.id}`;
            const avatarUrl = profile.photos?.[0]?.value || "";
            const user = await findOrCreateOAuthUser({ provider: "github", email, username, avatarUrl });
            done(null, user);
          } catch (error) {
            done(error, false);
          }
        }
      )
    );
  }
}

export default passport;
