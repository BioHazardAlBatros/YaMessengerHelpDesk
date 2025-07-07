import fs from 'fs';
import path from 'path';
import type { Settings } from "./types";

const dataPath = path.join(__dirname, process.env.DATADIR);
const POSSIBLE_MAPS = ["userChats", "userThreads"];

export function loadSettings(filename:string = "bot_data"): Settings | boolean
{
    const fullPath: string = path.join(dataPath, filename);
    if (!fs.existsSync(fullPath)) {
        console.error(`Couldn't find file ${fullPath}. Falling back to default settings.`);
        return false;
    }

// Map should be loaded this way - new Map(loadedSettings.userThreads);
    try {
        const data: Settings = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

        //rewrite
        if (data.hasOwnProperty("userChats"))
            data.userChats = new Map(data.userChats);

        return data as Settings;
    }
    catch (fileError) {
        console.error(`Failed to load config, ${fileError}`);
        return false;
    }
};

export function saveSettings(settings: Settings,filename:string = "bot_data"): boolean {
    if (!fs.existsSync(dataPath))
        fs.mkdirSync(dataPath, {recursive:true});

    const fullPath: string = path.join(dataPath, filename);

    //we need a shallow copy because we want to convert the map
    const tempCopy: object = {...settings};

    for (const prop of POSSIBLE_MAPS) {
    // To convert a map to JSON we have to convert it to an array of entries first
        if (settings[prop] instanceof Map)
            tempCopy[prop] = Array.from(settings[prop].entries());
    }

    try {
        fs.writeFileSync(fullPath, JSON.stringify(tempCopy), 'utf-8');
        console.log(`[${new Date().toLocaleString()}] Saved data.`)
        return true;
    }
    catch (fileError) {
        console.error(`Couldn't save settings. ${fileError}`);
        return false;
    }
};

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getKeyByVal<K, V>(map: Map<K, V>, target: V): K | undefined {
    for (const [key, value] of map)
        if (value === target)
            return key;
    return undefined;
}

/*export function findKey<K, V>(m: Map<K, V>, predicate: (v: V) => boolean): K | undefined {
    for (const [k, v] of m)
        if (predicate(v))
            return k;
    return undefined;
}*/

/*function* getMatchingKeys<K, V>(m: Map<K, V>, predicate: (v: V) => boolean): Generator<[K, V]> {
  for (const [k, v] of m) {
    if (predicate(v)) {
        yield [k, v];
    }
  }
}*/

/*
async function downloadFile(url, outputPath) {
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch ${url}. Status: ${response.status}`);
  }

  const fileStream = fs.createWriteStream(outputPath);
  console.log(`Downloading file from ${url} to ${outputPath}`);

  await pipeline(response.body, fileStream);
  console.log('File downloaded successfully');
}
*/