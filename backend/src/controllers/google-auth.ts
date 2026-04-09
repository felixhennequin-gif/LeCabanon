import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Exchange Google OAuth code for tokens
// Frontend sends the authorization code after Google redirect
export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "Code d'autorisation manquant" });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret) {
      res.status(500).json({ error: "Google OAuth non configuré" });
      return;
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      res.status(401).json({ error: "Échec de l'authentification Google" });
      return;
    }

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json() as {
      id: string; email: string; given_name?: string; family_name?: string; picture?: string;
    };

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: googleUser.email },
        ],
      },
    });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.id, photo: user.photo || googleUser.picture },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || "",
          lastName: googleUser.family_name || "",
          googleId: googleUser.id,
          photo: googleUser.picture,
        },
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, photo: user.photo },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}
