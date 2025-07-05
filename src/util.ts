import fs from 'fs';
import path from 'path';
import type { Chat, User, Config } from "./types";

export function loadConfig(): Config | undefined
{
    return undefined;
// Map should be loaded this way - new Map(JSON.parse(CONFIG_STRING).userThreads);
};

export function saveConfig(save:Config): boolean {
    return false;
// Map should be saved this way - JSON.stringify(Array.from(save.userThreads));
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