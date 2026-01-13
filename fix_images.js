
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Získání cesty k aktuálnímu adresáři v ES modulech
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cesta k public složce
const publicDir = path.join(__dirname, 'public', 'images');

function renameToLowercase(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Složka neexistuje: ${dir}`);
        return;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const oldPath = path.join(dir, item);
        const newItem = item.toLowerCase();
        const newPath = path.join(dir, newItem);

        // 1. Přejmenování (pokud se liší jen velikostí písmen)
        if (oldPath !== newPath) {
            console.log(`Přejmenovávám: ${item} -> ${newItem}`);
            fs.renameSync(oldPath, newPath);
        }

        // 2. Pokud je to složka, jdi dovnitř (rekurze)
        if (fs.statSync(newPath).isDirectory()) {
            renameToLowercase(newPath);
        }
        // 3. Pokud je to soubor, ujisti se, že přípona je .png
        else if (newItem.endsWith('.png') || newItem.endsWith('.jpg') || newItem.endsWith('.jpeg')) {
            // Zde už je 'newItem' lowercase, takže přípona je taky lowercase.
            // Pokud by byla .PNG, už se to opravilo v kroku 1.
        }
    }
}

console.log("Začínám opravu názvů souborů...");
renameToLowercase(publicDir);
console.log("Hotovo! Všechny obrázky a složky by měly být malými písmeny.");
