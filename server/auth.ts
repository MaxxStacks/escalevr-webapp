import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "rv-track-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      httpOnly: true,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Send without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login attempt for:', req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.log('Login error:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('Authentication failed:', info);
        return res.status(401).json(info);
      }

      console.log('User authenticated successfully:', user.username);
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.log('Session creation error:', loginErr);
          return next(loginErr);
        }
        
        console.log('Session created, session ID:', req.sessionID);
        console.log('Is authenticated after login:', req.isAuthenticated());
        
        // Send without password
        const { password, ...userWithoutPassword } = user;
        
        // Set a stronger cookie with longer expiration
        if (req.session) {
          req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        }
        
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('GET /api/user - isAuthenticated:', req.isAuthenticated());
    console.log('Session:', req.session);
    if (req.session) {
      console.log('Session ID:', req.sessionID);
    }
    if (req.user) {
      console.log('User in session:', req.user.username);
    }
    
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Send without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}
