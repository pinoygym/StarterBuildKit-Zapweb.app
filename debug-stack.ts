import { stackServerApp } from "./stack/server";

console.log("Keys:", Object.keys(stackServerApp));
console.log("Prototype Keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(stackServerApp)));

// Check for deep internals
// @ts-ignore
const internal = stackServerApp.urls;
console.log("URLs:", internal);
