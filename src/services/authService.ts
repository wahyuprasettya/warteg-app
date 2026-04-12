import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword,
  initializeAuth,
  inMemoryPersistence,
  Auth,
  User,
} from "firebase/auth";
import { getApp, initializeApp } from "firebase/app";

import { firebaseConfig, getFirebaseAuth, isFirebaseConfigured } from "@/firebase/config";

export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);

export const logout = () => signOut(getFirebaseAuth());

const cashierProvisionAppName = "cashier-provisioning";
let cashierProvisionAuth: Auth | null = null;

const getCashierProvisionAuth = () => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase belum dikonfigurasi.");
  }

  if (!cashierProvisionAuth) {
    const app = (() => {
      try {
        return getApp(cashierProvisionAppName);
      } catch {
        return initializeApp(firebaseConfig, cashierProvisionAppName);
      }
    })();

    try {
      cashierProvisionAuth = initializeAuth(app, {
        persistence: inMemoryPersistence,
      });
    } catch {
      cashierProvisionAuth = getAuth(app);
    }
  }

  return cashierProvisionAuth;
};

export const createCashierWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(getCashierProvisionAuth(), email.trim(), password)
    .finally(() => signOut(getCashierProvisionAuth()).catch(() => undefined));

const ownerProvisionAppName = "owner-provisioning";
let ownerProvisionAuth: Auth | null = null;

const getOwnerProvisionAuth = () => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase belum dikonfigurasi.");
  }

  if (!ownerProvisionAuth) {
    const app = (() => {
      try {
        return getApp(ownerProvisionAppName);
      } catch {
        return initializeApp(firebaseConfig, ownerProvisionAppName);
      }
    })();

    try {
      ownerProvisionAuth = initializeAuth(app, {
        persistence: inMemoryPersistence,
      });
    } catch {
      ownerProvisionAuth = getAuth(app);
    }
  }

  return ownerProvisionAuth;
};

export const createOwnerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(getOwnerProvisionAuth(), email.trim(), password)
    .finally(() => signOut(getOwnerProvisionAuth()).catch(() => undefined));

export const resetPasswordEmail = (email: string) =>
  sendPasswordResetEmail(getFirebaseAuth(), email.trim());

export const subscribeAuth = (callback: (user: User | null) => void) => {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(getFirebaseAuth(), callback);
};
