import fs from "node:fs";
import path from "node:path";
import v8 from "node:v8";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PATH = `${__dirname}/sessions`;

const safePath =
  (fn: Function) =>
  (token: string, ...args: any[]) => {
    const callback = args[args.length - 1];
    if (typeof token !== "string") {
      callback(new Error("Invalid session token"));
      return;
    }
    const fileName = path.join(PATH, token);
    if (!fileName.startsWith(PATH)) {
      callback(new Error("Invalid session token"));
      return;
    }
    fn(fileName, ...args);
  };

const readSession = safePath(fs.readFile);
const writeSession = safePath(fs.writeFile);
const deleteSession = safePath(fs.unlink);

class Storage extends Map {
  getData(
    key: string,
    callback: (err: NodeJS.ErrnoException | null, data: any) => void
  ) {
    const value = super.get(key);
    if (value) {
      callback(null, value);
      return;
    }
    readSession(
      key,
      (err: NodeJS.ErrnoException | null, data: NodeJS.ArrayBufferView) => {
        if (err) {
          //TODO if there is an error what the data will be?
          callback(err, data);
          return;
        }
        console.log(`Session loaded: ${key}`);
        const session = v8.deserialize(data);
        console.log("Session from the storage:");
        console.dir(session, { depth: null });
        super.set(key, session);
        callback(null, session);
      }
    );
  }

  saveData(key: string) {
    const value = super.get(key);
    if (value) {
      const data = v8.serialize(value);
      writeSession(key, data, () => {
        console.log(`Session saved: ${key}`);
      });
    }
  }

  deleteData(key: string) {
    console.log("Delete: ", key);
    deleteSession(key, () => {
      console.log(`Session deleted: ${key}`);
    });
  }
}

export default new Storage();
