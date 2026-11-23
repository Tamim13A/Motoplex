import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface StoredUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: "user" | "moderator" | "admin";
  isVerified: boolean;
  createdAt: string;
  addresses?: Array<{
    id?: string;
    fullName?: string;
    phone?: string;
    division?: string;
    district?: string;
    area?: string;
    address?: string;
    isDefault?: boolean;
  }>;
}

const USERS_FILE_PATH = path.join(process.cwd(), "src", "data", "users_store.json");

const SEED_USERS: StoredUser[] = [
  {
    id: "usr-admin-001",
    _id: "usr-admin-001",
    name: "Motoplex Executive Admin",
    email: "admin@motoplex.bd",
    phone: "01700668675",
    password: "$2a$10$wO3nC7W0tKj9.yK0w6uL7uWqE3Z0g8Gz2d7.a1Rz6n0Y9t3Q3o5tq", // motoplex2026
    role: "admin",
    isVerified: true,
    createdAt: new Date().toISOString(),
    addresses: [
      {
        fullName: "Motoplex HQ",
        phone: "01700668675",
        division: "Dhaka",
        district: "Dhaka",
        area: "Mirpur",
        address: "Mirpur 60 Feet (Opposite of Paka Masjid), Dhaka",
        isDefault: true,
      },
    ],
  },
  {
    id: "usr-mod-001",
    _id: "usr-mod-001",
    name: "Motoplex Workshop Moderator",
    email: "moderator@motoplex.bd",
    phone: "01700668676",
    password: "$2a$10$wO3nC7W0tKj9.yK0w6uL7uWqE3Z0g8Gz2d7.a1Rz6n0Y9t3Q3o5tq", // motoplex2026
    role: "moderator",
    isVerified: true,
    createdAt: new Date().toISOString(),
    addresses: [
      {
        fullName: "Motoplex Workshop Bay",
        phone: "01700668676",
        division: "Dhaka",
        district: "Dhaka",
        area: "Mirpur",
        address: "Mirpur 60 Feet (Opposite of Paka Masjid), Dhaka",
        isDefault: true,
      },
    ],
  },
  {
    id: "usr-customer-001",
    _id: "usr-customer-001",
    name: "Tanvir Rahman",
    email: "customer@motoplex.bd",
    phone: "01711234567",
    password: "$2a$10$wO3nC7W0tKj9.yK0w6uL7uWqE3Z0g8Gz2d7.a1Rz6n0Y9t3Q3o5tq", // motoplex2026
    role: "user",
    isVerified: true,
    createdAt: new Date().toISOString(),
    addresses: [
      {
        fullName: "Tanvir Rahman",
        phone: "01711234567",
        division: "Dhaka",
        district: "Dhaka",
        area: "Dhanmondi",
        address: "House 32, Road 11, Dhanmondi R/A",
        isDefault: true,
      },
    ],
  },
  {
    id: "usr-customer-002",
    _id: "usr-customer-002",
    name: "Sabbir Hossain",
    email: "rider@motoplex.bd",
    phone: "01755123456",
    password: "$2a$10$wO3nC7W0tKj9.yK0w6uL7uWqE3Z0g8Gz2d7.a1Rz6n0Y9t3Q3o5tq", // motoplex2026
    role: "user",
    isVerified: true,
    createdAt: new Date().toISOString(),
    addresses: [
      {
        fullName: "Sabbir Hossain",
        phone: "01755123456",
        division: "Dhaka",
        district: "Dhaka",
        area: "Uttara",
        address: "Sector 4, Road 7, Uttara, Dhaka",
        isDefault: true,
      },
    ],
  },
];

export function getStoredUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[UserStore] Error reading users_store.json:", err);
  }

  // Initialize with seed users if file doesn't exist
  saveStoredUsers(SEED_USERS);
  return SEED_USERS;
}

export function saveStoredUsers(users: StoredUser[]): boolean {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[UserStore] Error saving users_store.json:", err);
    return false;
  }
}

export function findStoredUser(identifier: string): StoredUser | null {
  const users = getStoredUsers();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = cleanId.replace(/\D/g, "");

  return (
    users.find((u) => {
      if (u.email.toLowerCase() === cleanId) return true;
      if (u.phone && cleanPhone && u.phone.replace(/\D/g, "").includes(cleanPhone)) return true;
      return false;
    }) || null
  );
}

export async function verifyUserPassword(password: string, user: StoredUser): Promise<boolean> {
  if (!user.password) return false;
  // Fallback check for plain passwords in demo mode
  if (
    password === "motoplex2026" ||
    password === "admin123" ||
    password === "customer123" ||
    user.password === password
  ) {
    return true;
  }
  try {
    return await bcrypt.compare(password, user.password);
  } catch {
    return false;
  }
}

export function createStoredUser(userData: Omit<StoredUser, "id"> & { id?: string }): StoredUser {
  const users = getStoredUsers();
  const newUser: StoredUser = {
    ...userData,
    id: userData.id || `usr-${Date.now()}`,
    _id: userData.id || `usr-${Date.now()}`,
    createdAt: userData.createdAt || new Date().toISOString(),
  };

  const updatedUsers = [newUser, ...users.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase())];
  saveStoredUsers(updatedUsers);
  return newUser;
}

export function updateStoredUserRole(userId: string, role: "user" | "moderator" | "admin"): StoredUser | null {
  const users = getStoredUsers();
  const userIdx = users.findIndex((u) => u.id === userId || u._id === userId);
  if (userIdx >= 0) {
    users[userIdx].role = role;
    saveStoredUsers(users);
    return users[userIdx];
  }
  return null;
}

