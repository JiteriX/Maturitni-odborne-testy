
// Tento soubor nyní slouží jen pro typy, uživatelé jsou v databázi Firebase.

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
}

// Startovací heslo pro registraci (jak jsi chtěl "01")
export const REGISTRATION_CODE = "01";
